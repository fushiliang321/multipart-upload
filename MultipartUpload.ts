import { config, configType } from './config'
import CurrentLimiter from './CurrentLimiter'
import { requestAdapterInterface } from './requestAdapters/interface'
import CacheInterface  from './cache/interface'
import FileStream from './fileStream/index'
import WMPFileStream from './fileStream/WeChatMiniProgram'
import { FileStreamInterface } from './fileStream/index.d'

interface Task<T> extends Promise<T>{
    onUploadProgress: (listener: (progress: UploadProgress) => void) => void,
    abort: (reason: any) => void,
    resume: () => Promise<any> | undefined,
    clearCache: () => Promise<any> | undefined,
    multipartUpload?: MultipartUpload
}

function newMultipartUploadTask(fun: Function): Task<any> {
    const task = new Promise(async (resolve, reject) => {
        try {
            resolve(await fun())
        } catch (error) {
            reject(error)
        }
    }) as unknown as Task<any>

    task.onUploadProgress = (listener: (progress: UploadProgress) => void): void => {
        return task.multipartUpload?.onUploadProgress(listener)
    }

    task.abort = (reason: any): void => {
        return task.multipartUpload?.abort(reason)
    }

    task.resume = (): Promise<any> | undefined => {
        return task.multipartUpload?.resume()
    }

    task.clearCache = (): Promise<any> | undefined => {
        return task.multipartUpload?.clearCache()
    }

    return task
}

export enum statusTags {
    uninitialized = 0,//未初始化
    initializing = 1,//初始化中
    uploading = 2,//上传中
    merging = 3,//文件合并中
    completed = 4,//已完成
    abnormal = 5,//执行异常
    abort = 6,//中断
}

type PartETag = {
    ETag: string;
    PartNumber: number;
}

export type UploadProgress = {
    status: statusTags;
    progress: number;
    total: number;
    loaded: number;
}

export type uploadInfo = {
    uploadId: string;
    maxPartSize: number;
    maxFileSize: number;
    requestParams: object;
    progress: number;
    uploadFinishPartSize: number;
    parts: PartETag[];
}

const cacheFileWriteCurrentLimiter = new CurrentLimiter(1) //缓存文件写入限流器

export default class MultipartUpload {
    size: number = 0 //文件大小
    md5: string = '' //文件md5
    fileStream?: FileStreamInterface //文件流

    name: string = '' //文件名
    contentType: string = '' //文件类型

    uploadId: string = '' //上传id

    maxPartSize: number = 0 //最大分片大小
    maxFileSize: number = 0 //最大文件大小

    status: statusTags = statusTags.uninitialized //当前状态

    requestParams: object = {} //合并请求参数

    config: configType ///配置

    requestAdapter: requestAdapterInterface //请求适配器
    requestAbortFuns: Function[] = [] //请求中断方法

    lastResponse?: any //最后响应数据

    progressListeners:((progress: UploadProgress) => void)[] = [] //进度监听列表
    progress: number = 0 //上传进度百分比
    totalBytesSent: number = 0 //总的发送字节数
    uploadFinishPartSize: number = 0 //上传完成的分片大小
    uploadFinishPartNumberMap: Map<number, boolean> = new Map<number, boolean>() //上传完成的分片编号

    parts: PartETag[] = [] //分片上传响应数据

    error?: any //错误信息

    resumeStatusTag: statusTags = statusTags.uninitialized //标记可以恢复的状态

    currentLimiter: CurrentLimiter = new CurrentLimiter(1) //并发限流器

    cache?: CacheInterface
    cacheId?: IDBValidKey

    constructor(requestAdapter: requestAdapterInterface, cache?: CacheInterface) {
		this.requestAdapter = requestAdapter
        this.cache = cache
        this.config = config()
        this.reloadConfig()
    }

    setRequestAdapter(requestAdapter: requestAdapterInterface): void {
        this.requestAdapter = requestAdapter
    }

    setConfig(options?: configType): void {
        if (options) {
            this.config = {
                ...config(),
                ...options
            }
        }else {
            this.config = config()
        }
        this.reloadConfig()
    }

    setCache(cache?: CacheInterface): void {
        this.cache = cache
    }

    reloadConfig(): void {
        this.currentLimiter = new CurrentLimiter(this.config.concurrency)
        this.maxPartSize = this.config.maxPartSize
        this.maxFileSize = this.config.maxFileSize
    }

    fileUniqueKey(): string {
        return this.md5 + '_' + String(this.size)
    }

    async init(retryNum?: number): Promise<boolean> {
        if (this.status != statusTags.initializing) {
            return false
        }

        try {
            const request = this.requestAdapter.init(this.config.api.init, {
                md5: this.md5,
                size: this.size,
            })
            if (request.abort) {
                this.requestAbortFuns.push((reason?: any) => {
                    request.abort && request.abort(reason)
                })
            }
            const response = await request
            if (this.status != statusTags.initializing) {
                return false
            }
            this.lastResponse = response
            if (response.status == 200) {
                const data = response.data
                if (data && data.code) {
                    this.uploadId = data.data.uploadId
                    data.data.MaxPartSize && (this.maxPartSize = data.data.MaxPartSize)
                    data.data.MaxFileSize && (this.maxFileSize = data.data.MaxFileSize)
                    return true
                }
                return false
            }
            console.warn(response)
        } catch (error) {
            console.warn(error)
            this.error = error
        }

        if (retryNum == undefined) {
            retryNum = this.config.retryNum
        }
        if(--retryNum < 0) {
            return false
        }
        await new Promise(resolve => setTimeout(resolve, this.config.retryInterval))

        return await this.init(retryNum)
    }

    async partUpload(file: ArrayBuffer|Uint8Array, number: number, retryNum?: number): Promise<PartETag|false> {
        if (this.status != statusTags.uploading) {
            return false
        }
        let presentBytesSent = 0 //当前已发送的字节数
        try {
            let reqEndFlag = false //请求结束标记
            const size = file.byteLength
            const request = this.requestAdapter.part(this.config.api.part, file, {
                uploadId: this.uploadId,
                number: number,
            }, e => {
                if (this.status != statusTags.uploading || reqEndFlag) {
                    return false
                }
                let n = Number(e.loaded)
                if (n > 0) {
                    n = (n > size ? size : n)
                    this.addTotalBytesSent(n - presentBytesSent)
                    presentBytesSent = n
                }
            })
            if (request.abort) {
                this.requestAbortFuns.push((reason: any) => {
                    !reqEndFlag && request.abort && request.abort(reason)
                })
            }
            const response = await request
            reqEndFlag = true
            if (this.status != statusTags.uploading) {
                this.addTotalBytesSent(-presentBytesSent)
                return false
            }

            this.lastResponse = response
            if (response.status == 200) {
                const data = response.data
                if (data && data.code) {
                    if (presentBytesSent < size) {
                        this.addTotalBytesSent(size - presentBytesSent)
                    }
                    return {
                        ETag: data.data.ETag,
                        PartNumber: data.data.PartNumber,
                    }
                }
                this.addTotalBytesSent(-presentBytesSent)
                return false
            }

            console.warn(response)
        } catch (error) {
            console.warn(error)

            this.addTotalBytesSent(-presentBytesSent)
            this.error = error
        }
        if (this.status != statusTags.uploading) {
            return false
        }
        if (retryNum == undefined) {
            retryNum = this.config.retryNum
        }
        if(--retryNum < 0) {
            return false
        }
        await new Promise(resolve => setTimeout(resolve, this.config.retryInterval))
        return await this.partUpload(file, number, retryNum)
    }

    async part(): Promise<boolean> {
        if (!this.fileStream) {
            return false
        }

        if (this.uploadFinishPartNumberMap.size > 0) {
            //续传
        }else{
            //新的上传
            this.totalBytesSent = 0
            this.uploadFinishPartSize = 0
            this.progress = 0
            this.parts = []
            this.uploadFinishPartNumberMap = new Map<number, boolean>()
        }

        let over = false
        const abort = (reason?: any) => {
            if(over) {
                return
            }
            over = true
            for (const fun of this.requestAbortFuns) {
                fun && fun(reason)
            }
        }

        const taskList: Promise<PartETag|false>[] = []

        let i = 0
        while(this.uploadFinishPartNumberMap.has(++i)) {}
        const start = (i-1) * this.maxPartSize //从文件的指定位置开始读取

        await this.fileStream.read(async (data, done) => {
            const number = i++
            if (over) {
                return false
            }

            if (this.uploadFinishPartNumberMap.has(number) || !data.byteLength) {
                return true
            }

            await this.currentLimiter.pop()
            if (over) {
                this.currentLimiter.push()
                return false
            }

            taskList.push(new Promise(async (resolve, reject) => {
                let notPush = true
                try {
                    const response = await this.partUpload(data, number)
                    this.currentLimiter.push()
                    notPush = false
                    if(response) {
                        this.uploadProgressInc(data.byteLength)
                        this.parts.push(response)
                        this.uploadFinishPartNumberMap.set(number, true)

                        if (this.cache && this.cacheId) {
                            await this.cache.update(this.cacheId, {
                                status: this.status,
                                uploadInfo: this.getUploadInfo()
                            })
                        }
                    } else {
                        abort()
                    }
                    resolve(response)
                } catch (error) {
                    notPush && this.currentLimiter.push()
                    abort()
                    reject(error)
                }
            }))
            return true
        }, this.maxPartSize, start)

        await Promise.all(taskList)

        if (over || this.status != statusTags.uploading) {
            return false
        }

        return true
    }

    async complete(retryNum?: number): Promise<boolean|any> {
        if (this.status != statusTags.merging) {
            return false
        }

        try {
            const request = this.requestAdapter.complete(this.config.api.complete, {
                uploadId: this.uploadId,
                contentType: this.contentType,
                fileName: this.name,
                parts: this.parts,
                ...this.requestParams,
            })

            const requestAbortFun = (reason: any) => {
                request.abort && request.abort(reason)
            }
            if (request.abort) {
                this.requestAbortFuns.push(requestAbortFun)
            }
            const response = await request
            if (this.status != statusTags.merging) {
                return false
            }
            this.lastResponse = response

            if (response.status == 200) {
                const data = response.data
                if (data && data.code) {
                    return response
                }
                return false
            }
            console.warn(response)
        } catch (error) {
            console.warn(error)
            this.error = error
        }

        if (retryNum == undefined) {
            retryNum = this.config.retryNum
        }
        if(--retryNum < 0) {
            return false
        }
        await new Promise(resolve => setTimeout(resolve, this.config.retryInterval))

        return await this.complete(retryNum)
    }

    async setFile(file: File|Blob): Promise<boolean> {
        let fileStream: FileStream
        switch (true) {
            case file instanceof File:
                fileStream = new FileStream(file)
                break;
            case file instanceof Blob:
                fileStream = new FileStream(new File([file],'blob'))
                break;
            default:
                return false
        }
        return await this.setFileStream(fileStream)
    }

    async setFileStream(fileStream: FileStreamInterface): Promise<boolean> {
        if (this.status != statusTags.uninitialized) {
            return false
        }

        let currentLimiterAwait
        if (this.cache && this.config.assureCacheFileWriteSequence) {
            currentLimiterAwait = cacheFileWriteCurrentLimiter.pop()
        }

        try {
            if (this.config.isCheckoutFileMD5 && !this.md5) {
                this.md5 = await fileStream.md5()
            }
            if (this.status != statusTags.uninitialized) {
                return false
            }
            this.name = fileStream.name
            this.contentType = fileStream.type
            this.size = fileStream.size
            this.fileStream = fileStream
            if(this.cache) {
                if (currentLimiterAwait) {
                    await currentLimiterAwait
                }
                const cacheKey = await this.cache.add(this.fileUniqueKey(), fileStream.getFile(), {
                    name: fileStream.name,
                    size: fileStream.size,
                    md5: this.md5,
                    type: fileStream.type,
                }, this.getUploadInfo())
                if (cacheKey) {
                    this.cacheId = cacheKey
                }
            }
        } catch (error) {
            throw error
        }
        if (currentLimiterAwait) {
            cacheFileWriteCurrentLimiter.push()
        }
        return true
    }

    reset(): void {
        this.setStatus(statusTags.uninitialized)
        this.resumeStatusTag = statusTags.uninitialized
        this.requestAbortFuns = []
        this.lastResponse = undefined
        this.parts = []
        this.progress = 0
        this.totalBytesSent = 0
        this.uploadFinishPartSize = 0
        this.error = undefined
        this.uploadFinishPartNumberMap = new Map<number, boolean>()
        this.fileStream = undefined
        this.md5 = ""
    }

    newMultipartUploadTask(fun: Function): Task<any> {
        const task = newMultipartUploadTask(async () => {
            return await fun()
        })
        task.multipartUpload = this
        return task
    }

    upload(file: Blob|FileStreamInterface, requestParams: object = {}): Task<any>  {
        return this.newMultipartUploadTask(async () => {
            if (this.status == statusTags.initializing ||
                this.status == statusTags.uploading ||
                this.status == statusTags.merging) {
                    //进行中的不能上传
                return false
            }
            this.reset()
            this.requestParams = requestParams

            switch (true) {
                case file instanceof FileStream:
                case file instanceof WMPFileStream:
                    if (!await this.setFileStream(file as WMPFileStream)) {
                        return false
                    }
                    break;
                case file instanceof Blob:
                    if (!await this.setFile(file)) {
                        return false
                    }
                    break;
                default:
                    return false
            }
            return await this._handle()
        })
    }

    resume(): Task<any>{
        return this.newMultipartUploadTask(async () => {
            switch (this.status) {
                case statusTags.completed:
                    //完成
                    return this.lastResponse
                case statusTags.abnormal:
                case statusTags.abort:
                    //只能恢复中断或者异常的状态
                    return await this._handle()
                default:
                    return false
            }
        })
    }

    handle(): Task<any> {
        return this.newMultipartUploadTask(async () => {
            return await this._handle()
        })
    }

    async _handle(): Promise<any>  {
        let res = false
        let isTrue = this.resumeStatusTag == statusTags.uninitialized
        if (isTrue &&
            this.status !== statusTags.uninitialized) {
            console.warn('当前状态无法上传')
            return res
        }

        isTrue = isTrue || this.resumeStatusTag == statusTags.initializing

        if (isTrue) {
            this.setStatus(statusTags.initializing)
            if (this.cache && this.cacheId) {
                await this.cache.update(this.cacheId, {
                    status: this.status,
                })
            }
            this.requestAbortFuns = []
            if(!await this.init()) {
                this.requestAbortFuns = []
                this.resumeStatusTag = statusTags.initializing
                this.setStatus(statusTags.abnormal)
                console.warn('初始化失败')
                return res
            }
        }

        isTrue = isTrue || this.resumeStatusTag == statusTags.uploading
        if (isTrue) {
            this.setStatus(statusTags.uploading)
            if (this.cache && this.cacheId) {
                await this.cache.update(this.cacheId, {
                    status: this.status,
                    uploadInfo: this.getUploadInfo()
                })
            }
            this.requestAbortFuns = []
            if(!await this.part()) {
                this.requestAbortFuns = []
                this.resumeStatusTag = statusTags.uploading
                this.setStatus(statusTags.abnormal)
                console.warn('上传失败')
                return res
            }
        }

        isTrue = isTrue || this.resumeStatusTag == statusTags.merging
        if (isTrue) {
            this.setStatus(statusTags.merging)
            if (this.cache && this.cacheId) {
                await this.cache.update(this.cacheId, {
                    status: this.status,
                })
            }
            this.requestAbortFuns = []
            const completeRes = await this.complete()
            if(!completeRes) {
                this.requestAbortFuns = []
                this.resumeStatusTag = statusTags.merging
                this.setStatus(statusTags.abnormal)
                console.warn('合并失败')
                return res
            }
            res = completeRes
        }
        this.setStatus(statusTags.completed)
        if (this.cache && this.cacheId) {
            // 合并成功，清除缓存
            await this.cache.delete(this.cacheId)
        }
        this.resumeStatusTag == statusTags.completed
        this.requestAbortFuns = []
        return res
    }

    getUploadInfo() :uploadInfo {
        return {
            uploadId: this.uploadId,
            maxPartSize: this.maxPartSize,
            maxFileSize: this.maxFileSize,
            requestParams: this.requestParams,
            progress: this.progress,
            uploadFinishPartSize: this.uploadFinishPartSize,
            parts: this.parts,
        }
    }

    abort(reason: any): void {
        if (this.status != statusTags.uploading &&
            this.status != statusTags.merging &&
            this.status != statusTags.initializing) {
                this.setStatus(statusTags.abort)
                return
        }
        this.setStatus(statusTags.abort)
        for (const fun of this.requestAbortFuns) {
            fun && fun(reason)
        }
    }

    setStatus(status: statusTags): void {
        this.status = status
        this.triggerUploadProgress()
    }

    addTotalBytesSent(size: number): void {
        this.totalBytesSent += size
        this.triggerUploadProgress()
    }

    uploadProgressInc(size: number): void {
        const n = Number(size)
        if (n > 0) {
            this.uploadFinishPartSize += Number(size)
            this.triggerUploadProgress()
        }
    }

    triggerUploadProgress(): void {
        //上传中的时候取总的上传大小，其他状态的取已上传完成的分片大小
        const loaded: number = (this.status == statusTags.uploading) ? this.totalBytesSent : this.uploadFinishPartSize
        this.progress = loaded / this.size
        const info: UploadProgress = {
            status: this.status,
            progress: this.progress,
            total: this.size,
            loaded: loaded,
        }
        for (const listener of this.progressListeners) {
            listener(info)
        }
    }

    onUploadProgress(listener: (progress: UploadProgress) => void): void {
        this.progressListeners.push(listener)
    }

    async clearCache(): Promise<boolean> {
        if (this.cache && this.cacheId) {
            return this.cache.delete(this.cacheId)
        }
        return true
    }
}
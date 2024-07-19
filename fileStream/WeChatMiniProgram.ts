import { FileStreamInterface, readCallBackFunction } from './index.d'

let fileSystemManager: FileSystemManager

function getFileSystemManager() {
    if (!fileSystemManager && wx) {
        fileSystemManager = wx.getFileSystemManager()
    }
    return fileSystemManager
}

export default class FileStream implements FileStreamInterface{
    private path: string
    private _md5?: string
    name: string
    type: string
    size: number

    constructor(path: string, size: number, name?: string, type?: string) {
        this.path = path
        this.size = size
        if (name === undefined || name === '') {
            name = path.split('/').pop() ?? ''
        }
        this.name = name
        this.type = type ?? ''
    }

    private async fd() {
        const res: { fd: number } = await new Promise((resolve, reject) => {
            getFileSystemManager().open({
                filePath: this.path,
                success(res: { fd: number }) {
                    resolve(res)
                },
                fail(res: any) {
                    reject(res)
                }
            })
        })
        return res.fd
    }

    async read(callBack: readCallBackFunction, bufferLength?: number, start?: number, end?: number) {
        const fileSystemManager = getFileSystemManager()
        const fd = await this.fd()
        try {
            if (!bufferLength || bufferLength < 1) {
                bufferLength = 1024 * 1024 //默认1M
            }
            if (!start || start < 0) {
                start = 0
            }
            if (!end) {
                end = this.size
            }
            if (start >= this.size) {
                start = this.size - 1
            }
            if (end < start) {
                end = start
            }
            let length: number
            const buffer = new ArrayBuffer(bufferLength)
            let res: {arrayBuffer: ArrayBuffer,bytesRead: number}
            while (start < end) {
                length = bufferLength
                if (length + start > end) {
                    length = end - start
                }
                res = await new Promise((resolve, reject) => {
                    fileSystemManager.read({
                        fd,
                        arrayBuffer: buffer,
                        position: start,
                        offset: 0,
                        length: length,
                        success: (res: {arrayBuffer: ArrayBuffer,bytesRead: number}) => {
                            resolve(res)
                        },
                        fail: (res: any) => {
                            reject(res)
                        }
                    })
                })
                start += length
                if (!await callBack(res.arrayBuffer.slice(0,res.bytesRead), false)) {
                    fileSystemManager.close({fd})
                    return
                }
            }
            await callBack(new ArrayBuffer(0), true)
        } catch (error) {
            fileSystemManager.close({fd})
            throw error
        }
        fileSystemManager.close({fd})
    }

    getFile(): File {
        //返回文件的ArrayBuffer数据
        return getFileSystemManager().readFileSync(this.path)
    }

    async md5(): Promise<string> {
        if (!this._md5) {
            this._md5 = await new Promise((resolve, reject) => {
                getFileSystemManager().getFileInfo({
                    filePath: this.path,
                    digestAlgorithm: 'md5',
                    success: res => {
                        resolve(res.digest)
                    },
                    fail: res => {
                        reject(res)
                    }
                })
            })
        }
        return this._md5 as string
    }
}
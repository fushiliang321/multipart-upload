import cache from './cache'
import { freeStorageSpace } from './common'
import QuotaExceededError from './QuotaExceededError'
import { statusTags, uploadInfo } from '../MultipartUpload'
import CacheInterface from './interface'

export type fileInfo = {
    name: string,
    size: number,
    md5: string,
    type: string,
}

export type progress = {
    key?: string,
    id?: IDBValidKey,
    group?: string,
    status?: statusTags,
    fileInfo?: fileInfo,
    uploadInfo?: uploadInfo
}

export default class Group implements CacheInterface {
    groupName: string = 'default'
    
    constructor(groupName: string = 'default'){
        this.groupName = String(groupName)
    }

    async add(key: string, file: File, fileInfo: fileInfo, uploadInfo?: uploadInfo): Promise<IDBValidKey|false> {
        const free = await freeStorageSpace()
        if (free.quotaAvailable - file.size <= 0) {
            throw new QuotaExceededError('存储空间不足,' + String(free.quotaAvailable - file.size))
        }

        try {
            const progress: progress = {
                key,
                group: this.groupName,
                status: statusTags.uninitialized,
                fileInfo,
                uploadInfo
            }
            const res = await Promise.all([
                cache.file.set(key, file),
                cache.progress.add(progress)
            ])
            return res[1]
        } catch (error) {
            if (error.code == DOMException.QUOTA_EXCEEDED_ERR && error.name == 'QuotaExceededError') {
                throw new QuotaExceededError('存储空间不足，' + error.message)
            }
            throw error
        }
    }

    async update(id: IDBValidKey, progress: progress): Promise<boolean> {
        return (await cache.progress.set(id, progress)) !== false
    }

    async getAll(): Promise<progress[]>  {
        return await cache.progress.getIndexAll('group', this.groupName)
    }

    async getByKey(id: IDBValidKey): Promise<progress|undefined> {
        return await cache.progress.get(id)
    }

    async getFile(key: string): Promise<File|undefined> {
        return (await cache.file.get(key))?.file
    }

    //删除指定key的数据
    async delete(id: IDBValidKey): Promise<boolean>  {
        const progress = (await cache.progress.get(id))as progress|undefined
        if (!progress) {
            return true
        }
        if (!await cache.progress.delete(id)) {
            return false
        }
        const key = progress?.key
        if (!key) {
            return true
        }
        //删除成功后需要判断是否还有其他数据也存在该key
        if ((await cache.progress.count('key', key)) !== 0) {
            return true
        }

        //没有其他数据存在该key，则删除该key对应的文件
        cache.file.delete(key)
        
        return true
    }
}
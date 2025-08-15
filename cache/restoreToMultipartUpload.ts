import { defaultAdapter, defaultFileCache } from "..";
import MultipartUpload, { statusTags, uploadInfo } from "../MultipartUpload";
import { requestAdapterInterface } from "../requestAdapters/interface";
import { progress } from "./group";
import CacheInterface from "./interface";

//恢复上传信息
export function restoreUploadInfo(multipartUpload: MultipartUpload, uploadInfo: uploadInfo ) {
    for (const key in uploadInfo) {
        if (key in multipartUpload) {
        }
        if (multipartUpload.hasOwnProperty(key)) {
            (multipartUpload as any)[key] = (uploadInfo as any)[key]
        }
    }

    if (multipartUpload.parts) {
        //恢复已上传分片
        for (const part of multipartUpload.parts) {
            multipartUpload.uploadFinishPartNumberMap.set(part.PartNumber, true)
        }
    }
}

//缓存数据恢复成分片上传任务对象
export async function cacheToMultipartUpload(cacheData: progress, requestAdapter: requestAdapterInterface, cache: CacheInterface): Promise<MultipartUpload|undefined> {
    const key = cacheData.key
    if (!key) {
        return
    }
    if (cacheData.status === undefined || !(cacheData.status in statusTags)) {
        //状态数据错误，清除进度缓存
        console.log('状态数据错误，清除进度缓存')
        cacheData.id && await cache.delete(cacheData.id)
        return
    }
    const cacheFile = await cache.getFile(key)
    if (!(cacheFile instanceof File)) {
        //没有文件数据，清除进度缓存
        console.log('没有文件数据，清除进度缓存')
        cacheData.id && await cache.delete(cacheData.id)
        return
    }
    const file = new File([cacheFile], cacheData.fileInfo?.name ?? cacheFile.name, cacheData.fileInfo)
    const multipartUpload = new MultipartUpload(requestAdapter)
    //移除默认的缓存配置，避免设置文件信息的时候重复缓存
    multipartUpload.setCache(undefined)
    cacheData.uploadInfo && restoreUploadInfo(multipartUpload, cacheData.uploadInfo)
    if(cacheData.fileInfo?.hash) {
        multipartUpload.hash = cacheData.fileInfo?.hash
    }
    await multipartUpload.setFile(file)

    multipartUpload.resumeStatusTag = cacheData.status
    multipartUpload.totalBytesSent = cacheData.uploadInfo?.uploadFinishPartSize ?? 0
    multipartUpload.status = statusTags.abort
    multipartUpload.setCache(cache)
    multipartUpload.cacheId = cacheData.id
    return multipartUpload
}

//所有缓存数据恢复成分片上传任务对象
export default async (requestAdapter?: requestAdapterInterface, cache?: CacheInterface): Promise<MultipartUpload[]> => {
    if (!cache) {
        cache = defaultFileCache()
        if (!cache) {
            return []
        }
    }
    if (!requestAdapter) {
        requestAdapter = defaultAdapter()
    }
    const progressList = await cache.getAll()
    const list: Promise<MultipartUpload|undefined>[] = []
    for (const progress of progressList) {
        list.push(cacheToMultipartUpload(progress, requestAdapter, cache))
    }

    const multipartUploads = await Promise.all(list)

    return multipartUploads.filter(item=> item !== undefined) as MultipartUpload[]
}
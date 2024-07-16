import axios from "axios"
import { abortPromiseInterface, requestAdapterInterface } from './interface'
import CacheInterface from "../cache/interface"
import MultipartUpload from "../MultipartUpload"

export function New(adapterConfig: object = {}, cache?: CacheInterface): MultipartUpload {
    return new MultipartUpload(new requestAdapter(adapterConfig), cache)
}

//请求处理方法
export default class requestAdapter implements requestAdapterInterface{
    requestInstance
    
    constructor(config: object = {}) {
        this.requestInstance = axios.create(config)
    }

    init(url: string, params: object): abortPromiseInterface {
        const controller = new AbortController()
        const signal = controller.signal
        const req = this.requestInstance.post(url, params, {signal})
        req.abort = (reason: any) => controller.abort(reason)
        return req
    }
    
    part(url: string, file: File|Blob, params: object, onUploadProgress: (e: any) => void): abortPromiseInterface {
        const formData = new FormData()
        formData.append('file', file)
        const controller = new AbortController()
        const signal = controller.signal
        const req = this.requestInstance.post(url, formData, {
            signal,
            params,
            onUploadProgress: (e: any) => {
                onUploadProgress({
                    progress: e.progress,
                    total: e.total,
                    loaded: e.loaded,
                })
            }
        })
        req.abort = (reason: any) => controller.abort(reason)
        return req
    }

    complete(url: string, params: object): abortPromiseInterface  {
        const controller = new AbortController()
        const signal = controller.signal
        const req = this.requestInstance.post(url, params, {signal})
        req.abort = (reason: any) => controller.abort(reason)
        return req
    }
}
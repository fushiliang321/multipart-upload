import axios from "axios"
import { abortPromiseInterface, requestAdapterInterface } from './interface'
import CacheInterface from "../cache/interface"
import MultipartUpload from "../MultipartUpload"
import { AxiosInstance, AxiosRequestConfig } from "./index"

export function New(adapterConfig: object = {}, cache?: CacheInterface): MultipartUpload {
    return new MultipartUpload(new requestAdapter(adapterConfig), cache)
}

//请求处理方法
export default class requestAdapter implements requestAdapterInterface{
    requestInstance: AxiosInstance

    constructor(config: object = {}) {
        this.requestInstance = axios.create(config) as AxiosInstance
    }

    private post(url: string, data?: any, config?: AxiosRequestConfig<any>): abortPromiseInterface {
        const controller = new AbortController()
        if (!config) {
            config = {}
        }
        config.signal = controller.signal
        const req = this.requestInstance.post(url, data, config) as unknown as abortPromiseInterface
        req.abort = (reason: any) => controller.abort(reason)
        return req
    }

    init(url: string, params: object): abortPromiseInterface {
        return this.post(url, params)
    }

    part(url: string, file: Blob|ArrayBuffer|Uint8Array, params: object, onUploadProgress: (e: any) => void): abortPromiseInterface {
        const formData = new FormData()
        if (file instanceof ArrayBuffer || file instanceof Uint8Array) {
            formData.append('file', new Blob([file]))
        }else if (file instanceof Blob){
            formData.append('file', file)
        }else {
            throw new Error('file must be Blob or ArrayBuffer')
        }
        return this.post(url, formData, {
            params,
            onUploadProgress: (e: any) => {
                onUploadProgress({
                    progress: e.progress,
                    total: e.total,
                    loaded: e.loaded,
                })
            }
        })
    }

    complete(url: string, params: object): abortPromiseInterface  {
        return this.post(url, params)
    }
}
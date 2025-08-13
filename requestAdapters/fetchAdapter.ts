import { AxiosResponse } from 'axios'
import MultipartUpload, { UploadProgress } from '../MultipartUpload'
import CacheInterface from '../cache/interface'
import { abortPromiseInterface, requestAdapterInterface } from './interface'

export function New(adapterConfig: object = {}, cache?: CacheInterface): MultipartUpload {
    return new MultipartUpload(new requestAdapter(adapterConfig), cache)
}

export default class requestAdapter implements requestAdapterInterface{
	config: object

    constructor(config: object = {}) {
        this.config = config
    }

    private post(url: string | URL, init?: RequestInit): abortPromiseInterface {
		let abort: ((reason: any) => void ) | undefined
		const request = new Promise(async (resolve,reject)=>{
			try{
                const controller = new AbortController()
                if (!init) {
                    init = {}
                }
                init.signal = controller.signal
                if ((this.config as any).baseURL) {
                    url = new URL(url, (this.config as any).baseURL)
                }
                const task = fetch(url, init)
                abort = (reason: any) => controller.abort(reason)
				const res = await task as unknown as AxiosResponse
                res.data = await (res as unknown as Response).json()
				resolve(res)
			}catch(e){
				reject(e)
			}
		}) as abortPromiseInterface
		request.abort = abort
        return request

    }

    init(url: string, params: Record<string, any>): abortPromiseInterface {
        return this.post(url, {
            ...this.config,
            method: 'POST',
            body: JSON.stringify(params),
        })
    }

    part(url: string, file: Blob|ArrayBuffer|Uint8Array, params: Record<string, any>, onUploadProgress: (e: UploadProgress) => void): abortPromiseInterface {
        if (file instanceof ArrayBuffer || file instanceof Uint8Array) {
            file = new Blob([file as ArrayBuffer])
        }else if (file instanceof Blob){
        }else {
            throw new Error('file must be Blob or ArrayBuffer')
        }

        const formData = new FormData()
        for (const key in params) {
            formData.append(key, params[key])
        }
        formData.append('file', file);
        return this.post(url,  {
            method: 'POST',
            body: formData
        })
    }

    complete(url: string, params: Record<string, any>): abortPromiseInterface {
        return this.post(url, {
            method: 'POST',
            body: JSON.stringify(params),
        })
    }
}
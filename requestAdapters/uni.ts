import MultipartUpload from '../MultipartUpload'
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


    init(url: string, params: object): abortPromiseInterface {
		let abort: ((reason: any) => void ) | undefined
		
		const request = new Promise(async (resolve,reject)=>{
			try{
				const task = uni.request({
					...this.config,
					url: url,
					method: 'POST',
					data: params
				})
				abort = reason => {
					task.abort(reason)
				}
				const res = await task
				res.status = res.statusCode
				resolve(res)
			}catch(e){
				reject(e)
			}
		})
		request.abort = abort
        return request
    }
    
    part(url: string, file: File|Blob, params: object, onUploadProgress: (e: any) => void): abortPromiseInterface {
		
		let abort: ((reason: any) => void ) | undefined
        const filePath = URL.createObjectURL(file)
		const request = new Promise((resolve,reject)=>{
			try{
				const uploadTask = uni.uploadFile({
					...this.config,
				    url: url,
				    filePath:filePath,
				    name: 'file',
				    formData: params,
					success: (e: any) => {
						if(typeof e.data === 'string') {
							try{
								e.data = JSON.parse(e.data)
							}catch(e){
								console.error(e)
							}
						}
						e.status = e.statusCode
						resolve(e)
					},
					fail: (e: any) => {
						reject(e)
					}
				})
				
				abort = reason => {
					uploadTask.abort(reason)
				}
				uploadTask.onProgressUpdate((e: any) => {
				    onUploadProgress({
				        progress: e.progress,
				        total: e.totalBytesExpectedToSend,
				        loaded: e.totalBytesSent,
				    })
				})
			}catch(e){
				reject(e)
			}
		})
		request.abort = abort
		return request
    }

    complete(url: string, params: object): abortPromiseInterface {
		
		let abort: ((reason: any) => void ) | undefined
		const request = new Promise(async (resolve,reject)=>{
			try{
				const task = uni.request({
					...this.config,
					url: url,
					method: 'POST',
					data: params
				})
				abort = reason => {
					task.abort(reason)
				}
				const res = await task
				res.status = res.statusCode
				resolve(res)
			}catch(e){
				reject(e)
			}
		})
		request.abort = abort
		return request
    }
}
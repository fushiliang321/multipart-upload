import MultipartUpload from '../MultipartUpload'
import CacheInterface from '../cache/interface'
import { abortPromiseInterface, requestAdapterInterface } from './interface'

export function New(adapterConfig: object = {}, cache?: CacheInterface): MultipartUpload {
    return new MultipartUpload(new requestAdapter(adapterConfig), cache)
}

function appendUrlParamsToObject(url: string, paramsObj: { [key: string]: any }) {
	let urlParams = [];
  
	for (let key in paramsObj) {
	  let value = paramsObj[key];
	  
	  if (Array.isArray(value)) {
		for (let item of value) {
		  urlParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(item)}`);
		}
	  } else {
		urlParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
	  }
	}
  
	let paramStr = urlParams.join('&');
  
	let separator = /\?/.test(url) ? '&' : '?';
	return url + separator + paramStr;
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
	
    part(url: string, file: Blob|ArrayBuffer|Uint8Array|string, params: object, onUploadProgress: (e: any) => void): abortPromiseInterface {
		let abort: ((reason: any) => void ) | undefined

		const request = new Promise((resolve, reject)=>{
			try{
				let filePath: string = ''
				let uploadTask: any
				const options = {
					...this.config,
					url: url,
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
				}
				switch (true) {
					case Object.prototype.toString.call(file) === '[object ArrayBuffer]':
						options.url = appendUrlParamsToObject(url, params)
						uploadTask = uni.request({
							...options,
							method: 'POST',
							data: file,
						})
						break;
					case file instanceof String:
						filePath = file as string
						break;
					case file instanceof Blob:
						filePath = URL.createObjectURL(file)
						break;
					default:
						throw new Error('file must be Blob, ArrayBuffer or filePath')
				}
				if (filePath) {
					uploadTask = uni.uploadFile({
						...options,
						filePath: filePath,
						name: 'file',
						formData: params,
					})
				}
				
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
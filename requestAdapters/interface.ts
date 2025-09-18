import { AxiosPromise } from "axios";
import { UploadProgress } from '../index.d';

export interface requestAdapterInterface {
    init(url: string, params: Record<string, any>): abortPromiseInterface;
    part(url: string, file: Blob|ArrayBuffer|Uint8Array, params: Record<string, any>, onUploadProgress: (e: UploadProgress) => void): abortPromiseInterface;
    complete(url:string, params: Record<string, any>): abortPromiseInterface;
}

export interface abortPromiseInterface extends AxiosPromise {
    abort: ((reason:any) => void) | undefined
}
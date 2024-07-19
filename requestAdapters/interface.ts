export interface requestAdapterInterface {
    init(url: string, params: object): abortPromiseInterface;
    part(url: string, file: Blob|ArrayBuffer|Uint8Array, params: object, onUploadProgress: (e: any) => void): abortPromiseInterface;
    complete(url:string, params: object): abortPromiseInterface;
}

export interface abortPromiseInterface extends Promise<any> {
    abort: ((reason:any) => void ) | undefined
}
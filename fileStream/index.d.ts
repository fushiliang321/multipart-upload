export type readCallBackFunction = (data: ArrayBuffer, done: boolean) => Promise<any> | any

export interface FileStreamInterface {
    name: string
    type: string
    size: number
    read(callBack: readCallBackFunction, bufferLength?: number, start?: number, end?: number): Promise<any>
    getFile(): File
    md5(): Promise<string>
}

export default FileStreamInterface
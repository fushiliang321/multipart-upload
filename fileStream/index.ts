import { fileMD5 } from '../worker/index'
import { FileStreamInterface, readCallBackFunction } from './index.d'

export default class FileStream implements FileStreamInterface{
    private _file: File
    private _md5?: string
    name: string
    type: string
    size: number

    constructor(file: File) {
        this._file = file
        this.name = file.name
        this.type = file.type
        this.size = file.size
    }

    private async getReader(options?: ReadableStreamGetReaderOptions, start?: number, end?: number): Promise<ReadableStreamReader<Uint8Array>> {
        return this._file.slice(start, end).stream().getReader(options)
    }

    async read(callBack: readCallBackFunction, bufferLength?: number, start?: number, end?: number) {
        const reader = await this.getReader(bufferLength && bufferLength > 0 ? { mode: 'byob' } : undefined, start, end)
        try {
            if (reader instanceof ReadableStreamBYOBReader) {
                bufferLength = bufferLength as number
                let offset = 0
                //有指定缓冲区长度，就读取指定长度的数据后在返回
                const buffer = new Uint8Array(bufferLength)
                offset = 0
                while(true) {
                    const { done, value } = await reader.read(new Uint8Array(bufferLength - offset))
                    if (done) {
                        await callBack(buffer.buffer.slice(0, offset), true)
                        break
                    }
                    buffer.set(value, offset)
                    offset += value.byteLength
                    if (offset >= buffer.byteLength) {
                        if (!await callBack(buffer.buffer.slice(0), false)) {
                            return
                        }
                        offset = 0
                    }
                }
            }else if (reader instanceof ReadableStreamDefaultReader) {
                while(true) {
                    //没有指定缓冲区长度，就直接返回每次读取到的数据
                    const { done, value } = await reader.read()
                    if (done) {
                        await callBack(new ArrayBuffer(0), true)
                        break
                    }
                    if (!await callBack(value.buffer.slice(0), false)) {
                        return
                    }
                }
            }
        } catch (error) {
            throw error
        }
    }

    getFile(): File {
        return this._file
    }

    async md5(): Promise<string> {
        if (!this._md5) {
            this._md5 = await fileMD5(this._file)
        }
        return this._md5 as string
    }
}
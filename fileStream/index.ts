
type readCallBackFunction = (data: Uint8Array, done: boolean) => Promise<any> | any

export default class FileStream {
    file: File

    constructor(file: File) {
        this.file = file
    }

    private async getReader(options?: ReadableStreamGetReaderOptions, start?: number, end?: number): Promise<ReadableStreamReader<Uint8Array>> {
        return this.file.slice(start, end).stream().getReader(options)
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
                        await callBack(new Uint8Array(buffer.buffer, 0, offset), true)
                        break
                    }
                    buffer.set(value, offset)
                    offset += value.byteLength
                    if (offset >= buffer.byteLength) {
                        offset = 0
                        await callBack(new Uint8Array(buffer.buffer), false)
                    }
                }
            }else if (reader instanceof ReadableStreamDefaultReader) {
                while(true) {
                    //没有指定缓冲区长度，就直接返回每次读取到的数据
                    const { done, value } = await reader.read()
                    if (done) {
                        await callBack(new Uint8Array(), true)
                        break
                    }
                    await callBack(value, false)
                }
            }
        } catch (error) {
            throw error
        }
    }

}
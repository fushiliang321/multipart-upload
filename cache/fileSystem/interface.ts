
export type fileDataType = BufferSource | Blob | string

export default interface FileSystem {
    write(data: fileDataType): Promise<boolean>
    read(): Promise<File>
    remove(): Promise<void>
}
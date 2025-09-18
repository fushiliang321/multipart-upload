import FileSystem, { fileDataType } from '../interface'

let opfsRoot: FileSystemDirectoryHandle | undefined = undefined

async function getOpfsRoot(): Promise<FileSystemDirectoryHandle> {
    if (!opfsRoot) {
        opfsRoot = await (await navigator.storage.getDirectory()).getDirectoryHandle('fileCache', {
            create: true,
        })
    }
    return opfsRoot
}

export default class OpfsFile implements FileSystem {
    #name: string = ''
    #handle: FileSystemFileHandle | undefined

    constructor(name: string){
        this.#name = name
    }

    async getHandle(): Promise<FileSystemFileHandle> {
        if (!this.#handle) {
            this.#handle = await (await getOpfsRoot()).getFileHandle(this.#name, { create: true })
        }
        return this.#handle
    }

    async write(data: fileDataType): Promise<boolean> {
        try {
            const writable = await (await this.getHandle()).createWritable()
            await writable.write(data)
            await writable.close()
            return true
        } catch (error) {
            console.error(error)
            return false
        }
    }

    async read(): Promise<File>{
        return (await this.getHandle()).getFile()
    }

    async remove(): Promise<void> {
        return (await getOpfsRoot()).removeEntry(this.#name)
    }
}
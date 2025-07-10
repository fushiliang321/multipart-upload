import FileSystem, {fileDataType} from '../interface'
import Table from '../../../db/table'
import db from '../../../db/index'

const filesTable = new Table(db, 'files')

export default class DbFile implements FileSystem {
    #name: string = ''

    constructor(name: string){
        this.#name = name
    }

    async write(data: fileDataType): Promise<boolean> {
        try {
            await filesTable.putByIndex('key', this.#name,  { key: this.#name, file: data }, false)
            return true
        } catch (error) {
            console.error(error)
            return false
        }
    }

    async read(): Promise<File> {
        const res = await filesTable.getByIndex('key', this.#name)
        return new File(res && res.file ? [res.file] : [], this.#name)
    }

    async remove(): Promise<void> {
      await filesTable.deleteByIndex( 'key', this.#name)
    }
}

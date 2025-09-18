import FileSystem from './interface'
import OpfsFile from './opfs/index'
import DbFile from './db/index'
import { get, mode } from '../config';
import { fileCacheInfo } from '../index.d';

let _fileSystem: (new (name: string) => FileSystem) | undefined = undefined;

function fileSystem(name: string): FileSystem {
    if (!_fileSystem) {
        try {
            const cacheMode = get().mode
            if (cacheMode === mode.indexedDB) {
                _fileSystem = DbFile
            }else{
                _fileSystem = !navigator?.storage?.getDirectory ? DbFile : OpfsFile;
            }
        } catch (error) {
            _fileSystem = DbFile
        }
    }
    return new _fileSystem(name)
}

export  default  {
    get: async (key: string): Promise<fileCacheInfo|undefined> => {
        const file = await fileSystem(key).read()
        return file.size === 0 ? undefined : {
            key,
            file,
        }
    },
    set: async (key: string, file: File): Promise<IDBValidKey | false> => {
        if (await fileSystem(key).write(file)) {
            return key
        }
        return false
    },
    delete: async(key: string): Promise<boolean> => {
        await fileSystem(key).remove()
        return true
    },
}
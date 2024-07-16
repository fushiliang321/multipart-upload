import db from '../db/index'
import Table from '../db/table'

const filesTable = new Table(db, 'files')
const progressTable = new Table(db, 'progress')

function _set(storage: Table, indexKey: string, indexValue: IDBValidKey | IDBKeyRange, data: any): Promise<IDBValidKey | false> {
    return storage.putByIndex(indexKey, indexValue, data, false)
}
function _add(storage: Table, value: any, key?: IDBValidKey): Promise<IDBValidKey | false> {
    return storage.add(value, key)
}
function _getAll(storage: Table, query?: IDBValidKey | IDBKeyRange | null, count?: number): Promise<any[]> {
    return storage.getAll(query, count)
}
function _getAllByIndex(storage: Table, key: string, query?: IDBValidKey | IDBKeyRange | null, count?: number): Promise<any[]> {
    return storage.getAllByIndex(key, query, count)
}
function _getByIndex(storage: Table, key: string, query: IDBValidKey | IDBKeyRange): Promise<any> {
    return storage.getByIndex(key, query)
}
function _get(storage: Table, query: IDBValidKey | IDBKeyRange): Promise<any> {
    return storage.get(query)
}
function _countByIndex(storage: Table, key: string, query?: IDBValidKey | IDBKeyRange): Promise<number> {
    return storage.countByIndex(key, query)
}
function _delete(storage: Table, indexKey: string, query?: IDBValidKey | IDBKeyRange | null, count?: number): Promise<boolean> {
    return storage.deleteByIndex(indexKey, query, count)
}

export async function filesGetAll(query?: IDBValidKey | IDBKeyRange | null, count?: number): Promise<any[]> {
    return await _getAll(filesTable, query, count)
}

export async function filesGetIndexAll(group: string, value?: IDBValidKey | IDBKeyRange | null): Promise<any[]> {
    return await _getAllByIndex(filesTable, group, value)
}

export type fileCacheInfo = {
    key: string,
    file: File,
}

export async function filesGet(key: string): Promise<fileCacheInfo|undefined> {
    return await _getByIndex(filesTable, 'key', key)
}

export async function filesSet(key: string, file: File): Promise<IDBValidKey | false> {
    return await _set(filesTable, 'key', key, { key, file } as fileCacheInfo)
}

export async function filesDelete(key: string): Promise<boolean> {
    return await _delete(filesTable, 'key', key)
}

export async function progressGetAll(query?: IDBValidKey | IDBKeyRange | null, count?: number): Promise<any[]> {
    return await _getAll(progressTable, query, count)
}

export async function progressGetIndexAll(group: string, value?: IDBValidKey | IDBKeyRange | null): Promise<any[]> {
    return await _getAllByIndex(progressTable, group, value)
}

export async function progressGet(value: IDBValidKey | IDBKeyRange): Promise<any> {
    return await _get(progressTable, value)
}

export async function progressCount(key: string, value?: IDBValidKey | IDBKeyRange) {
    return await _countByIndex(progressTable, key, value)
}

export async function progressSet(key: IDBValidKey, data: any): Promise<IDBValidKey | false> {
    return await progressTable.put(JSON.parse(JSON.stringify(data)), key)
}

export async function progressAdd(value: any, key?: IDBValidKey): Promise<IDBValidKey | false> {
    return await _add(progressTable, value, key)
}

export async function progressDelete(query: IDBValidKey | IDBKeyRange): Promise<boolean> {
    return await progressTable.delete(query)
}

export default {
    file: {
        getAll: filesGetAll,
        getIndexAll: filesGetIndexAll,
        get: filesGet,
        set: filesSet,
        delete: filesDelete,
    },
    progress: {
        getAll: progressGetAll,
        getIndexAll: progressGetIndexAll,
        get: progressGet,
        add: progressAdd,
        set: progressSet,
        delete: progressDelete,
        count: progressCount,
    }
}
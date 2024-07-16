
export interface IDBIndexProxy extends IDBIndex{
    count(query?: IDBValidKey | IDBKeyRange): Promise<number>;
    get(query: IDBValidKey | IDBKeyRange): Promise<any>;
    getAll(query?: IDBValidKey | IDBKeyRange | null, count?: number): Promise<any[]>;
    getAllKeys(query?: IDBValidKey | IDBKeyRange | null, count?: number): Promise<IDBValidKey[]>;
    getKey(query: IDBValidKey | IDBKeyRange): Promise<IDBValidKey | undefined>;
    openCursor(query?: IDBValidKey | IDBKeyRange | null, direction?: IDBCursorDirection): Promise<IDBCursorWithValue | null>;
    openKeyCursor(query?: IDBValidKey | IDBKeyRange | null, direction?: IDBCursorDirection): Promise<IDBCursor | null>;
}
export interface IDBObjectStoreProxy extends IDBObjectStore{
    add(value: any, key?: IDBValidKey): Promise<IDBValidKey>;
    clear(): Promise<undefined>;
    count(query?: IDBValidKey | IDBKeyRange): Promise<number>;
    delete(query: IDBValidKey | IDBKeyRange): Promise<undefined>;
    get(query: IDBValidKey | IDBKeyRange): Promise<any>;
    getAll(query?: IDBValidKey | IDBKeyRange | null, count?: number): Promise<any[]>;
    getAllKeys(query?: IDBValidKey | IDBKeyRange | null, count?: number): Promise<IDBValidKey[]>;
    openCursor(query?: IDBValidKey | IDBKeyRange | null, direction?: IDBCursorDirection): Promise<IDBCursorWithValue | null>;
    openKeyCursor(query?: IDBValidKey | IDBKeyRange | null, direction?: IDBCursorDirection): Promise<IDBCursor | null>;
    put(value: any, key?: IDBValidKey): Promise<IDBValidKey>;
    index(name: string): IDBIndexProxy;
    createIndex(name: string, keyPath: string | string[], options?: IDBIndexParameters): IDBIndexProxy;
}
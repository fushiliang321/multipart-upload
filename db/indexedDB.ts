const keyPath:string = 'id'

//创建表
function createTable(db: IDBDatabase, tableName: string, tableConfig: string[]|Object|string) {
    if (db.objectStoreNames.contains(tableName)) {
        return
    }
    const objectStore = db.createObjectStore(tableName, {
        autoIncrement: true,
        keyPath: keyPath,
    })

    switch(true) {
        case Array.isArray(tableConfig):
            tableConfig.forEach(name => {
                objectStore.createIndex(name, name)
            })
            break;
        case tableConfig instanceof Object:
            for (const key in tableConfig) {
                const options = tableConfig[key].options ?? {}
                const keyPath = tableConfig[key].keyPath ?? key
                objectStore.createIndex(key, keyPath, options)
            }
            break;
        default:
            objectStore.createIndex(tableConfig, tableConfig)
    }
}

export default class indexedDBClass {
    _initFinishCallBackFuns: Function[] = [] //初始化完成回调
    _isInitFinish:boolean = false //是否初始化完成
    _db?: IDBDatabase //数据库
    _dbName: string //数据库名
    _dbversion: number //数据库版本
    _tableMap:any = {} //表配置

    // 构造函数
    constructor(dbName:string = 'dbName', tableMap:any = {} ) {
        this._dbName = dbName
        this._dbversion = 1
        this._tableMap = tableMap
    }

    initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this._dbName, this._dbversion) // 打开数据库
            // 数据库初始化成功
            request.onsuccess = event => {
                this._db = request.result
                this._isInitFinish = true
                for (const fun of this._initFinishCallBackFuns) {
                    fun()
                }
                // this._db.transaction().objectStore().delete
                resolve(event)
            }
            // 数据库初始化失败
            request.onerror = event => {
                console.error(event)
                reject(event)
            }
            // 数据库初次创建或更新时会触发
            request.onupgradeneeded = event => {
                const db = request.result
                
                for (const tableName in this._tableMap) {
                    createTable(db, tableName, this._tableMap[tableName])
                }

                resolve(event)
            }
        })
    }
    
    async getDB(): Promise<IDBDatabase|undefined> {
        await this.awaitInit()
        return this._db
    }

    async awaitInit() {
        if (!this._isInitFinish) {
            await new Promise((resolve, reject) => {
                this._initFinishCallBackFuns.push(resolve)
            })
        }
    }

    async closeDB() {
        (await this.getDB())?.close()
    }
}
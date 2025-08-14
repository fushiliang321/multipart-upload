//文件缓存模式
export enum mode {
    auto = 'auto', //自动
    opfs = 'opfs', //使用源私有文件系统
    indexedDB = 'indexedDB', //使用indexedDB
}

export type configType = {
    reservation: number; //缓存预留空间，防止缓存把磁盘空间占满。
    mode: mode; //缓存模式，auto模式会根据当前运行环境自动选择缓存模式，如果设置了当前环境不支持的模式会自动切换为auto模式
}

const defaultConfig: configType = {
    reservation:  1024*1024*10, //缓存预留10M的空间，防止缓存把磁盘空间占满。
    mode: mode.auto
}

let globalConfig: configType  = defaultConfig

export function set(options: configType) {
    globalConfig = options
}

export function get(): configType {
    return globalConfig
}

export default defaultConfig

export type configType = {
    reservation: number; //缓存预留空间，防止缓存把磁盘空间占满。
}

const defaultConfig: configType = {
    reservation:  1024*1024*10, //缓存预留10M的空间，防止缓存把磁盘空间占满。
}

let globalConfig: configType  = defaultConfig

export function setConfig(options: configType) {
    if(options instanceof Object) {
        globalConfig = {
            ...defaultConfig,
            ...options
        }
    }
}

export function config(): configType {
    return globalConfig
}

export default defaultConfig
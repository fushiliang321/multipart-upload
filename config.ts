export type apiUrl = {
    init: string,
    part: string,
    complete: string
}

export type configType = {
    api: apiUrl,
    maxPartSize: number,
    maxFileSize: number,
    retryNum: number,
    retryInterval: number,
    concurrency: number,
    assureCacheFileWriteSequence: boolean,
}

const defaultConfig: configType = {
    api: {
        init: 'multipart/init', //初始化接口
        part: 'multipart/part', //上传分片接口
        complete: 'multipart/complete', //合并分片接口
    },
    maxPartSize: 5 * 1024 * 1024, //每个分片的最大值，如果初始化接口响应了该值，则使用接口响应的值
    maxFileSize: 200 * 1024 * 1024,//文件的最大值，如果初始化接口响应了该值，则使用接口响应的值
    retryNum: 5, //失败重试次数
    retryInterval: 1000, //失败重试间隔（毫秒）
    concurrency: 1, //并发上传分片数量
    assureCacheFileWriteSequence: true, //是否需要保证缓存文件写入顺序
}

let globalConfig: configType = defaultConfig

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
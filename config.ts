export type apiUrl = {
    init: string, //初始化接口
    part: string, //上传分片接口
    complete: string //合并分片接口
}

export type configType = {
    api: apiUrl, //接口配置
    maxPartSize: number, //每个分片的最大值，如果初始化接口响应了该值，则使用接口响应的值
    maxFileSize: number, //文件的最大值，如果初始化接口响应了该值，则使用接口响应的值
    retryNum: number, //失败重试次数
    retryInterval: number, //失败重试间隔（毫秒）
    concurrency: number, //并发上传分片数量
    isCheckoutFileMD5: boolean, //是否校验文件md5
    assureCacheFileWriteSequence: boolean, //是否需要保证缓存文件写入顺序
    speedLimit?: number, //限速，0表示不限速
}

const defaultConfig: configType = {
    api: {
        init: 'multipart/init',
        part: 'multipart/part',
        complete: 'multipart/complete',
    },
    maxPartSize: 5 * 1024 * 1024,
    maxFileSize: 200 * 1024 * 1024,
    retryNum: 5,
    retryInterval: 1000,
    concurrency: 1,
    isCheckoutFileMD5: true,
    assureCacheFileWriteSequence: true,
    speedLimit: 0,
}

let globalConfig: configType = defaultConfig

export function set(options: configType): void {
    globalConfig = options
}

export function get(): configType {
    return globalConfig
}

export default defaultConfig
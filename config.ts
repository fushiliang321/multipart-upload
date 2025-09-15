import CacheInterface from "./cache/interface"
import { requestAdapterInterface } from "./requestAdapters/interface"
import fetchAdapter from "./requestAdapters/fetchAdapter"
import cache from "./cache"

export type apiUrl = {
    init: string, //初始化接口
    part: string, //上传分片接口
    complete: string //合并分片接口
}

export enum fileHashMode {
    MD5 = 'MD5',
    SHA1 = 'SHA-1',
    SHA256 = 'SHA-256',
    SHA384 = 'SHA-384',
    SHA512 = 'SHA-512'
}

export type configType = {
    api: apiUrl, //接口配置
    maxPartSize: number, //单个分片的最大字节数，如果初始化接口响应了该值，则使用接口响应的值
    maxFileSize: number, //文件的最大字节数，如果初始化接口响应了该值，则使用接口响应的值|
    retryNum: number, //失败重试次数
    retryInterval: number, //失败重试间隔（毫秒）
    concurrency: number, //分片并发上传数量
    isCheckoutFileHash: boolean, //是否校验文件hash值
    fileHashMode: fileHashMode, //文件hash值计算方式
    assureCacheFileWriteSequence: boolean, //是否需要保证缓存文件写入顺序
    speedLimit?: number, //限速，0表示不限速
    requestAdapter: new(config: object) => requestAdapterInterface, //默认的请求适配器
    fileCache: CacheInterface | false, //默认的文件缓存
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
    isCheckoutFileHash: true,
    assureCacheFileWriteSequence: true,
    speedLimit: 0,
    fileHashMode: fileHashMode.MD5,
    requestAdapter: fetchAdapter,
    fileCache: cache.group('defaultFileCache'),
}

let globalConfig: configType = defaultConfig

export function set(options: configType): void {
    globalConfig = options
}

export function get(): configType {
    return globalConfig
}

export default defaultConfig
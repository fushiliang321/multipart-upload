import MultipartUploadClass from "./MultipartUpload"
import { New as _axiosMultipartUpload} from "./requestAdapters/axiosAdapter"
import { New as _fetchMultipartUpload} from "./requestAdapters/fetchAdapter"
import { New as _uniMultipartUpload} from "./requestAdapters/uniAdapter"
import _restoreToMultipartUpload from "./cache/restoreToMultipartUpload"
import CacheInterface from "./cache/interface"
import { get } from "./config"
import { requestAdapterInterface } from "./requestAdapters/interface"

export class MultipartUpload extends MultipartUploadClass{}
export const axiosMultipartUpload = _axiosMultipartUpload
export const fetchMultipartUpload = _fetchMultipartUpload
export const uniMultipartUpload = _uniMultipartUpload
export const restoreToMultipartUpload = _restoreToMultipartUpload

export function defaultAdapter(adapterConfig: object = {}): requestAdapterInterface {
    const config = get()
    const requestAdapter = config.requestAdapter
    return new requestAdapter(adapterConfig)
}

export function defaultFileCache(): CacheInterface|undefined {
    const config = get()
    return config.fileCache ? config.fileCache : undefined
}

export default (adapterConfig: object = {}, cache?: CacheInterface): MultipartUpload => {
    const adapter = defaultAdapter(adapterConfig)
    return new MultipartUpload(adapter, cache)
}
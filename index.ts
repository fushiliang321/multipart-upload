import MultipartUploadClass from "./MultipartUpload"
import { New as _axiosMultipartUpload} from "./requestAdapters/axiosAdapter"
import { New as _fetchMultipartUpload} from "./requestAdapters/fetchAdapter"
import { New as _uniMultipartUpload} from "./requestAdapters/uniAdapter"
import _restoreToMultipartUpload from "./cache/restoreToMultipartUpload"
import CacheInterface from "./cache/interface"
import { get } from "./config"

export class MultipartUpload extends MultipartUploadClass{}
export const axiosMultipartUpload = _axiosMultipartUpload
export const fetchMultipartUpload = _fetchMultipartUpload
export const uniMultipartUpload = _uniMultipartUpload
export const restoreToMultipartUpload = _restoreToMultipartUpload

export default (adapterConfig: object = {}, cache?: CacheInterface): MultipartUpload => {
    const config = get()
    const requestAdapter = config.requestAdapter
    if (!cache && config.fileCache) {
        cache = config.fileCache
    }
    return new MultipartUpload(new requestAdapter(adapterConfig), cache)
}
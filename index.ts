import MultipartUploadClass from "./MultipartUpload"
import { New as _axiosMultipartUpload} from "./requestAdapters/axios"
import { New as _uniMultipartUpload} from "./requestAdapters/uni"
import _restoreToMultipartUpload from "./cache/restoreToMultipartUpload"

export class MultipartUpload extends MultipartUploadClass{}
export const axiosMultipartUpload = _axiosMultipartUpload
export const uniMultipartUpload = _uniMultipartUpload
export const restoreToMultipartUpload = _restoreToMultipartUpload

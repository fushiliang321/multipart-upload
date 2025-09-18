import { statusTags } from "./enums";

export type PartETag = {
    ETag: string;
    PartNumber: number;
}

export type UploadProgress = {
    status: statusTags;
    progress: number;
    total: number;
    loaded: number;
}

export type uploadInfo = Pick<MultipartUpload, 'uploadId' | 'maxPartSize' | 'maxFileSize' | 'requestParams' | 'progress' | 'uploadFinishPartSize' | 'parts'>
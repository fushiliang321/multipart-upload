
export enum statusTags {
    uninitialized = 0,//未初始化
    initializing = 1,//初始化中
    uploading = 2,//上传中
    merging = 3,//文件合并中
    completed = 4,//已完成
    abnormal = 5,//执行异常
    abort = 6,//中断
}

type PartETag = {
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
import { uploadInfo } from "../MultipartUpload";
import { fileInfo, progress } from "./group";

export default interface CacheInterface{
    add(key: string, file: File, fileInfo: fileInfo, uploadInfo?: uploadInfo): Promise<IDBValidKey|false>;
    getAll(): Promise<progress[]>;
    getByKey(id: IDBValidKey): Promise<progress|undefined>;
    delete(id: IDBValidKey): Promise<boolean>;
    update(id: IDBValidKey, progress: progress): Promise<boolean>;
    getFile(key: string): Promise<File|undefined>;
}
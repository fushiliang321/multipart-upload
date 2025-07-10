import { fileHashMode } from "../config";

export interface Message<T = any> {
    taskId?: string;
    type: string;
    data: T;
}

export interface Hash {
    file: File;
    mode: fileHashMode;
}

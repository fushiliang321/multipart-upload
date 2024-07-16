export type Message = {
    taskId?: string;
    type: string;
    data: any;
}

export type MD5Message = Message & {
    data: {
        file: File;
    };
}

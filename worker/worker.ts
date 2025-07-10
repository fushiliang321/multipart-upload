import jsMd5 from 'js-md5'
import { Hash, Message } from './index.d'
import { fileHashMode } from '../config'

addEventListener('message',async (e: MessageEvent) => {
  const data: Message = e.data
  let res: any
  switch (data.type) {
    case 'fileHash':
      res = await fileHash((data as Message<Hash>).data.file, (data as Message<Hash>).data.mode)
      break;

    default:
      break;
  }

  if (data.taskId) {
    postMessage({taskId: data.taskId, data: res})
  }
})

async function fileHash(file: File, mode: fileHashMode): Promise<string> {
  const buffer = await file.arrayBuffer()
  if (mode !== fileHashMode.MD5) {
    const hashBuffer = await crypto.subtle.digest(mode, buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
  }
  return jsMd5(buffer)
}

export default class {}
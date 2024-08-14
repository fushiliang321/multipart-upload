import jsMd5 from 'js-md5'
import { Message } from './index.d'

addEventListener('message',async (e: MessageEvent) => {
  const data: Message = e.data
  let res: any
  switch (data.type) {
    case 'fileMD5':
      res = await fileMD5(data.data.file)
      break;

    default:
      break;
  }

  if (data.taskId) {
    postMessage({taskId: data.taskId, data: res})
  }
})

async function fileMD5(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  return jsMd5(buffer)
}

export default class {}
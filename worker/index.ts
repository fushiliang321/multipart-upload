import { Message } from './index.d';
import webworker from './dist/workerDispatch.es';
 
const tasks: Map<string, any> = new Map<string, any>()

let worker: webworker = new webworker()
worker.addListener((e: MessageEvent) => {
  e.data.taskId && tasks.get(e.data.taskId)(e.data.data)
})

let i = 0
const randomVal = Math.random()
export function generateTaskId() {
  return randomVal + '_' + Math.random() + '_' + (++i)
}
export async function postMessage(data: Message): Promise<any>{
  if (!data.taskId) {
    worker.postMessage(data)
    return
  }
  const task = new Promise((resolve, reject) => {
    tasks.set(data.taskId as string, resolve)
  })
  worker.postMessage(data)
  return await task
}

export default (e: any)=>{
    postMessage(e);
}

export async function fileMD5(file: File): Promise<string> {
  const res = await postMessage({
    taskId: generateTaskId(),
    type: 'fileMD5',
    data: {file}
  })
  return res
}
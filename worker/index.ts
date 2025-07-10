import { Message } from './index.d';
import webworker from './dispatch/dispatch.es';
import { get } from '../config';

const tasks: Map<string, any> = new Map<string, any>()

let _worker: webworker

function getWorker() {
  if (!_worker) {
    _worker = new webworker()
    _worker.addListener((e: MessageEvent) => {
      e.data.taskId && tasks.get(e.data.taskId)(e.data.data)
    })
  }
  return _worker
}

let i = 0
const randomVal = Math.random()
export function generateTaskId() {
  try {
    if (crypto) {
      return crypto.randomUUID() + '_' + (++i)
    }
  } catch (error) {
  }
  return randomVal + '_' + Math.random() + '_' + (++i)
}

export async function postMessage(data: Message): Promise<any>{
  const worker = getWorker()
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

export async function fileHash(file: File): Promise<string> {
  const res = await postMessage({
    taskId: generateTaskId(),
    type: 'fileHash',
    data: { file, mode: get().fileHashMode }
  })
  return res
}
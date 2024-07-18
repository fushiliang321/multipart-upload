import webworker from './worker?worker&inline';

type listenerCallBack = (event: MessageEvent) => any

export default class worker {
    private counter: number = 0
    private workers:Worker[] = []
    private listenerList: listenerCallBack[] = []

    constructor(num?: number) {
        if (!num || num < 1) {
            num = navigator?.hardwareConcurrency
            if (num < 1) {
                num = 1
            }
        }
        for (let index = 0; index < num; index++) {
            this._addOneWorker()
        }
    }

    private _addOneWorker() {
        const worker = new webworker()
        worker.onmessage = (event: MessageEvent) => {
            for (const fun of this.listenerList) {
                fun(event)
            }
        }
        this.workers.push(worker)
    }

    postMessage(message: any, transfer?: StructuredSerializeOptions) {
        if (!this.workers[++this.counter]) {
            this.counter = 0
        }
        this.workers[this.counter].postMessage(message, transfer)
    }

    addListener(fun: listenerCallBack) {
        this.listenerList.push(fun)
    }

    removeListener(fun: listenerCallBack) {
        for (const i in this.listenerList) {
            if (this.listenerList[i] == fun) {
                this.listenerList.splice(i, 1)
                return
            }
        }
    }
}
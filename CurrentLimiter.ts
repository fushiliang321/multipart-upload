export default class CurrentLimiter {
    limit: number = 1
    counter: number = 1
    waitList: Function[] = []

    constructor(limit: number){
        if (limit > 0) {
            this.limit = limit
            this.counter = limit
        }
    }

    push(): boolean {
        ++this.counter
        if (this.counter > this.limit) {
            this.counter = this.limit
            return false
        }
        try {
            const resolve = this.waitList.shift()
            resolve && resolve()
        } catch (error) {
            console.warn(error)
        }

        return true
    }

    async pop(): Promise<boolean> {
        if (this.counter > 0) {
            --this.counter
            return true
        }

        await new Promise(resolve => {
            this.waitList.push(resolve)
        })
        return await this.pop()
    }
}
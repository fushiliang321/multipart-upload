export default class QuotaExceededError extends Error {
    code: number

    constructor(message: string) {
        super(message)
        this.name = 'QuotaExceededError'
        this.code = DOMException.QUOTA_EXCEEDED_ERR
    }
}
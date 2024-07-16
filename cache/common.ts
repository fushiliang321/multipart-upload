import config from './config'

//查看剩余存储空间
export async function freeStorageSpace() {
    const quota = await navigator.storage.estimate()
    return {
        quota: quota.quota ?? 0,
        usage: quota.usage ?? 0,
        reservation: config.reservation,
        quotaAvailable: (quota.quota ?? 0) - (quota.usage ?? 0) - config.reservation
    }
}
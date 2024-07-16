import indexedDBClass from './indexedDB'
import Table from './table'

const db = new indexedDBClass('fileDB', {
    'files': {
        key: {
            options: { unique: true },
        }
    },
    'progress': {
        group: {},
        key: {}
    },
})
db.initDB()

export const table = new Table(db, 'files')
export default db
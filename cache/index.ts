import cache from './cache'
import Group from './group'

export async function getAll() {
    return await cache.progress.getAll()
}

const GlobalGroupMap: Map<string, Group> = new Map<string, Group>();
export function group(name: string): Group {
    let group = GlobalGroupMap.get(name)
    if (!group) {
        group = new Group(name)
        GlobalGroupMap.set(name, group)
        return group
    }
    return group
}

export default {
    getAll,
    group,
}
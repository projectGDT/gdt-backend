import {Authflow, Titles} from 'prismarine-auth'

class EmptyCache {
    async getCached () {return {}}
    async setCached (value) {}
    async setCachedPartial (value) {}
}

function emptyCacheFactory ({ username, cacheName }) {
    return new EmptyCache()
}
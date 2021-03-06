import Dexie from 'dexie'

//
// Declare Database
//
const db = new Dexie('stroopwafel-cache')
db.version(1).stores({
  etags: 'methodAndPath',
})

const MAX_CACHED_URLS = 2000

export default class CacheHandler {
  constructor() {
    this.cachedETags = {}

    this._initialiazed = false
    this._dbWorking = true

    this.dbPromise = Promise.resolve().then(() => {
      if (this._initialiazed) {
        return undefined
      }
      return db.etags
        .each(entry => {
          const { methodAndPath, eTag, data, status } = entry
          this.cachedETags[methodAndPath] = { eTag, data, status }
        })
        .then(() => {
          this._initialiazed = true
        })
        .catch(() => {
          alert(
            'It looks like your browser is in private browsing mode. StroopWafel uses IndexedDB to cache requests to GitHub. Please disable Private Browsing to see it work.'
          )
          // fall back to localStorage
          const cache = window.localStorage.getItem('octokat-cache')
          if (cache) {
            this.cachedETags = JSON.parse(cache)
          }
          this._dbWorking = false
          this._initialiazed = true
        })
    })

    // Async save once now new JSON has been fetched after X seconds
    this._pendingTimeout = null
  }
  // eslint-disable-next-line
  _save(method, path, eTag, data, status) {
    const methodAndPath = `${method} ${path}`
    // This returns a promise but we ignore it.
    // TODO: Batch the updates ina transaction maybe
    db.etags.put({ methodAndPath, eTag, data, status })
  }
  _dumpCache() {
    console.log(
      'github-client: Dumping localStorage cache because it is too big'
    )
    this.cachedETags = {}
    window.localStorage.removeItem('octokat-cache')
    window.cacheDB = db
    return db.delete().then(() => db.open())
  }
  get(method, path) {
    const ret = this.cachedETags[`${method} ${path}`]
    if (ret) {
      const { data, linkRelations } = ret
      Object.keys(linkRelations || {}).forEach(key => {
        if (linkRelations[key]) {
          data[key] = linkRelations[key]
        }
      })
    }
    return ret
  }
  add(method, path, eTag, data, status) {
    const linkRelations = {}
    // if data is an array, it contains additional link relations (to other pages)
    if (Array.isArray(data)) {
      ;['next', 'previous', 'first', 'last'].forEach(name => {
        const key = `${name}_page_url`
        if (data[key]) {
          linkRelations[key] = data[key]
        }
      })
    }

    if (status !== 403) {
      // do not cache if you do not have permissions
      this.cachedETags[`${method} ${path}`] = {
        eTag,
        data,
        status,
        linkRelations,
      }
      // Try to use IndexedDB but fall back to localStorage (Firefox/Safari in incognito mode)
      if (this._dbWorking) {
        this._save(method, path, eTag, data, status, linkRelations)
      } else if (Object.keys(this.cachedETags).length > MAX_CACHED_URLS) {
        // stop saving. blow the storage cache because
        // stringifying JSON and saving is slow
        this._dumpCache()
      } else {
        if (this._pendingTimeout) {
          clearTimeout(this._pendingTimeout)
        }
        const saveCache = () => {
          this._pendingTimeout = null
          // If localStorage fills up, just blow it away.
          try {
            window.localStorage.setItem(
              'octokat-cache',
              JSON.stringify(this.cachedETags)
            )
          } catch (e) {
            this.cachedETags = {}
            this._dumpCache()
          }
        }
        this._pendingTimeout = setTimeout(saveCache, 5 * 1000)
      }
    }
  }
}

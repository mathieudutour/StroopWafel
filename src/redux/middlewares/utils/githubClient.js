import EventEmitter from 'events'

import Octo from 'octokat'
import SimpleVerbsPlugin from 'octokat/dist/node/plugins/simple-verbs'
import AuthorizationPlugin from 'octokat/dist/node/plugins/authorization'
import CamelCasePlugin from 'octokat/dist/node/plugins/camel-case'
import CacheHandlerPlugin from 'octokat/dist/node/plugins/cache-handler'
import FetchAllPlugin from 'octokat/dist/node/plugins/fetch-all'
import PaginationPlugin from 'octokat/dist/node/plugins/pagination'
import toQueryString from 'octokat/dist/node/helpers/querystring'

import CacheHandler from './cacheHandler'

let cachedClient = null

const cacheHandler = new CacheHandler()

const FetchOnePlugin = {
  asyncVerbs: {
    fetchOne(requester, path) {
      return (cb, query) =>
        requester.request(
          'GET',
          `${path}${toQueryString(query)}`,
          null,
          null,
          (err, result) => {
            if (err) {
              return cb(err)
            }
            return cb(null, result.items)
          }
        )
    },
  },
}

export default class GithubClient extends EventEmitter {
  constructor() {
    super()
    this.LOW_RATE_LIMIT = 60
    this.fetchCredentialsFromStorage()
  }
  fetchCredentialsFromStorage() {
    try {
      this.credentials =
        JSON.parse(window.localStorage.getItem('stroopwafel-user')) || {}
    } catch (err) {
      this.credentials = {}
    }
  }
  // Used for checking if we should retreive ALL Issues or just open ones
  canCacheLots() {
    return this.hasCredentials() /* && !!cacheHandler._db */
  }
  _getOctoConfig() {
    return {
      plugins: [
        SimpleVerbsPlugin,
        AuthorizationPlugin,
        CamelCasePlugin,
        PaginationPlugin,
        CacheHandlerPlugin,
        FetchAllPlugin,
        FetchOnePlugin,
      ],
      token: this.credentials.token,
      cacheHandler,
      rootURL: this.credentials.rootURL,
      emitter: this.emit.bind(this),
    }
  }
  hasCredentials() {
    const { token } = this.credentials || {}
    return !!token
  }
  getOcto() {
    return cacheHandler.dbPromise.then(() => {
      if (!cachedClient) {
        cachedClient = new Octo(this._getOctoConfig())
        // update the rateLimit for issue-duck so it can gracefully back off
        // making requests when the rate limit is low
        this.on('request', ({ rate: { remaining } }) => {
          this.rateLimitRemaining = remaining
        })
      }
      return cachedClient
    })
  }
  // eslint-disable-next-line
  getAnonymousOcto() {
    return Promise.resolve(new Octo())
  }
  getRateLimitRemaining() {
    return this.rateLimitRemaining
  }
  reset() {
    return Promise.resolve().then(() => {
      if (cacheHandler) {
        cacheHandler._dumpCache()
      }
      cachedClient = null
      this.fetchCredentialsFromStorage()
    })
  }
}

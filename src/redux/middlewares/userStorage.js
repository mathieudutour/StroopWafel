import {
  getInitialStateCreator,
  middlewareCreator,
} from './utils/storage-middleware'

export const STORAGE_KEY = 'stroopwafel-user'

export const getInitialState = getInitialStateCreator(STORAGE_KEY)

export default middlewareCreator({
  storageKey: STORAGE_KEY,
  metaKey: 'updateUserStorage',
  stateKey: 'user',
})

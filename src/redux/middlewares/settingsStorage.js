import {
  getInitialStateCreator,
  middlewareCreator,
} from './utils/storage-middleware'

export const STORAGE_KEY = 'stroopwafel-settings'

export const getInitialState = getInitialStateCreator(STORAGE_KEY)

export default middlewareCreator({
  storageKey: STORAGE_KEY,
  metaKey: 'updateSettingStorage',
  stateKey: 'settings',
})

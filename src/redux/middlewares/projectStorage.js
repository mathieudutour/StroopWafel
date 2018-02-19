import {
  getInitialStateCreator,
  middlewareCreator,
} from './utils/storage-middleware'

export const STORAGE_KEY = 'stroopwafel-projects'

export const getInitialState = getInitialStateCreator(STORAGE_KEY)

export default middlewareCreator({
  storageKey: STORAGE_KEY,
  metaKey: 'updateProjectStorage',
  stateKey: 'projects',
})

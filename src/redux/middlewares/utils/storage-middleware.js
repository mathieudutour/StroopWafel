export const getInitialStateCreator = storageKey => () => {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey))
  } catch (err) {
    return undefined
  }
}

export const middlewareCreator = ({ storageKey, metaKey, stateKey }) => ({
  getState,
}) => next => action => {
  const result = next(action)
  if (action && action.meta && action.meta[metaKey]) {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify(getState()[stateKey])
    )
  }
  return result
}

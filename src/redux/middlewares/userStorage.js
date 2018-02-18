export default ({ getState }) => next => action => {
  const result = next(action)
  if (action && action.meta && action.meta.updateUserStorage) {
    window.localStorage.setItem(
      'stroopwafel-user',
      JSON.stringify(getState().user)
    )
  }
  return result
}

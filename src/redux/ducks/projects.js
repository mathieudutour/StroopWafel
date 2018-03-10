import Duck from 'reduck'

import { getInitialState } from '../middlewares/projectStorage'

import { FETCH_ISSUES, LOGOUT } from '../actions'

const DEFAULT_STATE = {}

const initialState = getInitialState() || DEFAULT_STATE

const duck = new Duck('projects', initialState)

duck.addReducerCase(FETCH_ISSUES, (state, { payload }) => {
  const key = JSON.stringify(payload.repoInfos)
  if (state[key]) {
    return state
  }
  return {
    ...state,
    [key]: payload.repoInfos,
  }
})

duck.addReducerCase(LOGOUT, () => DEFAULT_STATE)

export default duck.reducer

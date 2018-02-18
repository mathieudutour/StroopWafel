import Duck from 'reduck'
import { LOCATION_CHANGE, CALL_HISTORY_METHOD } from 'react-router-redux'
import qs from 'qs'

import buildRoute, {
  DEFAULT_STATE as initialState,
  FilterBuilder,
  getReposFromParams,
} from './utils/buildRoute'

const duck = new Duck('@@router', initialState)

function parseArray(x) {
  if (Array.isArray(x)) {
    return x
  } else {
    return [x]
  }
}

export const goTo = duck.defineAction(CALL_HISTORY_METHOD, {
  creator({ filter, pathname, repoInfos }) {
    return {
      payload: {
        method: 'push',
        args: [buildRoute(pathname, filter, repoInfos)],
      },
    }
  },
})

duck.addReducerCase(LOCATION_CHANGE, {
  reducer(state, { payload }) {
    const { search } = payload
    const query = qs.parse(search.replace(/^\?/, ''))
    return {
      ...state,
      milestoneTitles: query.m
        ? parseArray(query.m)
        : initialState.milestoneTitles,
      labels: query.l ? parseArray(query.l) : initialState.labels,
      columnLabels: query.c ? parseArray(query.c) : initialState.columnLabels,
      username: query.u,
      states: query.s ? parseArray(query.s) : initialState.states,
      types: query.t ? parseArray(query.t) : initialState.types,
    }
  },
})

export const selectors = {
  getReposFromParams,
  FilterBuilder,
}

export default duck.reducer

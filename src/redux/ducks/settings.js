import Duck from 'reduck'
import { resolve } from 'redux-optimist-promise'
import { getInitialState } from '../middlewares/settingsStorage'

import {
  RESET_SETTINGS,
  TOGGLE_SHOW_SIMPLE_LIST,
  TOGGLE_HIDE_UNCATEGORIZED,
  TOGGLE_SHOW_EMPTY_COLUMNS,
  SET_VIEWING_MODE,
  TOGGLE_SHOW_PR_DATA,
  LOGIN,
} from '../actions'

export const VIEWING_MODE = {
  DEV: 1,
  QA: 2,
  COMBINED: 3,
}

const DEFAULT_STATE = {
  showSimpleList: false,
  hideUncategorized: false,
  showEmptyColumns: true,
  viewingMode: VIEWING_MODE.DEV, // The "I want to focus on Issues" or "PullRequests" tri-state
  showPullRequestData: false, // By default (anon users) this is unchecked. Gets checked when user logs in
}

const initialState = getInitialState() || DEFAULT_STATE

const duck = new Duck('settings', initialState)

export const resetSettings = duck.defineAction(RESET_SETTINGS, {
  creator() {
    return { meta: { updateSettingStorage: true } }
  },
  reducer() {
    return DEFAULT_STATE
  },
})

export const toggleShowSimpleList = duck.defineAction(TOGGLE_SHOW_SIMPLE_LIST, {
  creator() {
    return { meta: { updateSettingStorage: true } }
  },
  reducer(state) {
    return {
      ...state,
      showSimpleList: !state.showSimpleList,
    }
  },
})

export const toggleHideUncategorized = duck.defineAction(
  TOGGLE_HIDE_UNCATEGORIZED,
  {
    creator() {
      return { meta: { updateSettingStorage: true } }
    },
    reducer(state) {
      return {
        ...state,
        hideUncategorized: !state.hideUncategorized,
      }
    },
  }
)

export const toggleShowEmptyColumns = duck.defineAction(
  TOGGLE_SHOW_EMPTY_COLUMNS,
  {
    creator() {
      return { meta: { updateSettingStorage: true } }
    },
    reducer(state) {
      return {
        ...state,
        showEmptyColumns: !state.showEmptyColumns,
      }
    },
  }
)

export const setViewingMode = duck.defineAction(SET_VIEWING_MODE, {
  creator(mode) {
    return { payload: mode, meta: { updateSettingStorage: true } }
  },
  reducer(state, { payload }) {
    return {
      ...state,
      viewingMode: payload,
    }
  },
})

export const toggleShowPullRequestData = duck.defineAction(
  TOGGLE_SHOW_PR_DATA,
  {
    creator() {
      return { meta: { updateSettingStorage: true } }
    },
    reducer(state) {
      return {
        ...state,
        showPullRequestData: !state.showPullRequestData,
      }
    },
  }
)

duck.addReducerCase(resolve(LOGIN), state => {
  return {
    ...state,
    showPullRequestData: true,
  }
})

export default duck.reducer

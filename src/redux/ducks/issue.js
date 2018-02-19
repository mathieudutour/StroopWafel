import Duck from 'reduck'

import BipartiteGraph from './utils/bipartite-graph'
import { cardFactory, toIssueKey, getCard } from './utils/card'
import { getNewLabels, getNewAssignees } from '../middlewares/utils/moveIssues'

import {
  LOGOUT,
  CLEAR_CACHE,
  FETCH_ISSUES,
  GOT_ISSUES_FROM_DB,
  FETCH_LABELS,
  FETCH_MILESTONES,
  UPDATE_LABEL,
  DELETE_LABEL,
  UPDATE_ISSUE,
  TRY_MOVE_ISSUE,
  MOVE_ISSUES,
  CANCEL_MOVING_ISSUE,
} from '../actions'

const initialState = {
  GRAPH_CACHE: new BipartiteGraph(),
  CARD_CACHE: {},
  LABEL_CACHE: {},
  cards: [],
  labels: [],
  milestones: [],
  isPollingEnabled: false,
  movingIssue: null,
  fetchingIssues: false,
}

const duck = new Duck('issues', initialState)

duck.addReducerCase(LOGOUT, {
  reducer(state) {
    return {
      ...initialState,
      isPollingEnabled: state.isPollingEnabled,
    }
  },
})

export const clearCache = duck.defineAction(CLEAR_CACHE, {
  creator() {
    return {}
  },
  reducer(state) {
    return {
      ...initialState,
      isPollingEnabled: state.isPollingEnabled,
    }
  },
})

export const fetchLabels = duck.defineAction(FETCH_LABELS, {
  creator(repoOwner, repoName) {
    return {
      payload: { repoOwner, repoName },
      meta: {
        github: { action: 'fetchLabels' },
      },
    }
  },
  resolve(state, { payload: labels }) {
    labels.forEach(l => {
      state.LABEL_CACHE[l.name] = l // mutating the state, that's bad
    })
    return {
      ...state,
      labels,
    }
  },
  reject(state) {
    return {
      ...state,
      ready: true,
    }
  },
})

export const updateLabel = duck.defineAction(UPDATE_LABEL, {
  creator(repoInfos, oldName, newName) {
    return {
      payload: { repoInfos, oldName, newName },
      meta: {
        github: { action: 'updateLabel' },
        optimist: true,
      },
    }
  },
  resolve(state, { payload }) {
    ;(state.LABEL_CACHE[payload.oldName] || {}).name = payload.newName
    state.LABEL_CACHE[payload.newName] = state.LABEL_CACHE[payload.oldName]
    return {
      ...state,
      labels: state.labels.map(l => {
        if (l.name === payload.oldName) {
          return {
            ...l,
            name: payload.newName,
          }
        }
        return l
      }),
    }
  },
})

export const deleteLabel = duck.defineAction(DELETE_LABEL, {
  creator(repoInfos, name) {
    return {
      payload: { repoInfos, name },
      meta: {
        github: { action: 'deleteLabel' },
        optimist: true,
      },
    }
  },
  resolve(state, { payload }) {
    delete state.LABEL_CACHE[payload.name]
    return {
      ...state,
      labels: state.labels.filter(l => l.name !== payload.name),
    }
  },
})

export const fetchMilestones = duck.defineAction(FETCH_MILESTONES, {
  creator(repoOwner, repoName) {
    return {
      payload: { repoOwner, repoName },
      meta: {
        github: { action: 'fetchMilestones' },
      },
    }
  },
  resolve(state, { payload: milestones }) {
    return {
      ...state,
      milestones,
    }
  },
  reject(state) {
    return {
      ...state,
      ready: true,
    }
  },
})

export const tryToMoveIssue = duck.defineAction(TRY_MOVE_ISSUE, {
  creator({ card, label, milestone, user, oldUser }) {
    return {
      payload: { card, label, milestone, user, oldUser },
    }
  },
  reducer(state, { payload }) {
    return {
      ...state,
      movingIssue: payload,
    }
  },
})

export const cancelMovingIssue = duck.defineAction(CANCEL_MOVING_ISSUE, {
  creator() {
    return {}
  },
  reducer(state) {
    return {
      ...state,
      movingIssue: null,
    }
  },
})

function sortCards(cards) {
  return cards.sort((a, b) => {
    if (a.getDueAt() && b.getDueAt()) {
      return a.getDueAt() - b.getDueAt()
    } else if (a.getDueAt()) {
      return -1
    } else if (b.getDueAt()) {
      return 1
    } else {
      // newest on top
      return Date.parse(b.getUpdatedAt()) - Date.parse(a.getUpdatedAt())
    }
  })
}

export const _gotIssuesFromDB = duck.defineAction(GOT_ISSUES_FROM_DB, {
  creator(cards) {
    return {
      payload: cards,
    }
  },
  reducer(state, { payload: cards }) {
    const boundCards = cards.map(c =>
      cardFactory(state.CARD_CACHE, state.GRAPH_CACHE)(c, true)
    )
    state.GRAPH_CACHE.addCards(boundCards, getCard.bind(this, state.CARD_CACHE)) // mutating the state, that's bad
    boundCards.forEach(({ issue }) => {
      issue.labels.forEach(label => {
        state.LABEL_CACHE[label.name] = label // mutating the state, that's bad
      })
    })
    return {
      ...state,
      cards: sortCards(boundCards),
      labels: state.labels.length // if we haven't any labels yet, just take the ones in the cache
        ? state.labels
        : Object.keys(state.LABEL_CACHE).map(k => state.LABEL_CACHE[k]),
    }
  },
})

export const fetchIssues = duck.defineAction(FETCH_ISSUES, {
  creator(repoInfos) {
    return {
      payload: { repoInfos },
      meta: {
        updateProjectStorage: true,
        github: { action: 'fetchIssues' },
      },
    }
  },
  reducer(state) {
    return {
      ...state,
      fetchingIssues: true,
    }
  },
  resolve(state, { payload: cards }) {
    const boundCards = cards.map(c =>
      cardFactory(state.CARD_CACHE, state.GRAPH_CACHE)(c, true)
    )
    state.GRAPH_CACHE.addCards(boundCards, getCard.bind(this, state.CARD_CACHE)) // mutating the state, that's bad
    boundCards.forEach(({ issue }) => {
      issue.labels.forEach(label => {
        state.LABEL_CACHE[label.name] = label // mutating the state, that's bad
      })
    })
    return {
      ...state,
      fetchingIssues: false,
      cards: sortCards(boundCards),
    }
  },
  reject(state) {
    return {
      ...state,
      fetchingIssues: false,
    }
  },
})

export const updateIssue = duck.defineAction(UPDATE_ISSUE, {
  creator(card, update) {
    return {
      payload: { card, update },
      meta: {
        github: { action: 'updateIssue' },
        optimist: true,
      },
    }
  },
  reducer(state, { payload }) {
    const key = toIssueKey(payload.card)
    state.CARD_CACHE[key] = {
      ...state.CARD_CACHE[key],
      ...payload.update,
    }
    return {
      ...state,
      cards: state.cards.map(c => {
        if (toIssueKey(c) === toIssueKey(payload.card)) {
          return {
            ...c,
            ...payload.update,
          }
        }
        return c
      }),
    }
  },
})

export const moveIssues = duck.defineAction(MOVE_ISSUES, {
  creator(cards, { label, milestone, user, oldUser }) {
    return {
      payload: { cards, update: { label, milestone, user, oldUser } },
      meta: {
        github: { action: 'moveIssues' },
        optimist: true,
      },
    }
  },
  reducer(state, { payload }) {
    const { label, milestone, user, oldUser } = payload.update
    function getNewCard(card) {
      if (label || label === null) {
        card.issue.labels = getNewLabels(card, label)
      } else if (milestone || milestone === null) {
        card.issue.milestone = milestone
      } else if (user || user === null) {
        card.issue.assignees = getNewAssignees(card, user, oldUser)
      }
      return card
    }
    payload.cards.forEach(card => {
      const key = toIssueKey(card)
      state.CARD_CACHE[key] = getNewCard(state.CARD_CACHE[key])
    })
    const cardsKeys = payload.cards.map(toIssueKey)
    return {
      ...state,
      movingIssue: null,
      cards: state.cards.map(c => {
        if (cardsKeys.indexOf(toIssueKey(c)) !== -1) {
          return getNewCard(c)
        }
        return c
      }),
    }
  },
})

export const selectors = {
  getCard,
}

export default duck.reducer

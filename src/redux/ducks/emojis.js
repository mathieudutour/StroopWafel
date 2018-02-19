import Duck from 'reduck'

import { FETCH_EMOJIS } from '../actions'

const initialState = {}

const duck = new Duck('emojis', initialState)

export const fetchEmojis = duck.defineAction(FETCH_EMOJIS, {
  creator() {
    return {
      meta: {
        github: { action: 'fetchEmojis' },
      },
    }
  },
  resolve(state, { payload }) {
    return payload
  },
})

export default duck.reducer

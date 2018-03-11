import { KANBAN_LABEL } from '../../../helpers'
import { VIEWING_MODE } from '../settings'

export function filterByViewingMode(cards, viewingMode) {
  if (viewingMode === VIEWING_MODE.COMBINED) {
    // if we show everything, then we want everything
    return cards
  }

  const isFilteringPullRequests = viewingMode === VIEWING_MODE.QA

  const allPossiblyRelatedCards = {}
  cards.forEach(card => {
    // XOR
    if (
      isFilteringPullRequests ? !card.isPullRequest() : card.isPullRequest()
    ) {
      allPossiblyRelatedCards[card.key()] = true
    }
  })

  return cards.filter(card => {
    // XOR
    if (
      isFilteringPullRequests ? card.isPullRequest() : !card.isPullRequest()
    ) {
      // loop through all the related PR's. If one matches, remove this issue
      const related = card
        .getRelated()
        .filter(
          ({ vertex }) =>
            isFilteringPullRequests
              ? !vertex.isPullRequest()
              : vertex.isPullRequest()
        )

      const hasVisiblePullRequest = related.filter(
        ({ vertex: otherCard }) => allPossiblyRelatedCards[otherCard.key()]
      )
      return !hasVisiblePullRequest.length
    }

    return true
  })
}

export function filterByLabels(cards, labels) {
  const hasUncategorizedLabel = labels.some(l => !l)

  return cards.filter(card => {
    const containsAtLeastOneLabel = card.issue.labels.some(cardLabel =>
      labels.some(label => cardLabel.name === label)
    )
    if (containsAtLeastOneLabel) {
      return true
    } else if (hasUncategorizedLabel) {
      // If the issue does not match any list then add it to the backlog
      return card.issue.labels.every(l => !KANBAN_LABEL.test(l.name))
    }
    return false
  })
}

export function filterByMilestones(cards, milestones) {
  return cards.filter(card => {
    const hasMilestone = !!card.issue.milestone
    return milestones.some(
      m =>
        (!m && !hasMilestone) ||
        (m && hasMilestone && m === card.issue.milestone.title)
    )
  })
}

export function filterByUsers(cards, users) {
  return cards.filter(card => {
    const hasAssignees = card.issue.assignees && card.issue.assignees.length
    return users.some(
      u =>
        (!u && !hasAssignees) ||
        (u &&
          hasAssignees &&
          card.issue.assignees.some(assignee => assignee.login === u))
    )
  })
}

const keys = [
  'title',
  'body',
  'labels.name',
  'milestone.title',
  'state',
  'user.login',
  'assignees.login',
]

function flatten(array) {
  return array.reduce(
    (flat, toFlatten) =>
      flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten),
    []
  )
}

function getValuesForKey(key, item) {
  const _keys = key.split('.')
  let results = [item]
  _keys.forEach(_key => {
    const tmp = []
    results.forEach(result => {
      if (result) {
        if (result instanceof Array) {
          const index = parseInt(_key, 10)
          if (!Number.isNaN(index)) {
            tmp.push(result[index])
          } else {
            result.forEach(res => {
              tmp.push(res[_key])
            })
          }
        } else if (result && typeof result.get === 'function') {
          tmp.push(result.get(_key))
        } else {
          tmp.push(result[_key])
        }
      }
    })

    results = tmp
  })

  // Support arrays and Immutable lists.
  results = results.map(r => (r && r.push && r.toArray ? r.toArray() : r))
  results = flatten(results)

  return results
    .filter(r => typeof r === 'string' || typeof r === 'number')
    .map(e => e.toString())
}

function searchStrings(strings, term) {
  return strings.some(value => {
    try {
      if (value && value.search(term) !== -1) {
        return true
      }
      return false
    } catch (e) {
      return false
    }
  })
}

export function filterCards(cards, settings, filter) {
  let filtered = filterByViewingMode(cards, settings.viewingMode)

  if (filter.labels && filter.labels.length) {
    filtered = filterByLabels(cards, filter.labels)
    if (!filtered.length) {
      return filtered
    }
  }

  if (filter.milestoneTitles && filter.milestoneTitles.length) {
    filtered = filterByMilestones(cards, filter.milestoneTitles)
    if (!filtered.length) {
      return filtered
    }
  }

  if (filter.username) {
    filtered = filterByUsers(cards, [filter.username])
    if (!filtered.length) {
      return filtered
    }
  }

  if (filter.search) {
    const terms = filter.search.split(' ')
    filtered = cards.filter(card => {
      if (!card.issue) {
        return false
      }
      return terms.every(term => {
        // allow search in specific fields with the syntax `field:search`
        let currentKeys = keys
        let currentTerm = term

        if (term.indexOf(':') !== -1) {
          const parts = term.split(':')
          const searchedField = parts[0]
          currentTerm = parts[1] // eslint-disable-line
          currentKeys = keys.filter(
            key => key.toLowerCase().indexOf(searchedField) > -1
          )
        }

        return currentKeys.some(key => {
          const values = getValuesForKey(key, card.issue)
          return searchStrings(values, currentTerm)
        })
      })
    })
  }

  return filtered
}

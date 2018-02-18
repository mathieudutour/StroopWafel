import { KANBAN_LABEL, UNCATEGORIZED_NAME } from '../../../helpers'
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
      let related = card.getRelated().filter(({ vertex }) => {
        return isFilteringPullRequests
          ? !vertex.isPullRequest()
          : vertex.isPullRequest()
      })

      const hasVisiblePullRequest = related.filter(({ vertex: otherCard }) => {
        return allPossiblyRelatedCards[otherCard.key()]
      })
      return !hasVisiblePullRequest.length
    }

    return true
  })
}

export function filterByLabels(cards, labels) {
  const hasUncategorizedLabel = labels.some(l => l.name === UNCATEGORIZED_NAME)

  return cards.filter(card => {
    const containsAtLeastOneLabel = card.issue.labels.some(cardLabel => {
      return labels.some(label => cardLabel.name === label.name)
    })
    if (containsAtLeastOneLabel) {
      return true
    } else if (hasUncategorizedLabel) {
      // If the issue does not match any list then add it to the backlog
      for (const l of card.issue.labels) {
        if (KANBAN_LABEL.test(l.name)) {
          return false
        }
      }
      // no list labels, so include it in the backlog
      return true
    }
  })
}

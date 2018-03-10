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

  return filtered
}

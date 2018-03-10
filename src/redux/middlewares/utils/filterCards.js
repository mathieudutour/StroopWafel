import _ from 'underscore'
import { UNCATEGORIZED_NAME, KANBAN_LABEL } from '../../../helpers'

function matchesRepoInfo(repoInfos, card) {
  return repoInfos.some(
    ({ repoOwner, repoName }) =>
      repoOwner === card.repoOwner && repoName === card.repoName
  )
}

function isUser(issue, username) {
  if (issue.assignee) {
    if (issue.assignee.login !== username) {
      return false
    }
  }
  if (issue.user.login !== username) {
    return false
  }
  return true
}

export function filterCard(
  card,
  filter,
  repoInfos,
  includedLabelNames,
  excludedLabelNames,
  includedMilestoneTitles,
  excludedMilestoneTitles
) {
  const {
    milestoneTitles,
    username,
    states,
    types,
    labels,
    columnLabels,
  } = filter

  /* eslint-disable no-param-reassign */
  if (!includedLabelNames) {
    includedLabelNames = labels.filter(t => t[0] !== '-')
  }
  if (!excludedLabelNames) {
    excludedLabelNames = labels.filter(t => t[0] !== '-')
  }
  if (!includedMilestoneTitles) {
    includedMilestoneTitles = milestoneTitles.filter(m => m[0] !== '-')
  }
  if (!excludedMilestoneTitles) {
    excludedMilestoneTitles = milestoneTitles
      .filter(m => m[0] === '-')
      .map(m => m.substring(1))
  }
  /* eslint-enable */
  const { issue } = card

  // Skip the card if it is not one of the repos
  if (!matchesRepoInfo(repoInfos, card)) {
    return false
  }

  // skip if the card is not in the right state
  if (states.indexOf(issue.state) === -1) {
    return false
  }

  if (types.indexOf(card.getIssueType()) === -1) {
    return false
  }

  // issue must match the user if one is selected (either assignee or creator (if none))
  if (username) {
    // Support negating the username
    if (username[0] === '-') {
      if (isUser(issue, username.substring(1))) {
        return false
      }
    } else if (!isUser(issue, username)) {
      return false
    }
  }
  // issue must be in one of the milestones (if milestones are selected)
  if (milestoneTitles.length > 0) {
    if (includedMilestoneTitles.length > 0) {
      if (!issue.milestone) {
        return false
      } // TODO: Read the settings to see if no milestones are allowed
    }
    if (issue.milestone) {
      if (
        includedMilestoneTitles.length > 0 &&
        includedMilestoneTitles.indexOf(issue.milestone.title) < 0
      ) {
        return false
      }
      if (
        excludedMilestoneTitles.length > 0 &&
        excludedMilestoneTitles.indexOf(issue.milestone.title) >= 0
      ) {
        return false
      }
    }
  }
  // If one of the labels is UNCATEGORIZED_NAME then do something special
  if (labels.indexOf(UNCATEGORIZED_NAME) >= 0) {
    let isUnlabeled = true
    issue.labels.forEach(label => {
      if (KANBAN_LABEL.test(label.name)) {
        isUnlabeled = false
      }
    })
    if (!isUnlabeled) {
      return false
    }
  }
  if (labels.indexOf(`-${UNCATEGORIZED_NAME}`) >= 0) {
    let isUnlabeled = true
    issue.labels.forEach(label => {
      if (KANBAN_LABEL.test(label.name)) {
        isUnlabeled = false
      }
    })
    if (isUnlabeled) {
      return false
    }
  }
  const labelNames = issue.labels.map(label => label.name)
  // issue must have all the tags (except UNCATEGORIZED_NAME)
  // and MUST NOT have any of the excluded tags
  // and must have at least 1 of the columnLabels (but one of those might be UNCATEGORIZED_NAME)
  let issueColumnNames = labelNames.filter(tagName =>
    KANBAN_LABEL.test(tagName)
  )
  // If the issue does not have a column then add UNCATEGORIZED_NAME to the set of columns to check if they are filtered
  if (issueColumnNames.length === 0) {
    issueColumnNames = [UNCATEGORIZED_NAME].concat(issueColumnNames)
  }
  const hasAColumn = _.intersection(columnLabels, issueColumnNames).length > 0
  if (columnLabels.length && !hasAColumn) {
    return false
  }
  if (
    _.difference(_.without(includedLabelNames, UNCATEGORIZED_NAME), labelNames)
      .length > 0
  ) {
    return false
  }
  if (_.intersection(excludedLabelNames, labelNames).length > 0) {
    return false
  }
  return true
}

export default function filterCards(cards, filter, repoInfos) {
  const { milestoneTitles, labels } = filter

  const includedLabelNames = labels.filter(t => t[0] !== '-')
  const excludedLabelNames = labels
    .filter(t => t[0] === '-')
    .map(t => t.substring(1))

  const includedMilestoneTitles = milestoneTitles.filter(m => m[0] !== '-')
  const excludedMilestoneTitles = milestoneTitles
    .filter(m => m[0] === '-')
    .map(m => m.substring(1))

  return cards.filter(card =>
    filterCard(
      card,
      filter,
      repoInfos,
      includedLabelNames,
      excludedLabelNames,
      includedMilestoneTitles,
      excludedMilestoneTitles
    )
  )
}

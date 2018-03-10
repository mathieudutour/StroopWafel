import Dexie from 'dexie'
import filterCards from './filterCards'
import Card from '../../ducks/utils/card'

//
// Declare Database
//
const db = new Dexie('stroopwafel')
db.version(1).stores({
  issues: 'id,[repoOwner+repoName],state',
  repoLabels: '[repoOwner+repoName]',
  repositories: '[repoOwner+repoName]',
})

window._db = db

export function resetDatabases() {
  return db.delete().then(() => db.open())
}

export function fetchCards(filter, repoInfos) {
  const { states } = filter
  const cards = []
  let query
  if (states.length === 1) {
    query = db.issues.where('state').equals('open')
  } else if (states.length === 2 /* [open, closed] */) {
    query = db.issues
  }
  return query
    .each(value => {
      const { repoOwner, repoName, issue, pr, status } = value
      const { number } = issue
      cards.push(new Card(repoOwner, repoName, number, null, issue, pr, status))
    })
    .then(() => filterCards(cards, filter, repoInfos))
}

function toUserValue(user) {
  return {
    avatarUrl: user.avatarUrl,
    id: user.id,
    login: user.login,
    type: user.type,
  }
}

function toLabelValue(label) {
  return {
    color: label.color,
    id: label.id,
    name: label.name,
  }
}

function toIssueValue(issue) {
  return {
    assignees: issue.assignees.map(toUserValue),
    body: issue.body,
    closedAt: issue.closedAt,
    comments: issue.comment,
    createdAt: issue.createdAt,
    id: issue.id,
    labels: issue.labels.map(toLabelValue),
    locked: issue.locked,
    milestone: issue.milestone,
    number: issue.number,
    state: issue.state,
    title: issue.title,
    updatedAt: issue.updatedAt,
    user: toUserValue(issue.user),
    pullRequest: !!issue.pullRequest,
  }
}

function toStatusValue(status) {
  return {
    sha: status.sha,
    state: status.state,
    statuses: (status.statuses || []).map(s => ({
      context: s.context,
      createdAt: s.createdAt,
      description: s.description,
      state: s.state,
      targetUrl: s.targetUrl,
    })),
    totalCount: status.totalCount,
  }
}

function toPRValue(pr) {
  return {
    base: {
      label: pr.base.label,
      ref: pr.base.ref,
      repo: {
        defaultBranch: pr.base.repo.defaultBranch,
        id: pr.base.repo.id,
        name: pr.base.repo.name,
        owner: pr.base.repo.owner && toUserValue(pr.base.repo.owner),
      },
      sha: pr.base.sha,
    },
    commits: pr.commits,
    head: {
      label: pr.head.label,
      ref: pr.head.ref,
      repo: {
        defaultBranch: pr.head.repo.defaultBranch,
        id: pr.head.repo.id,
        name: pr.head.repo.name,
        owner: pr.head.repo.owner && toUserValue(pr.head.repo.owner),
      },
      sha: pr.head.sha,
    },
    mergeable: pr.mergeable,
    mergeableState: pr.mergeableState,
    merged: pr.merged,
    mergedAt: pr.mergedAt,
    rebaseable: pr.rebaseable,
    requestedReviewers: pr.requestedReviewers.map(toUserValue),
    reviewComments: pr.reviewComments,
  }
}

function toCardValue(card) {
  const { repoOwner, repoName, number, issue, pr, prStatus } = card
  const value = {
    id: issue.id,
    repoOwner,
    repoName,
    number,
    issue,
    state: issue.state,
  }
  if (issue) value.issue = toIssueValue(issue)
  if (pr) value.pr = toPRValue(pr)
  if (prStatus) value.status = toStatusValue(prStatus)
  return value
}

export function putCard(card) {
  return db.issues.put(toCardValue(card))
}

export function putCards(cards) {
  return db.issues.bulkPut(cards.map(toCardValue))
}

export function putRepoLabels(repoOwner, repoName, labels) {
  return db.repoLabels.put({ labels, repoOwner, repoName })
}

export function getRepoOrNull(repoOwner, repoName) {
  return db.repositories
    .get({
      repoOwner,
      repoName,
    })
    .then(val => {
      if (!val.repoName) {
        console.error(
          'BUG: Looks like we retrieved something that is not a repo. Maybe it was a string?',
          val
        )
        throw new Error(
          'BUG: Looks like we retrieved something that is not a repo. Maybe it was a string?'
        )
      }
      return val
    })
    .catch(() => null)
}

export function putRepos(repos) {
  return db.repositories.bulkPut(repos.map(r => r))
}

export function putCardsAndRepos(cards, repos) {
  return Promise.all([putCards(cards), putRepos(repos)])
}

export function getRepoLabelsOrNull(repoOwner, repoName) {
  return db.repoLabels
    .get({
      repoOwner,
      repoName,
    })
    .catch(() => null)
}

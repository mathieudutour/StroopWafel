import GithubClient from './utils/githubClient'
import * as Database from './utils/indexedDB'
import fetchIssues from './utils/fetchIssues'
import fetchLabels from './utils/fetchLabels'
import fetchMilestones from './utils/fetchMilestones'
import moveIssues from './utils/moveIssues'

const githubClient = new GithubClient()
window.githubClient = githubClient

export default ({ getState, dispatch }) => next => action => {
  if (!action || !action.meta || !action.meta.github) {
    return next(action)
  }

  let promise
  switch (action.meta.github.action) {
    case 'logout':
      promise = githubClient.reset()
      break
    case 'login':
      promise = githubClient
        .reset()
        .then(() => {
          githubClient.credentials.token = action.payload.token
          githubClient.credentials.rootURL = action.payload.rootURL
        })
        .then(() => githubClient.getOcto())
        .then(({ user }) => user.fetch())
      break
    case 'fetchUser':
      promise = githubClient.hasCredentials()
        ? githubClient.getOcto().then(({ user }) => user.fetch())
        : Promise.reject(new Error('no credentials'))
      break
    case 'fetchRepos':
      promise = githubClient.hasCredentials()
        ? githubClient.getOcto().then(({ user }) => user.repos.fetchAll())
        : Promise.reject(new Error('no credentials'))
      break
    case 'fetchRepo':
      promise = githubClient.hasCredentials()
        ? githubClient
            .getOcto()
            .then(({ repos }) => repos(action.payload.repoFullName).fetch())
        : Promise.reject(new Error('no credentials'))
      break
    case 'fetchEmojis':
      promise = githubClient
        .getAnonymousOcto()
        .then(({ emojis }) => emojis.fetch())
      break
    case 'fetchIssues': {
      const { filter } = getState()

      promise = fetchIssues(
        githubClient,
        filter,
        action.payload.repoInfos,
        dispatch
      )
      break
    }
    case 'fetchLabels':
      promise = fetchLabels(
        githubClient,
        action.payload.repoOwner,
        action.payload.repoName
      )
      break
    case 'fetchMilestones':
      promise = fetchMilestones(
        githubClient,
        action.payload.repoOwner,
        action.payload.repoName
      )
      break
    case 'updateLabel':
      promise = githubClient.getOcto().then(({ repos }) =>
        Promise.all(
          action.payload.repoInfos.map(repoInfo =>
            repos(repoInfo)
              .labels(action.payload.oldName)
              .update({ name: action.payload.newName })
          )
        )
      )
      break
    case 'deleteLabel':
      promise = githubClient.getOcto().then(({ repos }) =>
        Promise.all(
          action.payload.repoInfos.map(repoInfo =>
            repos(repoInfo)
              .labels(action.payload.name)
              .remove()
          )
        )
      )
      break
    case 'updateIssue':
      promise = githubClient.getOcto().then(({ repos }) =>
        repos(action.payload.card.repoOwner, action.payload.card.repoName)
          .issues(action.payload.card.number)
          .update(action.payload.update)
      )
      break
    case 'moveIssues':
      promise = moveIssues(
        githubClient,
        action.payload.cards,
        action.payload.update
      )
      break
    case 'reset':
      promise = Promise.all([githubClient.reset(), Database.resetDatabases()])
      break
    default:
      break
  }

  const actionToDispatch = {
    ...action,
    meta: {
      ...action.meta,
      ...(promise && { promise }),
    },
  }

  delete actionToDispatch.meta.github

  return next(actionToDispatch)
}

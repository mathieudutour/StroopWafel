import _ from 'underscore'

import { KANBAN_LABEL } from '../../../helpers'
import * as Database from './indexedDB'
import fetchLabels from './fetchLabels'
import { filterCard } from './filterCards'
import { _gotIssuesFromDB } from '../../ducks/issue'

function emptyFilter() {
  return {
    milestoneTitles: [],
    labels: [],
    states: ['open', 'close'],
    types: ['issue', 'pull-request'],
    columnLabels: [],
  }
}

function _getLabelsRemoved(newLabels, { labels: oldLabels = [] } = {}) {
  const newLabelNames = newLabels.map(({ name }) => name).sort()
  const oldLabelNames = oldLabels.map(({ name }) => name).sort()
  return _.difference(oldLabelNames, newLabelNames)
}

function _getDidLabelsChange(newLabels, { labels: oldLabels = [] } = {}) {
  const newLabelNames = newLabels.map(({ name }) => name)
  const oldLabelNames = oldLabels.map(({ name }) => name)
  return (
    _.intersection(oldLabelNames, newLabelNames).length !== newLabels.length
  )
}

function _fetchLastSeenUpdatesForRepo(
  githubClient,
  repoOwner,
  repoName,
  lastSeenAt,
  isPrivate,
  didLabelsChange
) {
  const opts = {
    per_page: 100,
    sort: 'updated',
    state: 'all', // fetch opened and closed Issues
    direction: 'desc',
  }
  if (lastSeenAt) {
    opts.since = lastSeenAt
  }
  const method = githubClient.canCacheLots() ? 'fetchAll' : 'fetchOne'
  return githubClient
    .getOcto()
    .then(({ repos }) => repos(repoOwner, repoName).issues[method](opts))
    .then(result => {
      const items = Array.isArray(result) ? result : result.items
      // If a repository has 0 events it probably has not changed in a while
      // or never had any commits. Do not keep trying to fetch all the Issues though
      // so set the lastSeenAt to be something non-zero
      // since `null` means stroopwafel has not fetched all the Issues before.
      const newLastSeenAt = items.length ? items[0].updatedAt : null
      const cards = items.reduce((prev, issue) => {
        if (lastSeenAt === issue.updatedAt) {
          // If this Issue was updated at the same time then ignore it
          // TODO: this is a bit imprecise. maybe it's safer to not exclude it this way
          return prev
        }
        console.log(
          'Saw an updated/new issue!',
          repoName,
          issue.number,
          'updated:',
          issue.updatedAt,
          'last saw this repo:',
          lastSeenAt
        )

        prev.push({ repoOwner, repoName, number: issue.number, issue })
        return prev
      }, [])
      const ret = { cards, didLabelsChange }
      // only include the repository key if the lastSeenAt changed
      // That way fewer things will need to be saved to the DB
      if (lastSeenAt !== newLastSeenAt || !lastSeenAt) {
        ret.repository = {
          repoOwner,
          repoName,
          lastSeenAt: newLastSeenAt,
          isPrivate,
        }
      }
      return ret
    })
}

function _fetchUpdatesForRepo(githubClient, repo) {
  const repoOwner = repo.owner.login
  const repoName = repo.name
  const isPrivate = repo.private
  // Check if the set of labels have changed for this repo.
  // If so, then for every label that no longer exists we need to fetch the Issue and update it.
  // The reason is that the label _could_ have been renamed.
  return Promise.all([
    fetchLabels(githubClient, repoOwner, repoName),
    Database.getRepoLabelsOrNull(repoOwner, repoName),
  ]).then(([newLabels, oldLabels]) => {
    // Check if the labels have changed.
    const labelsRemoved = _getLabelsRemoved(newLabels, oldLabels || [])
    // TODO: when labelsRemoved (or when they changed at all, then we should refresh the board so the new columns show up)

    // find all the Issues that have labels that have been removed so we can update them
    return Database.fetchCards(emptyFilter(), [{ repoOwner, repoName }])
      .then(cards =>
        cards.filter(card =>
          labelsRemoved.some(label => {
            const filter = emptyFilter()
            if (KANBAN_LABEL.test(label)) {
              filter.columnLabels.push(label)
            } else {
              filter.labels.push(label)
            }
            return filterCard(card, filter, [{ repoOwner, repoName }])
          })
        )
      )
      .then(cardsArrays => {
        const cards = _.unique(_.flatten(cardsArrays))
        // Re-fetch each Issue
        return Promise.all(
          cards.map(card =>
            card.fetchIssue(githubClient, { skipSavingToDb: true })
          )
        )
      })
      .then(cards => Database.putCards(cards))
      .then(() =>
        // Update the list of labels now that all the Issues have been updated
        Database.putRepoLabels(repoOwner, repoName, newLabels)
      )
      .then(() =>
        // FINALLY, actually fetch the updates
        Database.getRepoOrNull(repoOwner, repoName).then(_repo => {
          let lastSeenAt
          if (_repo && _repo.lastSeenAt) {
            lastSeenAt = _repo.lastSeenAt // eslint-disable-line
          }
          return _fetchLastSeenUpdatesForRepo(
            githubClient,
            repoOwner,
            repoName,
            lastSeenAt,
            isPrivate,
            _getDidLabelsChange(newLabels, oldLabels)
          )
        })
      )
  })
}

export default function fetchIssues(githubClient, filter, repoInfos, dispatch) {
  let fetched = false

  Database.fetchCards(filter, repoInfos)
    .then(cards => {
      if (!fetched) {
        dispatch(_gotIssuesFromDB(cards))
      }
    })
    .catch(() => {})

  return githubClient
    .getOcto()
    .then(client =>
      Promise.all(
        repoInfos.map(({ repoOwner, repoName }) =>
          client
            .repos(repoOwner, repoName)
            .fetch()
            .then(repo => _fetchUpdatesForRepo(githubClient, repo))
        )
      )
    )
    .then(repoAndCardsUpdate => {
      const repoAndCards = _.flatten(repoAndCardsUpdate, true /* shallow */) // the asterisks in the URL become an array of repoAndCards so we need to flatten
      const repos = repoAndCards
        .map(({ repository }) => repository)
        .filter(v => !!v)
      // if the lastSeenAt did not change then repository field will be missing
      const cards = _.flatten(
        repoAndCards.map(x => x.cards),
        true /* shallow */
      )
      // didLabelsChange is true if at least one of the repos labels changed
      const didLabelsChange =
        _.flatten(
          repoAndCards.map(x => x.didLabelsChange),
          true /* shallow */
        ).indexOf(true) >= 0

      // Save the cards
      let putCardsAndRepos
      if (githubClient.canCacheLots()) {
        putCardsAndRepos = Database.putCardsAndRepos(cards, repos)
      } else {
        // when not logged in then do not bother saving the last-updated time for each repo
        // since we have only been asking for 1 page of results.
        putCardsAndRepos = Database.putCards(cards)
      }

      return putCardsAndRepos.then(() => ({ repos, cards, didLabelsChange }))
    })
    .then(() => {
      fetched = true
      return Database.fetchCards(filter, repoInfos)
    })
}

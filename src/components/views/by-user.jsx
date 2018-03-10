import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router'

import { selectors } from '../../redux/ducks/filter'
import { filterCards, filterByUsers } from '../../redux/ducks/utils/filterCards'
import { fetchIssues } from '../../redux/ducks/issue'
import IssueList from '../issue-list'
import Issue from '../issue'
import AppNav from '../app/nav'

const KanbanColumn = ({ user, cards, primaryRepoName, filters, settings }) => {
  const issueComponents = cards.map(card => (
    <Issue
      key={card.key()}
      settings={settings}
      filters={filters}
      primaryRepoName={primaryRepoName}
      card={card}
      oldUser={user}
    />
  ))

  let heading
  if (user) {
    heading = (
      <Link
        className="user-title"
        to={this.props.filters.toggleUsername(user.login).url()}
      >
        {user.login}
      </Link>
    )
  } else {
    heading = 'No Assignee'
  }

  return (
    <div className="kanban-board-column">
      <IssueList title={heading} user={user}>
        {issueComponents}
      </IssueList>
    </div>
  )
}

class UsersView extends React.Component {
  componentWillMount() {
    const { repoInfos, dispatch } = this.props
    dispatch(fetchIssues(repoInfos))
  }

  render() {
    const { repoInfos, cards, filters, settings, filter, params } = this.props
    const [{ repoName }] = repoInfos // primaryRepoName

    const logins = {}
    cards.forEach(card => {
      if (card.issue && card.issue.assignees && card.issue.assignees.length) {
        card.issue.assignees.forEach(user => {
          logins[user.login] = user
        })
      }
    })

    let users = Object.keys(logins)
      .sort()
      .map(k => logins[k])

    if (!settings.hideUncategorized) {
      users = [null].concat(users)
    }

    const isFilteringByColumn = filter.username

    const cardsToView = filterCards(cards, settings, filter)

    const kanbanColumns = users.map(user => {
      // if we are filtering and it's not the right column
      if (isFilteringByColumn && (!user || filter.username !== user.login)) {
        return null
      }

      const columnCards = filterByUsers(cardsToView, [user ? user.login : user])

      if (
        !isFilteringByColumn &&
        !settings.showEmptyColumns &&
        !columnCards.length
      ) {
        return null
      }

      return (
        <KanbanColumn
          key={user ? user.login : 'uncategorized'}
          filters={filters}
          settings={settings}
          user={user}
          cards={columnCards}
          primaryRepoName={repoName}
        />
      )
    })

    return (
      <div className="kanban-board">
        <AppNav params={params} />
        {kanbanColumns}
      </div>
    )
  }
}

export default connect((state, ownProps) => {
  const repoInfos = selectors.getReposFromParams(ownProps.params)
  return {
    repoInfos,
    filters: new selectors.FilterBuilder(state.filter, repoInfos),
    settings: state.settings,
    cards: state.issues.cards,
    milestones: state.issues.milestones,
    filter: state.filter,
  }
})(UsersView)

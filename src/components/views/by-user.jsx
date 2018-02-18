import React from 'react'
import { connect } from 'react-redux'
import { PersonIcon } from 'react-octicons'

import { selectors } from '../../redux/ducks/filter'
import { fetchIssues } from '../../redux/ducks/issue'
import IssueList from '../issue-list'
import Issue from '../issue'

class KanbanColumn extends React.Component {
  render() {
    const { user, cards, primaryRepoName, filters } = this.props

    const issueComponents = cards.map(card => {
      return (
        <Issue
          key={card.key()}
          filters={filters}
          primaryRepoName={primaryRepoName}
          card={card}
        />
      )
    })

    const heading = (
      <span className="user-title">
        <PersonIcon />
        {user.login}
      </span>
    )

    return (
      <div className="kanban-board-column">
        <IssueList title={heading} user={user}>
          {issueComponents}
        </IssueList>
      </div>
    )
  }
}

class UsersView extends React.Component {
  componentWillMount() {
    const { repoInfos, dispatch } = this.props
    dispatch(fetchIssues(repoInfos))
  }

  render() {
    const { repoInfos, cards, filters } = this.props
    const [{ repoName }] = repoInfos // primaryRepoName

    const logins = {}
    for (const card of cards) {
      if (card.issue && card.issue.user) {
        logins[card.issue.user.login] = card.issue.user
      }
    }
    const users = Object.keys(logins)
      .sort()
      .map(k => logins[k])

    const kanbanColumns = users.map(user => {
      // If we are filtering by a kanban column then only show that column
      // Otherwise show all columns
      const columnCards = cards.filter(card => {
        return (
          (card.issue.owner && card.issue.owner.login === user.login) ||
          card.issue.user.login === user.login
        )
      })

      // Show the column when:
      // isFilteringByColumn = label (the current column we are filtering on)
      // !isFilteringByColumn && (!getShowEmptyColumns || columnCards.length)

      return (
        <KanbanColumn
          key={user.login}
          filters={filters}
          user={user}
          cards={columnCards}
          primaryRepoName={repoName}
        />
      )
    })

    return <div className="kanban-board">{kanbanColumns}</div>
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

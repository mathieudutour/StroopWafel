import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import isDeepEqual from 'fast-deep-equal'

import { selectors } from '../../redux/ducks/filter'
import {
  KANBAN_LABEL,
  UNCATEGORIZED_NAME,
  sortByColumnName,
} from '../../helpers'
import { fetchLabels, fetchIssues } from '../../redux/ducks/issue'
import {
  filterByViewingMode,
  filterByLabels,
} from '../../redux/ducks/utils/filterCards'
import IssueList from '../issue-list'
import Issue from '../issue'
import AnonymousModal from '../anonymous-modal'

let showedWarning = false

const filterKanbanLabels = labels => {
  return labels
    .filter(label => KANBAN_LABEL.test(label.name))
    .sort(sortByColumnName())
}

class KanbanColumn extends React.Component {
  render() {
    const { label, cards, primaryRepo, settings, filters } = this.props

    const issueComponents = cards.map(card => {
      return (
        <Issue
          key={card.issue.id}
          filters={filters}
          primaryRepoName={primaryRepo.repoName}
          card={card}
        />
      )
    })

    let name
    if (KANBAN_LABEL.test(label.name)) {
      name = label.name.replace(/^\d+ - /, ' ')
    } else {
      name = label.name
    }
    const title = (
      <Link
        className="label-title"
        to={filters.toggleColumnLabel(label.name).url()}
      >
        {name}
      </Link>
    )

    if (issueComponents.length || settings.isShowEmptyColumns) {
      return (
        <div key={label.name} className="kanban-board-column">
          <IssueList title={title} label={label}>
            {issueComponents}
          </IssueList>
        </div>
      )
    } else {
      return null // TODO: Maybe the panel should say "No Issues" (but only if it's the only column)
    }
  }
}

class KanbanRepo extends React.Component {
  componentWillMount() {
    this.fetchStuff(this.props)
  }

  componentWillReceiveProps(nextProps) {
    if (
      !isDeepEqual(nextProps.repoInfos, this.props.repoInfos) ||
      !isDeepEqual(nextProps.filter, this.props.filter)
    ) {
      this.fetchStuff(nextProps)
    }
  }

  fetchStuff(props) {
    const { repoInfos, dispatch } = props
    // Get the "Primary" repo for milestones and labels
    const [{ repoOwner, repoName }] = repoInfos
    dispatch(fetchLabels(repoOwner, repoName))
    dispatch(fetchIssues(repoInfos))
  }

  render() {
    const {
      labels,
      cards,
      repoInfos,
      settings,
      filters,
      fetchingIssues,
    } = this.props

    // Get the primary repo
    const [primaryRepo] = repoInfos

    let allLabels
    if (!settings.isHideUncategorized) {
      const uncategorized = [{ name: UNCATEGORIZED_NAME }]
      allLabels = uncategorized.concat(labels)
    } else {
      allLabels = labels
    }

    const kanbanLabels = filterKanbanLabels(allLabels)

    if (
      !!showedWarning &&
      !fetchingIssues &&
      kanbanLabels.length === (settings.isHideUncategorized ? 0 : 1)
    ) {
      showedWarning = true
      alert(
        'You are viewing a repository that does not have any properly formatted labels denoting columns so everything will show up as "Uncategorized". To create columns, rename your labels so they are "# - title" where # denotes the order of the column'
      )
    }

    const isFilteringByColumn = false

    const cardsToView = filterByViewingMode(cards, settings.viewingMode)

    const kanbanColumns = kanbanLabels.map(label => {
      // If we are filtering by a kanban column then only show that column
      // Otherwise show all columns
      const columnCards = filterByLabels(cardsToView, [label])

      // Show the column when:
      // isFilteringByColumn = label (the current column we are filtering on)
      // !isFilteringByColumn && (!getShowEmptyColumns || columnCards.length)

      if (
        (!isFilteringByColumn &&
          (settings.isShowEmptyColumns || columnCards.length)) ||
        (isFilteringByColumn && isFilteringByColumn.name === label.name)
      ) {
        return (
          <KanbanColumn
            filters={filters}
            settings={settings}
            key={label.name}
            label={label}
            cards={columnCards}
            primaryRepo={primaryRepo}
          />
        )
      } else {
        return null
      }
    })

    return (
      <div className="kanban-board">
        {kanbanColumns}
        {/* addCardList */}
        <AnonymousModal />
      </div>
    )
  }
}

export default connect((state, ownProps) => {
  const repoInfos = selectors.getReposFromParams(ownProps.params)
  return {
    repoInfos,
    filter: state.filter,
    filters: new selectors.FilterBuilder(state.filter, repoInfos),
    settings: state.settings,
    cards: state.issues.cards,
    labels: state.issues.labels,
    fetchingIssues: state.issues.fetchingIssues,
  }
})(KanbanRepo)

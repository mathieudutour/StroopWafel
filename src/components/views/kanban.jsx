import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import isDeepEqual from 'fast-deep-equal'

import { selectors } from '../../redux/ducks/filter'
import { KANBAN_LABEL, sortByColumnName } from '../../helpers'
import { fetchLabels, fetchIssues } from '../../redux/ducks/issue'
import {
  filterCards,
  filterByLabels,
} from '../../redux/ducks/utils/filterCards'
import IssueList from '../issue-list'
import Issue from '../issue'
import AnonymousModal from '../anonymous-modal'
import { Timer } from '../time'
import AppNav from '../app/nav'

let showedWarning = false

const filterKanbanLabels = labels =>
  labels.filter(label => KANBAN_LABEL.test(label.name)).sort(sortByColumnName())

const KanbanColumn = ({ label, cards, primaryRepo, filters, settings }) => {
  const issueComponents = cards.map(card => (
    <Issue
      key={card.issue.id}
      settings={settings}
      filters={filters}
      primaryRepoName={primaryRepo.repoName}
      card={card}
    />
  ))

  let heading
  if (label) {
    let { name } = label
    if (KANBAN_LABEL.test(label.name)) {
      name = label.name.replace(/^\d+ - /, ' ')
    }
    heading = (
      <Link
        className="label-title"
        to={filters.toggleColumnLabel(label.name).url()}
      >
        {name}
      </Link>
    )
  } else {
    heading = 'Uncategorized'
  }

  return (
    <div className="kanban-board-column">
      <IssueList title={heading} label={label}>
        {issueComponents}
      </IssueList>
    </div>
  )
}

function fetchStuff(repoInfos, dispatch) {
  // Get the "Primary" repo for milestones and labels
  const [{ repoOwner, repoName }] = repoInfos
  dispatch(fetchLabels(repoOwner, repoName))
  dispatch(fetchIssues(repoInfos))
}

class KanbanRepo extends React.Component {
  componentWillMount() {
    const { repoInfos, dispatch } = this.props
    this.fetchAction = fetchStuff.bind(this, repoInfos, dispatch)
    this.fetchAction()
    Timer.onTick(this.fetchAction)
  }

  componentWillReceiveProps(nextProps) {
    if (
      !isDeepEqual(nextProps.repoInfos, this.props.repoInfos) ||
      !isDeepEqual(nextProps.filter, this.props.filter)
    ) {
      Timer.offTick(this.fetchAction)
      this.fetchAction = fetchStuff.bind(
        this,
        nextProps.repoInfos,
        nextProps.dispatch
      )
      this.fetchAction()
      Timer.onTick(this.fetchAction)
    }
  }

  componentWillUnmount() {
    Timer.offTick(this.fetchAction)
  }

  render() {
    const {
      labels,
      cards,
      repoInfos,
      settings,
      filters,
      filter,
      fetchingIssues,
      params,
    } = this.props

    // Get the primary repo
    const [primaryRepo] = repoInfos

    let kanbanLabels = filterKanbanLabels(labels)

    if (!settings.hideUncategorized) {
      kanbanLabels = [null].concat(kanbanLabels)
    }

    if (
      !!showedWarning &&
      !fetchingIssues &&
      kanbanLabels.length === (settings.hideUncategorized ? 0 : 1)
    ) {
      showedWarning = true
      alert(
        'You are viewing a repository that does not have any properly formatted labels denoting columns so everything will show up as "Uncategorized". To create columns, rename your labels so they are "# - title" where # denotes the order of the column'
      )
    }

    const isFilteringByColumn = filter.columnLabels.length

    const cardsToView = filterCards(cards, settings, filter)

    const kanbanColumns = kanbanLabels.map(label => {
      // if we are filtering and it's not the right column
      if (
        isFilteringByColumn &&
        (!label || filter.columnLabels.every(c => c !== label.name))
      ) {
        return null
      }

      const columnCards = filterByLabels(cardsToView, [
        label ? label.name : label,
      ])

      if (
        !isFilteringByColumn &&
        !settings.showEmptyColumns &&
        !columnCards.length
      ) {
        return null
      }

      return (
        <KanbanColumn
          filters={filters}
          settings={settings}
          key={label ? label.name : 'uncategorized'}
          label={label}
          cards={columnCards}
          primaryRepo={primaryRepo}
        />
      )
    })

    return (
      <div className="kanban-board">
        <AppNav params={params} />
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

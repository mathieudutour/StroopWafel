import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router'

import { selectors } from '../../redux/ducks/filter'
import { fetchMilestones, fetchIssues } from '../../redux/ducks/issue'
import {
  filterCards,
  filterByMilestones,
} from '../../redux/ducks/utils/filterCards'
import IssueList from '../issue-list'
import Issue from '../issue'
import GithubFlavoredMarkdown from '../gfm'
import AppNav from '../app/nav'

const KanbanColumn = ({
  milestone,
  cards,
  primaryRepoName,
  filters,
  settings,
}) => {
  const issueComponents = cards.map(card => (
    <Issue
      key={card.key()}
      settings={settings}
      filters={filters}
      primaryRepoName={primaryRepoName}
      card={card}
    />
  ))

  let heading
  if (milestone) {
    heading = (
      <Link
        className="milestone-title"
        to={this.props.filters.toggleMilestoneTitle(milestone.title).url()}
      >
        <GithubFlavoredMarkdown inline disableLinks text={milestone.title} />
      </Link>
    )
  } else {
    heading = 'No Milestone'
  }

  return (
    <div className="kanban-board-column">
      <IssueList title={heading} milestone={milestone}>
        {issueComponents}
      </IssueList>
    </div>
  )
}

class ByMilestoneView extends React.Component {
  componentWillMount() {
    const { repoInfos, dispatch } = this.props
    // pull out the primaryRepoName
    const [{ repoOwner, repoName }] = repoInfos
    dispatch(fetchIssues(repoInfos))
    dispatch(fetchMilestones(repoOwner, repoName))
  }

  render() {
    const {
      milestones,
      cards,
      repoInfos,
      settings,
      filters,
      filter,
      params,
    } = this.props

    // Get the primary repo
    const [primaryRepo] = repoInfos

    let allMilestones = milestones

    if (!settings.hideUncategorized) {
      allMilestones = [null].concat(allMilestones)
    }

    const isFilteringByColumn = filter.milestoneTitles.length

    const cardsToView = filterCards(cards, settings, filter)

    const kanbanColumns = allMilestones.map(milestone => {
      // if we are filtering and it's not the right column
      if (
        isFilteringByColumn &&
        (!milestone || filter.milestoneTitles.every(c => c !== milestone.title))
      ) {
        return null
      }

      const columnCards = filterByMilestones(cardsToView, [
        milestone ? milestone.title : milestone,
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
          settings={settings}
          filters={filters}
          key={milestone ? milestone.title : 'uncategorized'}
          milestone={milestone}
          cards={columnCards}
          primaryRepoName={primaryRepo.repoName}
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
    filter: state.filter,
    filters: new selectors.FilterBuilder(state.filter, repoInfos),
    settings: state.settings,
    cards: state.issues.cards,
    milestones: state.issues.milestones,
  }
})(ByMilestoneView)

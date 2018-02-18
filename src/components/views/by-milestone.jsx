import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import { MilestoneIcon } from 'react-octicons'

import { selectors } from '../../redux/ducks/filter'
import { fetchMilestones, fetchIssues } from '../../redux/ducks/issue'
import IssueList from '../issue-list'
import Issue from '../issue'
import GithubFlavoredMarkdown from '../gfm'

class KanbanColumn extends React.Component {
  render() {
    const { milestone, cards, primaryRepoName, filters } = this.props

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

    let heading
    if (milestone) {
      heading = (
        <Link
          className="milestone-title"
          to={this.props.filters.toggleMilestoneTitle(milestone.title).url()}
        >
          <MilestoneIcon />
          <GithubFlavoredMarkdown
            inline
            disableLinks={true}
            text={milestone.title}
          />
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
    const { milestones, cards, repoInfos, settings, filters } = this.props

    // Get the primary repo
    const [primaryRepo] = repoInfos

    const uncategorizedCards = cards.filter(card => {
      return !card.issue.milestone
    })

    const uncategorizedColumn = (
      <KanbanColumn
        settings={settings}
        filters={filters}
        cards={uncategorizedCards}
        primaryRepoName={primaryRepo.repoName}
      />
    )

    const kanbanColumns = milestones.reduce((prev, milestone) => {
      if (
        filters.state.milestoneTitles.length &&
        filters.state.milestoneTitles.indexOf(milestone.title) === -1
      ) {
        return prev
      }

      // If we are filtering by a kanban column then only show that column
      // Otherwise show all columns
      const columnCards = cards.filter(card => {
        return (
          card.issue.milestone && card.issue.milestone.title === milestone.title
        )
      })

      /*HACK: Column should handle milestones */
      prev.push(
        <KanbanColumn
          settings={settings}
          filters={this.props.filters}
          key={milestone.title}
          milestone={milestone}
          cards={columnCards}
          primaryRepoName={primaryRepo.repoName}
        />
      )
      return prev
    }, [])

    return (
      <div className="kanban-board">
        {!settings.isHideUncategorized && uncategorizedColumn}
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
  }
})(ByMilestoneView)

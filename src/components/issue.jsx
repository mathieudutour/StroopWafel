import React from 'react'
import * as BS from 'react-bootstrap'
import { connect } from 'react-redux'
import { DragSource } from 'react-dnd'
import classnames from 'classnames'
import { Link } from 'react-router'
import {
  CalendarIcon,
  ChecklistIcon,
  CommentIcon,
  AlertIcon,
} from 'react-octicons'

import { tryToMoveIssue } from '../redux/ducks/issue'
import { PULL_REQUEST_ISSUE_RELATION } from '../gfm-dom'
import { KANBAN_LABEL } from '../helpers'

import GithubFlavoredMarkdown from './gfm'
import Time, { Timer } from './time'
import LabelBadge from './label-badge'
import IssueOrPullRequestBlurb from './issue-blurb'

const ItemTypes = {
  CARD: 'card',
}

const issueSource = {
  beginDrag(props) {
    // Return the data describing the dragged item
    return props
  },

  endDrag(props, monitor) {
    if (!monitor.didDrop()) {
      return
    }

    // When dropped on a compatible target, do something
    const { card, oldUser } = monitor.getItem()
    const dropResult = monitor.getDropResult()

    if (dropResult.label || dropResult.label === null) {
      props.dispatch(tryToMoveIssue({ card, label: dropResult.label }))
    } else if (dropResult.milestone || dropResult.milestone === null) {
      props.dispatch(
        tryToMoveIssue({
          card,
          milestone: dropResult.milestone,
        })
      )
    } else if (dropResult.user || dropResult.user === null) {
      props.dispatch(
        tryToMoveIssue({
          card,
          user: dropResult.user,
          oldUser,
        })
      )
    } else {
      throw new Error(
        'BUG: Only know how to move to a kanban label or a milestone or an assignee'
      )
    }
  },
}

function collect(_connect, monitor) {
  return {
    // Call this function inside render()
    // to let React DnD handle the drag events:
    connectDragSource: _connect.dragSource(),
    // You can ask the monitor about the current drag state:
    isDragging: monitor.isDragging(),
  }
}

const IssueSimple = ({ card, filters, isDragging }) => {
  const { issue, repoOwner, repoName } = card

  const issueDueAt = card.getDueAt()

  // PR updatedAt is updated when commits are pushed
  const updatedAt = card.getUpdatedAt()

  const user = issue.assignee
  let assignedAvatar
  if (user) {
    assignedAvatar = (
      <Link
        to={filters.toggleUsername(user.login).url()}
        className="avatar-filter"
      >
        <img
          alt={user.login}
          key="avatar"
          className="avatar-image"
          title={`Click to filter on ${user.login}`}
          src={user.avatarUrl}
        />
      </Link>
    )
  }

  // stop highlighting after 5s
  const isUpdated = Date.now() - Date.parse(updatedAt) < 5 * 1000

  let dueAt
  if (issueDueAt) {
    const dueAtClasses = {
      'issue-due-at': true,
      'is-overdue': issueDueAt < Date.now(),
      'is-near':
        issueDueAt > Date.now() &&
        issueDueAt - Date.now() < 7 * 24 * 60 * 60 * 1000, // set it to be 1 week
    }
    dueAt = (
      <span className={classnames(dueAtClasses)}>
        <CalendarIcon />
        {' due '}
        <Time dateTime={issueDueAt} />
      </span>
    )
  } else {
    // Click to add due date
  }

  const classes = {
    issue: true,
    'is-simple-list': true,
    'is-dragging': isDragging,
    'is-updated': isUpdated,
    'is-pull-request': card.isPullRequest(),
    'is-merged': card.isPullRequestMerged(),
    'is-merge-conflict': card.isPullRequest() && card.hasMergeConflict(),
    'is-pull-request-to-different-branch':
      card.isPullRequest() && !card.isPullRequestToDefaultBranch(),
  }
  return (
    <BS.ListGroupItem
      data-status-state={
        card.isPullRequest() ? card.getPullRequestStatus() : null
      }
      className={classnames(classes)}
      data-state={issue.state}
    >
      {assignedAvatar}
      <a className="issue-title" target="_blank" href={issue.htmlUrl}>
        <GithubFlavoredMarkdown
          className="-issue-title-text"
          inline
          repoOwner={repoOwner}
          repoName={repoName}
          text={issue.title}
        />
      </a>
      {dueAt}
      <a className="issue-number" target="_blank" href={issue.htmlUrl}>
        #{issue.number}
      </a>
    </BS.ListGroupItem>
  )
}

const CardDetailsModal = ({ card, ...rest }) => {
  const { issue, repoOwner, repoName } = card
  return (
    <BS.Modal className="-add-filter-modal" {...rest}>
      <BS.Modal.Header closeButton>
        <BS.Modal.Title>
          <a href={issue.htmlUrl}>
            <span>#{issue.number} </span>
            {issue.title}
          </a>
        </BS.Modal.Title>
      </BS.Modal.Header>
      <BS.Modal.Body>
        <GithubFlavoredMarkdown
          repoOwner={repoOwner}
          repoName={repoName}
          text={issue.body}
        />
      </BS.Modal.Body>
    </BS.Modal>
  )
}

class IssueCard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      showDetails: false,
    }
  }

  showDetails = e => {
    let { target } = e
    while (target) {
      if (
        target.attributes &&
        target.attributes.role &&
        target.attributes.role.textContent === 'dialog'
      ) {
        // if we click on the modal, bail out
        return
      }
      if (target.nodeName === 'A') {
        // if we click on a link, bail out
        return
      }
      // otherwise climb up the tree
      target = target.parentNode
    }
    this.setState({
      showDetails: true,
    })
  }

  hideDetails = () => {
    this.setState({
      showDetails: false,
    })
  }

  render() {
    const { card, primaryRepoName, filters } = this.props
    const { issue, repoOwner, repoName } = card

    const { taskFinishedCount, taskTotalCount } = card.getTaskCounts()

    // Defined by the collector
    const { isDragging } = this.props

    // PR updatedAt is updated when commits are pushed
    const updatedAt = card.getUpdatedAt()

    const commentsCount = card.getCommentCount()

    const assignedAvatars = (
      issue.assignees || (issue.assignee ? [issue.assignee] : [])
    ).map(user => {
      const link = filters.toggleUsername(user.login).url()
      return (
        <Link key={link} to={link} className="pull-right">
          <img
            alt={user.login}
            className="avatar-image"
            title={`Click to filter on ${user.login}`}
            src={user.avatarUrl}
          />
        </Link>
      )
    })

    const nonKanbanLabels = (issue.labels || []).filter(
      label => !KANBAN_LABEL.test(label.name)
    )
    const labels = nonKanbanLabels.map(label => {
      const tooltip = (
        <BS.Tooltip id={`tooltip-${card.key()}-${label.name}`}>
          {label.name}. Click to filter
        </BS.Tooltip>
      )
      return (
        <BS.OverlayTrigger
          key={label.name}
          placement="top"
          delayShow={1000}
          overlay={tooltip}
        >
          <LabelBadge isFilterLink label={label} filters={filters} />
        </BS.OverlayTrigger>
      )
    })
    let taskCounts = null
    if (taskTotalCount) {
      const taskCountsClasses = {
        'task-list-overview': true,
        'is-done': taskFinishedCount === taskTotalCount,
      }
      taskCounts = (
        <span className={classnames(taskCountsClasses)}>
          <ChecklistIcon />
          {`${taskFinishedCount}/${taskTotalCount}`}
        </span>
      )
    }
    const shouldShowMilestone =
      // issue.milestone && getFilters().getState().milestoneTitles.length !== 1
      // Make this always show the milestone since they can be excluded so
      // checking if there is only 1 item in the array is not enough
      issue.milestone
    let milestone = null
    if (shouldShowMilestone) {
      const openCount = issue.milestone.openIssues
      const closedCount = issue.milestone.closedIssues
      const totalCount = openCount + closedCount
      const milestonePopover = (
        <BS.Popover
          id={`popover-${card.key()}-milestone`}
          className="milestone-details"
          title="Milestone Details"
        >
          <h4>
            <GithubFlavoredMarkdown
              inline
              disableLinks
              repoOwner={repoOwner}
              repoName={repoName}
              text={issue.milestone.title}
            />
          </h4>
          <BS.ProgressBar
            bsStyle="success"
            now={closedCount}
            max={totalCount}
          />
          <p>
            {openCount} Open / {closedCount} Closed
          </p>
          <GithubFlavoredMarkdown
            disableLinks
            repoOwner={repoOwner}
            repoName={repoName}
            text={issue.milestone.description}
          />
        </BS.Popover>
      )
      milestone = (
        <span className="issue-milestone badge is-light">
          <BS.OverlayTrigger
            rootClose
            trigger={['hover', 'focus']}
            placement="bottom"
            overlay={milestonePopover}
          >
            <Link
              className="milestone-title"
              to={filters.toggleMilestoneTitle(issue.milestone.title).url()}
            >
              <GithubFlavoredMarkdown
                inline
                disableLinks
                repoOwner={repoOwner}
                repoName={repoName}
                text={issue.milestone.title}
              />
            </Link>
          </BS.OverlayTrigger>
        </span>
      )
    }

    const relatedCards = (card.getRelated() || []).map(
      ({ vertex: issueCard, edgeValue }) => {
        const context = issueCard.isPullRequest()
          ? PULL_REQUEST_ISSUE_RELATION[edgeValue]
          : edgeValue
        return (
          <div key={issueCard.key()} className="related-issue">
            <IssueOrPullRequestBlurb
              card={issueCard}
              primaryRepoName={card.repoName}
              primaryRepoOwner={card.repoOwner}
              context={context}
            />
          </div>
        )
      }
    )

    let comments
    if (commentsCount) {
      comments = (
        <span className="comments-count" title="Comments">
          <CommentIcon />{' '}
          <span className="comments-count-number">{commentsCount}</span>
        </span>
      )
    }

    // stop highlighting after 5s
    const isUpdated = Date.now() - Date.parse(updatedAt) < 5 * 1000
    const classes = {
      issue: true,
      'is-dragging': isDragging,
      'is-updated': isUpdated,
      'is-pull-request': card.isPullRequest(),
      'is-merged': card.isPullRequestMerged(),
      'is-pull-request-to-different-branch':
        card.isPullRequest() && !card.isPullRequestToDefaultBranch(),
    }

    let mergeConflictBlurb
    if (card.isPullRequest() && card.hasMergeConflict()) {
      mergeConflictBlurb = (
        <AlertIcon
          key="merge-conflict"
          className="pull-right merge-conflict-warning"
          title="This has a Merge Conflict"
        />
      )
    }

    let statusBlurb
    if (card.isPullRequest()) {
      const status = card.getPullRequestStatus()
      let statusText
      // pending, success, error, or failure
      switch (status.state) {
        case 'success':
          statusText = 'Your tests passed!'
          break
        case 'pending':
          statusText = 'Your tests are running...'
          break
        case 'error':
        case 'failure':
          statusText = 'Your tests failed!'
          break
        default:
      }
      if (statusText) {
        const statusClasses = {
          'issue-status': true,
          'is-merge-conflict': card.hasMergeConflict(),
        }
        statusBlurb = (
          <BS.OverlayTrigger
            rootClose
            trigger={['hover', 'focus']}
            placement="bottom"
            overlay={
              <BS.Tooltip id={`tooltip-${card.key()}-status`}>
                {status.description || statusText}
              </BS.Tooltip>
            }
          >
            <div
              className={classnames(statusClasses)}
              data-status-state={status.state}
            />
          </BS.OverlayTrigger>
        )
      }
    }

    let dueAt
    const issueDueAt = card.getDueAt()
    if (issueDueAt) {
      const dueAtClasses = {
        'issue-due-at': true,
        'is-overdue': issueDueAt < Date.now(),
        'is-near':
          issueDueAt > Date.now() &&
          issueDueAt - Date.now() < 7 * 24 * 60 * 60 * 1000, // set it to be 1 week
      }
      dueAt = (
        <span className={classnames(dueAtClasses)}>
          <CalendarIcon />
          {' due '}
          <Time dateTime={issueDueAt} />
        </span>
      )
    } else {
      // Click to add due date
    }

    const header = [
      <IssueOrPullRequestBlurb
        key="issue-blurb"
        card={card}
        primaryRepoName={primaryRepoName}
        primaryRepoOwner={repoOwner}
      />,
    ]
      .concat(assignedAvatars)
      .concat([mergeConflictBlurb])

    let featuredImage
    if (card.getFeaturedImageSrc()) {
      featuredImage = (
        <img
          className="featured-image"
          alt="Featured"
          src={card.getFeaturedImageSrc()}
        />
      )
    }

    return (
      <BS.Panel className="issue-card" onClick={this.showDetails}>
        <BS.Panel.Body
          data-status-state={
            card.isPullRequest() ? card.getPullRequestStatus().state : null
          }
          className={classnames(classes)}
          data-state={issue.state}
        >
          <div className="card-meta">{header}</div>
          <span className="issue-title">
            <GithubFlavoredMarkdown
              inline
              repoOwner={repoOwner}
              repoName={repoName}
              text={issue.title}
            />
          </span>
          {featuredImage}

          <div className="issue-footer">
            {milestone}
            {labels}
            <span className="issue-meta">
              {taskCounts}
              {dueAt}
              <span className="issue-time-and-user">{comments}</span>
            </span>
            <BS.Clearfix />
          </div>
          {statusBlurb}
        </BS.Panel.Body>
        {relatedCards.length > 0 && (
          <BS.Panel.Footer className="related-issues">
            {relatedCards}
          </BS.Panel.Footer>
        )}
        <CardDetailsModal
          show={this.state.showDetails}
          onHide={this.hideDetails}
          card={card}
        />
      </BS.Panel>
    )
  }
}

// `GET .../issues` returns an object with `labels` and
// `GET .../pulls` returns an object with `mergeable` so for Pull Requests
// we have to have both to fully render an Issue.
class Issue extends React.Component {
  componentWillMount() {
    const { card, settings } = this.props
    if (
      !card.isLoaded({
        shouldShowPullRequestData: settings.showPullRequestData,
      })
    ) {
      card
        .load(window.githubClient, {
          shouldShowPullRequestData: settings.showPullRequestData,
        })
        .then(() => {
          this.forceUpdate()
        })
    }
    Timer.onTick(this.pollPullRequestStatus)
  }

  componentWillUnmount() {
    Timer.offTick(this.pollPullRequestStatus)
  }

  pollPullRequestStatus = () => {
    const { card, settings } = this.props
    if (card.isPullRequest()) {
      card
        .fetchPRStatus(window.githubClient, {
          shouldShowPullRequestData: settings.showPullRequestData,
        })
        .then(shouldUpdate => {
          if (shouldUpdate) this.forceUpdate()
        })
    }
  }

  render() {
    const {
      card,
      primaryRepoName,
      settings,
      filters,
      isDragging,
      connectDragSource,
    } = this.props
    const { issue } = card
    let node
    if (!issue) {
      return <span>Maybe moving Issue...</span>
    } else if (settings.showSimpleList) {
      node = (
        <IssueSimple card={card} isDragging={isDragging} filters={filters} />
      )
    } else {
      node = (
        <IssueCard
          card={card}
          primaryRepoName={primaryRepoName}
          isDragging={isDragging}
          filters={filters}
        />
      )
    }
    return connectDragSource(<div className="-drag-source">{node}</div>)
  }
}

// Export the wrapped version
export default connect()(
  DragSource(ItemTypes.CARD, issueSource, collect)(Issue)
)

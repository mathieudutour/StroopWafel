import _ from 'underscore'
import React from 'react'
import { connect } from 'react-redux'
import * as BS from 'react-bootstrap'

import { moveIssues, cancelMovingIssue } from '../redux/ducks/issue'
import { getCardColumn } from '../helpers'
import IssueOrPullRequestBlurb from './issue-blurb'
import LabelBadge from './label-badge'

class MoveModal extends React.Component {
  state = {
    unCheckedCards: {},
  }

  componentWillReceiveProps(nextProps) {
    // If this card has related cards then show the modal.
    // Otherwise, just perform the move
    if (
      nextProps.movingIssue &&
      nextProps.movingIssue.card.getRelated().length === 0
    ) {
      if (nextProps.movingIssue.label || nextProps.movingIssue.milestone) {
        this.moveIssue(nextProps)
      }
    } else if (this.props.movingIssue && !nextProps.movingIssue) {
      this.setState({ unCheckedCards: {} })
    }
  }

  onToggleCheckbox = card => {
    return () => {
      const { unCheckedCards } = this.state
      const copy = { ...unCheckedCards }
      const key = card.key()
      if (!copy[key]) {
        copy[key] = card
      } else {
        delete copy[key]
      }
      this.setState({ unCheckedCards: copy })
    }
  }

  moveIssue = props => {
    const { card, label, milestone } = props.movingIssue
    const { unCheckedCards } = this.state
    const allOtherCards = (card.getRelated() || []).map(({ vertex }) => vertex)
    const otherCardsToMove = _.difference(
      allOtherCards,
      Object.keys(unCheckedCards).map(k => unCheckedCards[k])
    )

    props.dispatch(
      moveIssues(otherCardsToMove.concat(card), { label, milestone })
    )
  }

  render() {
    const { container, movingIssue, filters } = this.props
    const { unCheckedCards } = this.state
    const close = () => this.props.dispatch(cancelMovingIssue())

    if (movingIssue) {
      const related = movingIssue.card.getRelated()

      let anonymousComment = null
      const isAnonymous = !this.props.user
      if (isAnonymous) {
        anonymousComment = 'Sign In to move items '
      }

      let body
      if (related.length) {
        const makeRelated = ({ vertex }) => {
          const relatedColumn = getCardColumn(vertex)
          let relatedLabel = null
          if (relatedColumn.name !== getCardColumn(movingIssue.card).name) {
            relatedLabel = (
              <LabelBadge label={relatedColumn} filters={filters} />
            )
          }
          const checkLabel = (
            <span>
              <IssueOrPullRequestBlurb
                card={vertex}
                primaryRepoName={movingIssue.card.repoName}
                primaryRepoOwner={movingIssue.card.repoOwner}
              />
              <span className="issue-title">
                {' '}
                {vertex.issue.title}
                {relatedLabel}
              </span>
            </span>
          )
          return (
            <li className="related-issue" key={vertex.number}>
              <BS.Checkbox
                className="select-related-issue"
                onChange={this.onToggleCheckbox(vertex)}
                checked={!unCheckedCards[vertex.key()]}
              >
                {checkLabel}
              </BS.Checkbox>
            </li>
          )
        }

        const relatedIssues = related.map(makeRelated)

        body = (
          <BS.Modal.Body>
            Select the related items to move as well:
            <ul className="related-issues">{relatedIssues}</ul>
          </BS.Modal.Body>
        )
      } else {
        // Only the issue. Nothing related
        body = null
      }

      let title
      if (movingIssue.card.issue.pullRequest) {
        title = 'Move Pull Request'
      } else {
        title = 'Move Issue'
      }

      let dest
      if (movingIssue.label) {
        dest = <LabelBadge label={movingIssue.label} />
      } else if (movingIssue.milestone) {
        dest = movingIssue.milestone.title
      } else {
        throw new Error('BUG: only know how to move to a label or milestone')
      }

      return (
        <BS.Modal
          className="move-issue"
          show={!!movingIssue}
          container={container}
          onHide={close}
        >
          <BS.Modal.Header closeButton>
            <BS.Modal.Title>
              {title} to {dest}
            </BS.Modal.Title>
          </BS.Modal.Header>
          {body}
          <BS.Modal.Footer>
            {anonymousComment}
            <BS.Button
              bsStyle="primary"
              onClick={() => this.moveIssue(this.props)}
            >
              Move
            </BS.Button>
            <BS.Button onClick={close}>Cancel</BS.Button>
          </BS.Modal.Footer>
        </BS.Modal>
      )
    } else {
      return null
    }
  }
}

export default connect(state => {
  return {
    user: state.user.info,
    movingIssue: state.issues.movingIssue,
  }
})(MoveModal)

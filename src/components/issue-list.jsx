import React from 'react'
import { DropTarget } from 'react-dnd'
import * as BS from 'react-bootstrap'

const MIN_CHILDREN_TO_SHOW = 10

const ItemTypes = {
  CARD: 'card',
}

const cardListTarget = {
  drop: function(props) {
    // TODO: Do something simpler than just props
    return props
  },
}

function collect(_connect, monitor) {
  return {
    connectDropTarget: _connect.dropTarget(),
    isOver: monitor.isOver(),
  }
}

class IssueList extends React.Component {
  state = { morePressedCount: 0, showCSVModal: false }

  showAllIssues = () => {
    this.setState({ showAllIssues: true })
  }

  onClickMore = () => {
    this.setState({ morePressedCount: this.state.morePressedCount + 1 })
  }

  toggleCSVModal = () => {
    const { showCSVModal } = this.state
    this.setState({ showCSVModal: !showCSVModal })
  }

  render() {
    const { title, children, connectDropTarget, isOver } = this.props
    const { showAllIssues, morePressedCount } = this.state
    const multiple = 25 // Add 25 results at a time

    let className = 'column-title'

    const header = (
      <h2 className={className}>
        {title} {children.length}
      </h2>
    )

    const classes = {
      'issue-list': true,
      'is-over': isOver,
    }

    let partialChildren
    let moreButton
    if (
      !showAllIssues &&
      MIN_CHILDREN_TO_SHOW + (1 + morePressedCount) * multiple < children.length
    ) {
      partialChildren = children.slice(
        0,
        MIN_CHILDREN_TO_SHOW + morePressedCount * multiple
      )
      moreButton = (
        <BS.Button onClick={this.onClickMore} className="list-group-item">
          {children.length - (morePressedCount + 1) * multiple} more...
        </BS.Button>
      )
    } else {
      partialChildren = children
    }

    return connectDropTarget(
      <div className="-drop-target">
        <BS.Panel className={classes}>
          <BS.Panel.Heading>{header}</BS.Panel.Heading>
          <BS.ListGroup fill>
            <BS.ListGroupItem
              key="dnd-placeholder"
              className="dnd-placeholder"
            />
            {partialChildren}
            {moreButton}
          </BS.ListGroup>
        </BS.Panel>
      </div>
    )
  }
}

// Export the wrapped version
export default DropTarget(ItemTypes.CARD, cardListTarget, collect)(IssueList)

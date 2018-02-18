import * as BS from 'react-bootstrap'
import PropTypes from 'prop-types'
import React from 'react'

import { Link } from 'react-router'

import { KANBAN_LABEL, isLight } from '../helpers'

class LabelBadge extends React.Component {
  static propTypes = {
    label: PropTypes.object.isRequired,
    className: PropTypes.string,
    extra: PropTypes.string,
  }

  render() {
    const { label, isFilterLink, onClick, filters } = this.props
    let { className, extra } = this.props

    let name

    className = className || ''
    className += ' badge'

    if (KANBAN_LABEL.test(label.name)) {
      name = label.name.replace(/^\d+ - /, ' ')
    } else {
      name = label.name
    }
    if (label.color && isLight(label.color)) {
      className += ' ' + 'is-light'
    }
    if (extra) {
      extra = ` (${extra})`
    }

    if (isFilterLink) {
      return (
        <Link
          to={filters.toggleLabel(label.name).url()}
          key={name}
          onClick={onClick}
          className={className}
          style={{ backgroundColor: '#' + label.color }}
        >
          {name}
          {extra}
        </Link>
      )
    } else {
      return (
        <BS.Badge
          key={name}
          {...this.props}
          className={className}
          onClick={onClick}
          style={{ backgroundColor: '#' + label.color }}
        >
          {name}
          {extra}
        </BS.Badge>
      )
    }
  }
}

export default LabelBadge

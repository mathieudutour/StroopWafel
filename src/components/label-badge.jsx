import * as BS from 'react-bootstrap'
import PropTypes from 'prop-types'
import React from 'react'

import { Link } from 'react-router'

import { KANBAN_LABEL, isLight } from '../helpers'

const LabelBadge = ({
  label,
  isFilterLink,
  onClick,
  filters,
  className = '',
  extra,
}) => {
  let name = { label }

  if (KANBAN_LABEL.test(label.name)) {
    name = label.name.replace(/^\d+ - /, ' ')
  }

  let _className = `${className} badge`

  if (label.color && isLight(label.color)) {
    _className += ' is-light'
  }

  let _extra

  if (extra) {
    _extra = ` (${extra})`
  }

  if (isFilterLink) {
    return (
      <Link
        to={filters.toggleLabel(label.name).url()}
        key={name}
        onClick={onClick}
        className={_className}
        style={{ backgroundColor: `#${label.color}` }}
      >
        {name}
        {_extra}
      </Link>
    )
  }
  return (
    <BS.Badge
      key={name}
      {...this.props}
      className={_className}
      onClick={onClick}
      style={{ backgroundColor: `#${label.color}` }}
    >
      {name}
      {_extra}
    </BS.Badge>
  )
}

LabelBadge.propTypes = {
  label: PropTypes.object.isRequired,
  className: PropTypes.string,
  extra: PropTypes.string,
}

export default LabelBadge

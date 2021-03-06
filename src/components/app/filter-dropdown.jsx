import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import * as BS from 'react-bootstrap'
import classnames from 'classnames'
import { XIcon, SettingsIcon, CheckIcon, MilestoneIcon } from 'react-octicons'
import SavedFiltersButton from './saved-filters'
import Time from '../time'

import { UNCATEGORIZED_NAME, KANBAN_LABEL } from '../../helpers'

import GithubFlavoredMarkdown from '../gfm'

function sortByText(a, b) {
  return a.text > b.test ? 1 : -1
}

class FilterCategory extends React.Component {
  state = { filterStr: null }

  onFilterInputChange = e => {
    this.setState({ filterStr: e.currentTarget.value })
  }

  filterItems = () => {
    const { items } = this.props
    const { filterStr } = this.state
    return items.filter(({ text }) => {
      if (filterStr) {
        // ignore case when filtering
        return text.toLowerCase().indexOf(filterStr.toLowerCase()) >= 0
      }
      return true
    })
  }

  renderItem = item => {
    const { isSelected, isExcluded, text, iconNode } = item
    const { toggleHref, excludeHref } = item

    let checkmark
    if (isSelected) {
      checkmark = <CheckIcon className="item-checkmark" />
    }
    let iconLink
    if (iconNode) {
      iconLink = <Link to={toggleHref}>{iconNode}</Link>
    }
    let excludeLink
    if (excludeHref) {
      excludeLink = (
        <Link
          to={excludeHref}
          className="item-toggle-exclude"
          title="Exclude this from the board"
        >
          <XIcon />
        </Link>
      )
    }
    return (
      <BS.ListGroupItem
        key={text}
        className={classnames({
          'is-selected': isSelected,
          'is-excluded': isExcluded,
        })}
      >
        {checkmark}
        {iconLink}
        <Link to={toggleHref} className="item-text">
          <GithubFlavoredMarkdown disableLinks inline text={text} />
        </Link>
        {excludeLink}
      </BS.ListGroupItem>
    )
  }

  render() {
    const { noSearch, name } = this.props
    const items = this.filterItems()

    let searchInput
    if (!noSearch) {
      searchInput = (
        <BS.FormControl
          type="text"
          placeholder={`Search for ${name}...`}
          onChange={this.onFilterInputChange}
        />
      )
    }
    return (
      <form>
        {searchInput}
        <BS.ListGroup>{items.map(this.renderItem)}</BS.ListGroup>
      </form>
    )
  }
}

class FilterDropdown extends React.Component {
  state = {
    open: false,
  }

  onToggle = (open, event) => {
    if (open || !event.isDefaultPrevented) {
      this.setState({
        open,
      })
    }
  }

  onSelect = (eventKey, event) => event.preventDefault()
  /* eslint-disable no-param-reassign */
  renderLabels = items => {
    const { filters } = this.props
    const state = filters.getState()
    items = items.map(({ name, color }) => {
      const isSelected = state.labels.indexOf(name) >= 0
      const isExcluded = state.labels.indexOf(`-${name}`) >= 0
      const iconNode = (
        <span
          className="item-icon tag-name-color"
          style={{ backgroundColor: `#${color}` }}
        />
      )
      let toggleHref
      let excludeHref
      if (isExcluded) {
        toggleHref = filters
          .toggleLabel(`-${name}`)
          .toggleLabel(name)
          .url()
        excludeHref = filters.toggleLabel(`-${name}`).url()
      } else if (isSelected) {
        toggleHref = filters.toggleLabel(name).url()
        excludeHref = filters
          .toggleLabel(name)
          .toggleLabel(`-${name}`)
          .url()
      } else {
        toggleHref = filters.toggleLabel(name).url()
        excludeHref = filters.toggleLabel(`-${name}`).url()
      }
      return {
        text: name,
        isSelected,
        isExcluded,
        iconNode,
        toggleHref,
        excludeHref,
      }
    })

    // Remove the columns from the set of labels
    items = items
      .filter(({ text }) => !KANBAN_LABEL.test(text))
      .sort(sortByText)

    return <FilterCategory items={items} name="labels" />
  }

  renderColumnNames = items => {
    const { filters } = this.props
    const state = filters.getState()

    // Add the "UNCATEGORIZED_NAME" label into the mix
    items = items.concat({ name: UNCATEGORIZED_NAME })

    items = items.map(({ name, color }) => {
      const isSelected = (state.columnLabels || []).indexOf(name) >= 0
      const isExcluded = (state.columnLabels || []).indexOf(`-${name}`) >= 0
      const iconNode = (
        <i
          className="item-icon column-name-color"
          style={{ backgroundColor: `#${color}` }}
        />
      )
      let toggleHref
      let excludeHref
      if (isExcluded) {
        toggleHref = filters
          .toggleColumnLabel(`-${name}`)
          .toggleColumnLabel(name)
          .url()
        excludeHref = filters.toggleColumnLabel(`-${name}`).url()
      } else if (isSelected) {
        toggleHref = filters.toggleColumnLabel(name).url()
        excludeHref = filters
          .toggleColumnLabel(name)
          .toggleColumnLabel(`-${name}`)
          .url()
      } else {
        toggleHref = filters.toggleColumnLabel(name).url()
        excludeHref = filters.toggleColumnLabel(`-${name}`).url()
      }
      return {
        text: name,
        isSelected,
        isExcluded,
        iconNode,
        toggleHref,
        excludeHref,
      }
    })

    // Remove the non-columns
    items = items
      .filter(({ text }) => KANBAN_LABEL.test(text))
      // sort **BEFORE** stripping off the column index
      .sort(sortByText)
      .map(
        ({
          text,
          isSelected,
          isExcluded,
          iconNode,
          toggleHref,
          excludeHref,
        }) => {
          text = text.replace(KANBAN_LABEL, '')
          return {
            text,
            isSelected,
            isExcluded,
            iconNode,
            toggleHref,
            excludeHref,
          }
        }
      )

    return <FilterCategory items={items} name="columns" />
  }

  // copy/pasta from renderLabels
  renderMilestones = items => {
    const { filters } = this.props
    const state = filters.getState()
    items = items.map(({ title }) => {
      const isSelected = state.milestoneTitles.indexOf(title) >= 0
      const isExcluded = state.milestoneTitles.indexOf(`-${title}`) >= 0
      // const iconNode = (
      //   <MilestoneIcon/>
      // );
      let toggleHref
      let excludeHref
      if (isExcluded) {
        toggleHref = filters
          .toggleMilestoneTitle(`-${title}`)
          .toggleMilestoneTitle(title)
          .url()
        excludeHref = filters.toggleMilestoneTitle(`-${title}`).url()
      } else if (isSelected) {
        toggleHref = filters.toggleMilestoneTitle(title).url()
        excludeHref = filters
          .toggleMilestoneTitle(title)
          .toggleMilestoneTitle(`-${title}`)
          .url()
      } else {
        toggleHref = filters.toggleMilestoneTitle(title).url()
        excludeHref = filters.toggleMilestoneTitle(`-${title}`).url()
      }
      return {
        text: title,
        isSelected,
        isExcluded,
        toggleHref,
        excludeHref,
      }
    })

    items = items.sort(sortByText)

    return <FilterCategory items={items} name="milestones" />
  }

  /* eslint-enable */

  renderStates = () => {
    const { filters } = this.props
    const { states } = filters.getState()

    const items = [
      { text: 'Opened', value: 'open' },
      { text: 'Closed', value: 'close' },
    ].map(state => ({
      text: state.text,
      isSelected: states.indexOf(state.value) >= 0,
      toggleHref: filters.toggleState(state.value).url(),
    }))

    return <FilterCategory noSearch items={items} name="states" />
  }

  renderTypes = () => {
    const { filters } = this.props
    const { types } = filters.getState()

    const items = [
      { text: 'Issue', value: 'issue' },
      { text: 'Pull Request', value: 'pull-request' },
    ].map(type => ({
      text: type.text,
      isSelected: types.indexOf(type.value) >= 0,
      toggleHref: filters.toggleType(type.value).url(),
    }))

    return <FilterCategory noSearch items={items} name="types" />
  }

  render() {
    const { milestones, labels } = this.props

    const renderMilestone = milestone => {
      let dueDate
      if (milestone.dueOn) {
        dueDate = (
          <span key="due-at" className="due-at">
            {' due '}
            <Time dateTime={new Date(milestone.dueOn)} />
          </span>
        )
      }
      return [
        <MilestoneIcon key="icon" className="milestone-icon" />,
        <span key="milestone-title" className="milestone-title">
          <GithubFlavoredMarkdown inline disableLinks text={milestone.title} />
        </span>,
        dueDate,
      ]
    }

    const panel = (
      <BS.PanelGroup accordion id="filters-accordeon" defaultActiveKey={-1}>
        <BS.Panel className="filter-category" eventKey={1}>
          <BS.Panel.Heading>
            <BS.Panel.Title toggle>Labels</BS.Panel.Title>
          </BS.Panel.Heading>
          <BS.Panel.Body collapsible>{this.renderLabels(labels)}</BS.Panel.Body>
        </BS.Panel>
        <BS.Panel className="filter-category" eventKey={2}>
          <BS.Panel.Heading>
            <BS.Panel.Title toggle>Milestones</BS.Panel.Title>
          </BS.Panel.Heading>
          <BS.Panel.Body collapsible>
            {this.renderMilestones(milestones)}
          </BS.Panel.Body>
        </BS.Panel>
        <BS.Panel className="filter-category" eventKey={3}>
          <BS.Panel.Heading>
            <BS.Panel.Title toggle>Columns</BS.Panel.Title>
          </BS.Panel.Heading>
          <BS.Panel.Body collapsible>
            {this.renderColumnNames(labels)}
          </BS.Panel.Body>
        </BS.Panel>
        <BS.Panel className="filter-category" eventKey={4}>
          <BS.Panel.Heading>
            <BS.Panel.Title toggle>States</BS.Panel.Title>
          </BS.Panel.Heading>
          <BS.Panel.Body collapsible>{this.renderStates()}</BS.Panel.Body>
        </BS.Panel>
        <BS.Panel className="filter-category" eventKey={5}>
          <BS.Panel.Heading>
            <BS.Panel.Title toggle>Types</BS.Panel.Title>
          </BS.Panel.Heading>
          <BS.Panel.Body collapsible>{this.renderTypes()}</BS.Panel.Body>
        </BS.Panel>
      </BS.PanelGroup>
    )

    const { milestoneTitles } = this.props.filters.getState()
    let selectedMilestoneItem
    if (milestoneTitles.length) {
      if (milestoneTitles.length > 1) {
        selectedMilestoneItem = `${milestoneTitles.length} milestones`
      } else {
        // Only 1 milestone is selected so show the milestone title
        selectedMilestoneItem = renderMilestone({ title: milestoneTitles[0] })
      }
    } else {
      const { states, types } = this.props.filters.getState()
      let state = ''
      if (states.length === 1) {
        if (states[0] === 'open') {
          state = ' opened'
        } else if (states[0] === 'closed') {
          state = ' closed'
        } else {
          throw new Error('BUG: invalid state')
        }
      }
      if (types.length === 2) {
        selectedMilestoneItem = `All${state} Issues and Pull Requests`
      } else if (types.length === 1) {
        if (types[0] === 'issue') {
          selectedMilestoneItem = `All${state} Issues`
        } else if (types[0] === 'pull-request') {
          selectedMilestoneItem = `All${state} Pull Requests`
        } else {
          throw new Error('BUG: invalid type')
        }
      } else {
        throw new Error('BUG: invalid type')
      }
    }

    return (
      <BS.NavDropdown
        id="filter-dropdown"
        className="filter-menu"
        title={
          <span className="-filter-title">
            {selectedMilestoneItem} <SettingsIcon />
          </span>
        }
        open={this.state.open}
        onToggle={this.onToggle}
        onSelect={this.onSelect}
      >
        <div className="header">
          <span>Filters</span>
          <SavedFiltersButton />
        </div>
        {panel}
      </BS.NavDropdown>
    )
  }
}

export default connect(state => ({
  labels: state.issues.labels,
  milestones: state.issues.milestones,
}))(FilterDropdown)

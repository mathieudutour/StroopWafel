import React from 'react'
import { connect } from 'react-redux'

import { fetchMilestones, fetchIssues } from '../../../redux/ducks/issue'
import { selectors } from '../../../redux/ducks/filter'
import { getCardColumn, sortByColumnName } from '../../../helpers'
import LabelBadge from '../../label-badge'
import AppNav from '../../app/nav'

import d3 from 'd3' // eslint-disable-line
import gantt from './gantt-chart'

const filterByMilestoneAndKanbanColumn = cards => {
  const data = {}
  const columns = {}
  const columnCounts = {} // key is columnName
  const add = card => {
    if (card.issue.milestone) {
      const column = getCardColumn(card)
      const columnName = column.name
      columns[columnName] = column
      const msCounts = data[card.issue.milestone.title] || {}
      data[card.issue.milestone.title] = msCounts
      msCounts[columnName] = msCounts[columnName] || 0
      msCounts[columnName] += 1

      columnCounts[columnName] = columnCounts[columnName] || 0
      columnCounts[columnName] += 1
    } else {
      // TODO: Should account for issues not in a milestone somehow
    }
  }

  cards.forEach(card => {
    add(card)
  })
  return {
    data,
    columns: Object.keys(columns).map(k => columns[k]),
    columnCounts,
  }
}

class GanttChart extends React.Component {
  componentWillMount() {
    this.props.dispatch(
      fetchMilestones(
        this.props.repoInfos[0].repoOwner,
        this.props.repoInfos[0].repoName
      )
    )
    this.props.dispatch(fetchIssues(this.props.repoInfos))
  }

  componentDidMount() {
    this.renderChart()
  }

  componentDidUpdate() {
    this.renderChart()
  }

  renderChart = () => {
    const { milestones, data, columns } = this.props
    const now = new Date()

    this._ganttWrapper.innerHTML = ''

    const tasks = milestones.map(milestone => {
      const {
        createdAt,
        dueOn,
        title,
        state,
        closedIssues,
        openIssues,
      } = milestone
      const dueAt = dueOn ? new Date(dueOn) : null
      let status
      if (dueAt && dueAt.getTime() < now.getTime()) {
        status = 'milestone-status-overdue'
      } else {
        status = `milestone-status-${state}`
      }
      const segments = []
      if (closedIssues) {
        segments.push({
          count: closedIssues,
          color: '666666',
          title: 'Closed Issues',
        })
      }
      let accountedForCount = 0
      columns.forEach(({ name, color }) => {
        if (data[milestone.title]) {
          const count = data[milestone.title][name] || 0
          if (count) {
            accountedForCount += count
            segments.push({ count, color, title: name })
          }
        }
      })
      if (accountedForCount !== openIssues) {
        segments.push({
          count: openIssues - accountedForCount,
          color: 'ffffff',
          title: 'Other Open Issues',
        })
      }
      return {
        startDate: createdAt,
        endDate: dueAt || now,
        taskName: title,
        status,
        segments,
      }
    })

    const taskStatus = {
      'milestone-status-overdue': 'milestone-status-overdue',
      'milestone-status-open': 'milestone-status-open',
      'milestone-status-closed': 'milestone-status-closed',
    }

    const taskNames = tasks.map(({ taskName }) => taskName).sort()

    tasks.sort((a, b) => a.endDate - b.endDate)
    const maxDate = (tasks[tasks.length - 1] || {}).endDate
    tasks.sort((a, b) => a.startDate - b.startDate)
    // const minDate = tasks[0].startDate;

    const format = '%H:%M'

    const chart = gantt(taskNames.length)
      .taskTypes(taskNames)
      .taskStatus(taskStatus)
      .tickFormat(format)
      .selector('#the-gantt-chart')
    chart(tasks)

    function changeTimeDomain(timeDomainString) {
      let tickFormat
      switch (timeDomainString) {
        case '1hr':
          tickFormat = '%H:%M:%S'
          chart.timeDomain([d3.time.hour.offset(maxDate, -1), maxDate])
          break
        case '3hr':
          tickFormat = '%H:%M'
          chart.timeDomain([d3.time.hour.offset(maxDate, -3), maxDate])
          break
        case '6hr':
          tickFormat = '%H:%M'
          chart.timeDomain([d3.time.hour.offset(maxDate, -6), maxDate])
          break
        case '1day':
          tickFormat = '%H:%M'
          chart.timeDomain([d3.time.day.offset(maxDate, -1), maxDate])
          break
        case '1week':
          tickFormat = '%m/%d'
          chart.timeDomain([d3.time.day.offset(maxDate, -7), maxDate])
          break
        default:
          tickFormat = '%H:%M'
      }
      chart.tickFormat(tickFormat)
      chart.redraw(tasks)
    }

    changeTimeDomain('1week')
  }

  render() {
    const { columns, columnCounts, milestones, filters, params } = this.props

    const legend = columns.map(label => (
      <LabelBadge
        key={label.name}
        label={label}
        extra={columnCounts[label.name]}
        filters={filters}
      />
    ))

    let closedCount = 0
    milestones.forEach(milestone => {
      closedCount += milestone.closedIssues
    })
    return (
      <div className="-gantt-chart-and-legend">
        <AppNav params={params} />
        <div
          ref={r => {
            this._ganttWrapper = r
          }}
          id="the-gantt-chart"
        />
        <h3>Legend</h3>
        <p>Blue vertical line is Today</p>
        <LabelBadge
          key="completed"
          label={{ name: '0 - Closed', color: '666666' }}
          extra={closedCount}
          filters={filters}
        />
        {legend}
        <br />
        {/* Add breaks to increase padding because I'm lazy and don't want to add CSS margins */}
        <br />
      </div>
    )
  }
}

export default connect((state, ownProps) => {
  const { milestoneTitles } = state.filter

  const cards = filterByMilestoneAndKanbanColumn(state.issues.cards)

  const { data, columnCounts } = cards

  const columns = cards.columns.sort(sortByColumnName(true))

  // Remove milestones that are not in the URL filter
  let { milestones } = state.issues
  if (milestoneTitles.length > 0) {
    milestones = milestones.filter(
      milestone => milestoneTitles.indexOf(milestone.title) >= 0
    )
  }
  const repoInfos = selectors.getReposFromParams(ownProps.params)
  return {
    milestones,
    data,
    columns,
    columnCounts,
    repoInfos,
    filters: new selectors.FilterBuilder(state.filter, repoInfos),
  }
})(GanttChart)

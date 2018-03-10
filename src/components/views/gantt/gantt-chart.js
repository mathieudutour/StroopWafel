import d3 from 'd3' // eslint-disable-line
/**
 * From https://github.com/dk8996/Gantt-Chart
 * @author Dimitry Kudrayvtsev
 * @version 2.x
 */

export default function(milestoneCount) {
  const FIT_TIME_DOMAIN_MODE = 'fit'

  let margin = {
    top: 20,
    right: 40,
    bottom: 20,
    left: 250,
  }
  let selector = 'body'
  let timeDomainStart = d3.time.day.offset(new Date(), -3)
  let timeDomainEnd = d3.time.hour.offset(new Date(), +3)
  let timeDomainMode = FIT_TIME_DOMAIN_MODE // fixed or fit
  let taskTypes = []
  let taskStatus = []
  // var height = document.body.clientHeight - margin.top - margin.bottom-5;
  let height = milestoneCount * 50 // height of chart is based on # of milestones
  let width = document.body.clientWidth - margin.right - margin.left - 5

  let tickFormat = '%H:%M'

  function keyFunction(d) {
    return d.startDate + d.taskName + d.endDate
  }

  let x = d3.time
    .scale()
    .domain([timeDomainStart, timeDomainEnd])
    .range([0, width])
    .clamp(true)

  let y = d3.scale
    .ordinal()
    .domain(taskTypes)
    .rangeRoundBands([0, height - margin.top - margin.bottom], 0.1)

  function rectTransformSegment({ task, total, prev }) {
    const percent = prev / total
    return `translate(${x(task.startDate) +
      percent * (x(task.endDate) - x(task.startDate))},${y(task.taskName)})`
  }

  let xAxis = d3.svg
    .axis()
    .scale(x)
    .orient('bottom')
    .tickFormat(d3.time.format(tickFormat))
    .tickSubdivide(true)
    .tickSize(8)
    .tickPadding(8)

  let yAxis = d3.svg
    .axis()
    .scale(y)
    .orient('right')
    .tickSize(0)

  function initTimeDomain(tasks) {
    if (timeDomainMode === FIT_TIME_DOMAIN_MODE) {
      if (tasks === undefined || tasks.length < 1) {
        timeDomainStart = d3.time.day.offset(new Date(), -3)
        timeDomainEnd = d3.time.hour.offset(new Date(), +3)
        return
      }
      tasks.sort((a, b) => a.endDate - b.endDate)
      timeDomainEnd = tasks[tasks.length - 1].endDate
      tasks.sort((a, b) => a.startDate - b.startDate)
      timeDomainStart = tasks[0].startDate
    }
  }

  function initAxis() {
    x = d3.time
      .scale()
      .domain([timeDomainStart, timeDomainEnd])
      .range([0, width])
      .clamp(true)
    y = d3.scale
      .ordinal()
      .domain(taskTypes)
      .rangeRoundBands([0, height - margin.top - margin.bottom], 0.1)
    xAxis = d3.svg
      .axis()
      .scale(x)
      .orient('bottom')
      .tickFormat(d3.time.format(tickFormat))
      .tickSubdivide(true)
      .tickSize(8)
      .tickPadding(8)

    yAxis = d3.svg
      .axis()
      .scale(y)
      .orient('right')
      .tickSize(0)
  }

  function gantt(tasks) {
    initTimeDomain(tasks)
    initAxis()

    const svg = d3
      .select(selector)
      .append('svg')
      .attr('class', 'chart')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('class', 'gantt-chart')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    const PHIL = svg.selectAll('.chart')

    PHIL.select('line.today')
      .data([new Date()])
      .enter()
      .append('line')
      .attr('class', 'today')
      .attr('x1', d => x(d))
      .attr('x2', d => x(d))
      .attr('y1', 0)
      .attr('y2', height)
      .style({ stroke: 'rgb(0,0,255)', 'stroke-width': 2 })

    PHIL.selectAll('g.milestone-bars')
      .data(tasks, keyFunction)
      .enter()
      .append('g')
      .attr('class', 'milestone-bars')
      .selectAll('rect')
      .data(task => {
        task.segments.map(segment => ({ task, segment }))
      })
      .enter()
      .append('rect')
      .attr('class', 'milestone-segment')
      .style(({ segment }) => ({ fill: segment.color }))
      .attr('transform', rectTransformSegment)
      .attr('height', () => y.rangeBand())
      .attr('width', ({ task, total, segment }) => {
        const percent = segment.count / total
        return percent * (x(task.endDate) - x(task.startDate))
      })

    svg
      .append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0, ${height - margin.top - margin.bottom})`)
      .transition()
      .call(xAxis)

    svg
      .append('g')
      .attr('class', 'y axis')
      .attr('transform', `translate(-${margin.left}, 0)`)
      .transition()
      .call(yAxis)

    return gantt
  }

  gantt.redraw = tasks => {
    initTimeDomain(tasks)
    initAxis()

    const svg = d3.select('.chart')

    const ganttChartGroup = svg.select('.gantt-chart')
    const rect = ganttChartGroup
      .selectAll('g.milestone-bars')
      .data(tasks, keyFunction)

    rect
      .enter()
      .append('g')
      .attr('class', 'milestone-bars')
      .selectAll('rect')
      .data(task => {
        const total = task.segments.reduce(
          (acc, segment) => acc + segment.count,
          0
        )
        let prev = 0
        const segments = task.segments.map(segment => {
          const ret = { task, segment, prev, total }
          prev += segment.count
          return ret
        })
        return segments
      })
      .enter()
      .append('rect')
      .style('fill', ({ segment }) => `#${segment.color}`)
      .attr('transform', rectTransformSegment)
      .attr('height', () => y.rangeBand())
      .attr('width', ({ task, total, segment }) => {
        const percent = segment.count / total
        return percent * (x(task.endDate) - x(task.startDate))
      })

    svg
      .select('.x')
      .transition()
      .call(xAxis)
    svg
      .select('.y')
      .transition()
      .call(yAxis)

    return gantt
  }

  gantt.margin = value => {
    if (!arguments.length) return margin
    margin = value
    return gantt
  }

  gantt.timeDomain = value => {
    if (!arguments.length) {
      return [timeDomainStart, timeDomainEnd]
    }
    timeDomainStart = +value[0]
    timeDomainEnd = +value[1]
    return gantt
  }

  /**
   * @param {string}
   *                value The value can be "fit" - the domain fits the data or
   *                "fixed" - fixed domain.
   */
  gantt.timeDomainMode = value => {
    if (!arguments.length) return timeDomainMode
    timeDomainMode = value
    return gantt
  }

  gantt.taskTypes = value => {
    if (!arguments.length) return taskTypes
    taskTypes = value
    return gantt
  }

  gantt.taskStatus = value => {
    if (!arguments.length) return taskStatus
    taskStatus = value
    return gantt
  }

  gantt.width = value => {
    if (!arguments.length) return width
    width = +value
    return gantt
  }

  gantt.height = value => {
    if (!arguments.length) return height
    height = +value
    return gantt
  }

  gantt.tickFormat = value => {
    if (!arguments.length) return tickFormat
    tickFormat = value
    return gantt
  }

  gantt.selector = value => {
    if (!arguments.length) return selector
    selector = value
    return gantt
  }

  return gantt
}

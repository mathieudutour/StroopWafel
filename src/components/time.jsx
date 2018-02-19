import { EventEmitter } from 'events'
import React from 'react'
import Moment from 'moment'

const RELOAD_TIME_SHORT = 20 * 1000
const RELOAD_TIME_LONG = 5 * 60 * 1000

export const Timer = new class Store extends EventEmitter {
  off() {
    // EventEmitter has `.on` but no matching `.off`
    const slice = [].slice
    const args = arguments.length >= 1 ? slice.call(arguments, 0) : []
    return this.removeListener.apply(this, args)
  }
  onTick(listener) {
    this.on('tick', listener)
  }
  offTick(listener) {
    this.off('tick', listener)
  }
}()

// since there can be hundreds of issues, increase the max limit
Timer.setMaxListeners(0)

let timerTimeout = setInterval(() => Timer.emit('tick'), RELOAD_TIME_SHORT)

function handleVisibilityChange() {
  clearInterval(timerTimeout)
  if (document.hidden) {
    timerTimeout = setInterval(() => Timer.emit('tick'), RELOAD_TIME_LONG)
  } else {
    Timer.emit('tick')
    timerTimeout = setInterval(() => Timer.emit('tick'), RELOAD_TIME_SHORT)
  }
}

document.addEventListener('visibilitychange', handleVisibilityChange, false)

export default class extends React.Component {
  state = { forceUpdate: this.forceUpdate.bind(this) }

  componentWillMount() {
    Timer.onTick(this.state.forceUpdate)
  }

  componentWillUnmount() {
    Timer.offTick(this.state.forceUpdate)
  }

  render() {
    const { dateTime, className } = this.props
    const humanized = Moment(dateTime).fromNow()
    return (
      <time
        {...this.props}
        dateTime={dateTime}
        className={className}
        title={dateTime}
      >
        {humanized}
      </time>
    )
  }
}

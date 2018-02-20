import React from 'react'
import { connect } from 'react-redux'
import * as BS from 'react-bootstrap'

class About extends React.Component {
  render() {
    return (
      <div>
        <BS.Jumbotron>
          <h1>StrooWafel</h1>
          <p>Open source serverless Kanban board backed by GitHub issues</p>
          <p>
            <BS.Button bsStyle="primary">Sign in with GitHub</BS.Button>
          </p>
        </BS.Jumbotron>
        <div>Add more marketing stuff here</div>
      </div>
    )
  }
}

export default connect()(About)

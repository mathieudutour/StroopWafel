import React from 'react'
import { connect } from 'react-redux'
import * as BS from 'react-bootstrap'
import AppNav from '../app/nav'
import LoginModal from '../login-modal'

class About extends React.Component {
  render() {
    return (
      <div class="about">
        <header>
          <AppNav params={this.props.params} />
        </header>
        <BS.Jumbotron>
          <h1>
            StrooWafel let you work more collaboratively and get more done.
          </h1>
          <p>
            StrooWafel's projects, lists and cards enable you to organize and
            prioritize your GitHub issues in a fun, flexible and rewarding way.
          </p>
          <p>
            <BS.Button bsStyle="primary">Sign in for free</BS.Button>
          </p>
        </BS.Jumbotron>
        <div>Add more marketing stuff here</div>
        <LoginModal show={showModal} container={this} onHide={close} />
      </div>
    )
  }
}

export default connect()(About)

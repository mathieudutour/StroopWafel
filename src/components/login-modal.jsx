import React from 'react'
import { connect } from 'react-redux'
import * as BS from 'react-bootstrap'
import { LinkExternalIcon } from 'react-octicons'

import { login } from '../redux/ducks/user'

class Login extends React.Component {
  onSave = () => {
    let rootURLVal = this._rootURL.value
    if (rootURLVal) {
      rootURLVal = rootURLVal.trim()
    }
    let tokenVal = this._token.value
    if (tokenVal) {
      // needs trimming because just copying the token
      // from GitHub (by double-clicking the string instead of
      // clicking the Copy button) adds a leading space character
      tokenVal = tokenVal.trim()
    }
    this.props.dispatch(login(tokenVal, rootURLVal))
    // Close the modal
    this.props.onHide()
  }

  render() {
    const { token } = this.props

    const footer = (
      <span>
        <BS.Button bsStyle="default" onClick={this.props.onHide}>
          Cancel
        </BS.Button>
        <BS.Button bsStyle="primary" onClick={this.onSave}>
          Sign in
        </BS.Button>
      </span>
    )

    return (
      <BS.Modal
        show={this.props.show}
        container={this.props.container}
        onHide={this.props.onHide}
      >
        <BS.Modal.Header closeButton />
        <BS.Modal.Body>
          <div className="github-token-instructions">
            <h4>How do I sign in?</h4>
            <p>
              StroopWafel is completely serverless. It means that your
              information never leave your computer. That's great but has a
              tradeoff: the login is a bit more complicated than just clicking
              on a button.
            </p>
            <p>
              You will need to manually give StroopWafel access to your GitHub
              repository. To do so, you need to create a GitHub token. It will
              never leave your computer.
            </p>
            <h4>OK, that's fair. How do I create a token?</h4>
            <ol>
              <li>
                Go to{' '}
                <a
                  href="https://github.com/settings/tokens/new"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://github.com/settings/tokens/new <LinkExternalIcon />
                </a>
              </li>
              <li>
                Provide a descriptive title (like "StroopWafel") in the "Token
                Description"
              </li>
              <li>Unselect all the checkboxes to just look at repositories</li>
              <ul>
                <li>
                  Select <code>public_repo</code> to be able to update/move
                  issues
                </li>
                <li>
                  Select <code>repo</code> if you want to see/update information
                  for <strong>private</strong> repositories
                </li>
              </ul>
              <li>
                Click <code>Generate Token</code>
              </li>
              <li>Copy the new token and paste it in here!</li>
              <li>
                <strong>Note:</strong> You may need to refresh the page when you
                click "Save"
              </li>
            </ol>
            <BS.FormControl
              type="text"
              defaultValue={token}
              disabled={!!token}
              placeholder="Enter GitHub token"
              inputRef={r => {
                this._token = r
              }}
            />
            <h4>I'm using GitHub Enterprise. How to use my server?</h4>
            <p>
              <BS.FormControl
                type="text"
                placeholder="Enter GitHub API URL, e.g. https://github.example.com/api/v3"
                inputRef={r => {
                  this._rootURL = r
                }}
              />
            </p>
          </div>
        </BS.Modal.Body>
        <BS.Modal.Footer>{footer}</BS.Modal.Footer>
      </BS.Modal>
    )
  }
}

export default connect(state => state.user)(Login)

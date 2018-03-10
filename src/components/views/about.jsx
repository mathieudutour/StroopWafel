import React from 'react'
import { connect } from 'react-redux'
import * as BS from 'react-bootstrap'
import LoginModal from '../login-modal'

class About extends React.Component {
  state = { showModal: false }

  render() {
    const { showModal } = this.state

    // Note: The dashboard page does not have a list of repos
    const close = () => this.setState({ showModal: false })

    return (
      <div className="about">
        <header>
          <h1>A better way to manage your GitHub Issues</h1>
          <p>
            Multi-repo projects, Epics, and reports enable you to organize and
            prioritize your GitHub issues in a fun, flexible and rewarding way.
          </p>
          <BS.Button
            bsStyle="primary"
            onClick={() => this.setState({ showModal: true })}
          >
            Sign in for free
          </BS.Button>
        </header>
        <div className="container text-center">
          <div className="features">
            <div>
              <span>
                <svg
                  height="48px"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 100 100"
                >
                  <path
                    d="M7.8,89.5h84.4c3.7,0,6.8-3,6.8-6.8V17.2c0-3.7-3-6.8-6.8-6.8H7.8c-3.7,0-6.8,3-6.8,6.8v65.5C1,86.5,4.1,89.5,7.8,89.5z   M92.2,86H7.8c-1.8,0-3.3-1.5-3.3-3.3V32.9h91v49.9C95.5,84.6,94,86,92.2,86z M7.8,14h84.4c1.8,0,3.3,1.5,3.3,3.3v12.1h-91V17.2  C4.5,15.4,6,14,7.8,14z M11,22.9c-0.3-0.3-0.5-0.8-0.5-1.2s0.2-0.9,0.5-1.2c0.6-0.6,1.8-0.6,2.5,0c0.3,0.3,0.5,0.8,0.5,1.2  s-0.2,0.9-0.5,1.2c-0.3,0.3-0.8,0.5-1.2,0.5S11.3,23.2,11,22.9z M20.4,22.9c-0.3-0.3-0.5-0.8-0.5-1.2s0.2-0.9,0.5-1.2  c0.6-0.6,1.8-0.6,2.5,0c0.3,0.3,0.5,0.8,0.5,1.2s-0.2,0.9-0.5,1.2c-0.3,0.3-0.8,0.5-1.2,0.5C21.2,23.4,20.7,23.2,20.4,22.9z   M29.9,22.9c-0.3-0.3-0.5-0.8-0.5-1.2s0.2-0.9,0.5-1.2c0.7-0.6,1.8-0.6,2.5,0c0.3,0.3,0.5,0.8,0.5,1.2s-0.2,0.9-0.5,1.2  c-0.3,0.3-0.8,0.5-1.2,0.5S30.2,23.2,29.9,22.9z M50.1,41.3c-16.5,0-28.1,16.2-28.6,16.9c-0.4,0.6-0.4,1.4,0,2  C22,60.8,33.6,77,50.1,77c16.5,0,28.1-16.2,28.6-16.9c0.4-0.6,0.4-1.4,0-2C78.2,57.4,66.7,41.3,50.1,41.3z M50.1,73.5  c-12.5,0-22.2-10.9-24.9-14.4c2.7-3.4,12.5-14.4,24.9-14.4c12.5,0,22.2,10.9,24.9,14.4C72.3,62.5,62.6,73.5,50.1,73.5z M50.1,49.9  c-4.8,0-8.8,3.9-8.8,8.8c0,4.8,3.9,8.8,8.8,8.8s8.8-3.9,8.8-8.8C58.9,53.8,55,49.9,50.1,49.9z M50.1,64c-2.9,0-5.3-2.4-5.3-5.3  s2.4-5.3,5.3-5.3s5.3,2.4,5.3,5.3S53,64,50.1,64z"
                    fill="#24292e"
                  />
                </svg>
              </span>
              <h2>Private by design</h2>
              <p>
                There is no servers. Your browser will communicate directly with
                GitHub. No trackers, no analytics, no nothing.
              </p>
            </div>
            <div>
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48px"
                  height="48px"
                  viewBox="0 0 30 30"
                >
                  <g fill="none" fillRule="evenodd">
                    <path
                      fill="#959DA5"
                      fillRule="nonzero"
                      d="M13.5 6c-.3 0-.5.2-.5.5v3h-.6l-2-2h-.7l-2 2.2c-.3.2-.3.5 0 .7l2 2-.3.6h-3c-.2 0-.4.2-.4.5v3c0 .3.2.5.5.5h3v.6l-2 2v.7l2.2 2c.2.3.5.3.7 0l2-2 .6.3v3c0 .2.2.4.5.4h3c.3 0 .5-.2.5-.5v-3h.5l2 2h.8l2-2.2c.3-.2.3-.5 0-.7l-2-2 .3-.6h3c.2 0 .4-.2.4-.5v-3c0-.3-.2-.5-.5-.5h-3v-.6l2-2v-.7l-2.2-2c-.2-.3-.5-.3-.7 0l-2 2-.6-.3v-3c0-.2-.2-.4-.5-.4h-3zm.5 1h2v2.7c0 .2 0 .4.4.5.3 0 .7.2 1 .4h.6l2-2 1.3 1.5-2 2v1c.3.3.4.7.5 1 0 .3.3.4.5.4H23v2h-2.7c-.2 0-.4.3-.5.5 0 .3-.3.6-.5 1v.6l2 2L20 22l-2-2h-1l-1 .3c-.3 0-.4.3-.4.5V23h-2v-2.7c0-.2 0-.4-.5-.5l-1-.4-2 2L8.7 20l2-2v-.6l-.4-1c0-.2-.3-.4-.5-.4H7v-2h2.7c.2 0 .4 0 .5-.4 0-.3.2-.7.4-1V12l-2-2L10 8.8l2 2h.5l1-.5c.4 0 .5-.3.5-.5V7zm1 5c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3zm0 1c1 0 2 1 2 2s-1 2-2 2-2-1-2-2 1-2 2-2z"
                    />
                    <path
                      fill="#959DA5"
                      d="M2 0v1h1V0m1 0v1h1V0m1 0v1h1V0m1 0v1h11V0"
                    />
                    <path
                      fill="#24292E"
                      d="M21 0l-1 .7L21.4 2H5C3.3 2 2 3.3 2 5v1h1V5c0-1 1-2 2-2h16.3L20 4.3l1 .6 2-2.6V2l-2-2zm3 2v1h1c1 0 2 1 2 2v16.3L25.7 20l-.6 1 2.6 2h.6l2-2-.5-1-1.3 1.3V5c0-1.7-1-3-3-3h-1z"
                    />
                    <path
                      fill="#959DA5"
                      d="M29 2v1h1V2m-1 2v1h1V4M0 23v1h1v-1"
                    />
                    <path
                      fill="#24292E"
                      d="M27 24v1c0 1-1 2-2 2H8.7l1.2-1.3-1-.6-2 2.6v.6l2 2 1-.5L8.2 28H25c1.7 0 3-1.3 3-3v-1h-1z"
                    />
                    <path
                      fill="#959DA5"
                      d="M0 25v1h1v-1m-1 2v1h1v-1m10 2v1h11v-1m1 0v1h1v-1m1 0v1h1v-1m1 0v1h1v-1m1-23v1h1V6"
                    />
                    <path
                      fill="#24292E"
                      d="M2.5 7h-.3l-2 2 .5 1L2 8.6V25c0 1.7 1.3 3 3 3h1v-1H5c-1 0-2-1-2-2V8.7L4.3 10 5 9 2.7 7h-.3z"
                    />
                    <path fill="#959DA5" d="M29 8v11h1V8M0 11v11h1V11" />
                  </g>
                </svg>
              </span>
              <h2>Supercharged workflow</h2>
              <p>
                Create Epics, add estimates, filter by assignees or milestones,
                Burnup charts. Help your team meet deadlines more predictably.
              </p>
            </div>
            <div>
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48px"
                  height="48px"
                  viewBox="0 0 91 91"
                >
                  <g fill="none" fillRule="evenodd">
                    <path
                      fill="#24292E"
                      fillRule="nonzero"
                      d="M26.5 17c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm-13 0c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm6.5 0c-.8 0-1.5-.7-1.5-1.5S19.2 14 20 14s1.5.7 1.5 1.5S20.8 17 20 17z"
                    />
                    <path
                      stroke="#959DA5"
                      strokeWidth="2"
                      d="M24 67h22v22.2H24V67zm22 0h22v22.2H46V67z"
                    />
                    <path
                      stroke="#24292E"
                      strokeWidth="2"
                      d="M13 43.3l20.3-8.7L42 55l-20.3 8.7z"
                    />
                    <path
                      stroke="#959DA5"
                      strokeWidth="2"
                      d="M46 45h22v22.2H46V45zm22 0h22v22.2H68V45zM16.5 21.3C17 26 20.2 32 22.2 34.6"
                    />
                    <path
                      fill="#24292E"
                      d="M.3 10H1l.4-.3c.2 0 .3-.3.4-.5l.2-.8V3.6c0-.5 0-1 .2-1.4l.7-1C3 1 3 .8 4 .6l1-.2h1.6v2h-1c-.6 0-1 .2-1 .5v5l-.4 1-.7 1H2h.8l.7.2.7 1 .2 1.2v5c0 .2 0 .6.2 1 0 .2.4.3 1 .3h1.2v2H3l-.8-1-.2-1.4V14c0-.4 0-.7-.2-1 0-.2-.2-.4-.4-.5-.2 0-.3-.2-.5-.3H0V10zm39.4 2l-.6.2v8.5l-1 1-1 .7h-3v-2h1c1 0 1 0 1-.3v-6s0-1 .8-1l.7-1h.8-2l-.5-1-.3-1V3c0-.4 0-.6-1-.6h-1v-2h2c.7 0 1 0 1 .2s1 .3 1 .6l1 1v7c0 .2.6.4.8.5.2 0 .3.2.5.3h1v2z"
                    />
                    <path
                      stroke="#959DA5"
                      strokeWidth="2"
                      d="M67.8 67H90v22.2H67.8zm0-44H90v22.2H67.8z"
                    />
                  </g>
                </svg>
              </span>
              <h2>Make it your own</h2>
              <p>
                Every pixel is completely open source. Build the features you
                need and become a part of future StroopWafel releases.
              </p>
            </div>
          </div>
        </div>
        <LoginModal show={showModal} container={this} onHide={close} />
      </div>
    )
  }
}

export default connect()(About)

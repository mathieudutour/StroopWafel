import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import * as BS from 'react-bootstrap'
import { GearIcon, QuestionIcon, GraphIcon } from 'react-octicons'

import {
  toggleShowSimpleList,
  toggleHideUncategorized,
  toggleShowEmptyColumns,
  toggleShowPullRequestData,
  setViewingMode,
  VIEWING_MODE,
} from '../../redux/ducks/settings'
import { fetchUser, logout, resetDatabases } from '../../redux/ducks/user'
import { selectors } from '../../redux/ducks/filter'

import LoginModal from '../login-modal'
import LabelBadge from '../label-badge'
import MoveModal from '../move-modal'
import FilterDropdown from './filter-dropdown'
import Logo from '../logo'

class SettingsItem extends React.Component {
  render() {
    const { key, onSelect, isChecked, className, to, children } = this.props
    let { href } = this.props

    if (!href && to) {
      href = `#${to}` // Link
    }

    return (
      <BS.MenuItem
        key={key}
        href={href}
        onSelect={onSelect}
        className={className}
      >
        <span className="settings-item-checkbox" data-checked={isChecked}>
          {children}
        </span>
      </BS.MenuItem>
    )
  }
}

class AppNav extends React.Component {
  static propTypes = {
    settings: PropTypes.object,
    filters: PropTypes.object,
    repoInfos: PropTypes.array,
    dispatch: PropTypes.func,
    userInfo: PropTypes.object,
  }

  state = { showModal: false }

  componentDidMount() {
    this.props.dispatch(fetchUser())
  }

  promptAndResetDatabases = () => {
    if (
      confirm(
        'Are you sure you want to reset all the local data? It will take some time to repopulate all the data from GitHub and you may need to reload the page'
      )
    ) {
      this.props.dispatch(resetDatabases()).then(() => {
        alert('Local cache has been cleared')
      })
    }
  }

  render() {
    let { userInfo, repoInfos, settings, filters, LABEL_CACHE } = this.props
    const { showModal } = this.state
    const { userName, tagNames } = filters.getState()

    // Note: The dashboard page does not have a list of repos
    const close = () => this.setState({ showModal: false })

    const brand = (
      <Link to={'/'}>
        <Logo />
      </Link>
    )
    const filtering = tagNames.map(tagName => {
      // TODO: HACK. Find a better way to update the color of labels
      const label = LABEL_CACHE[tagName] || { name: tagName, color: 'ffffff' }
      return (
        <LabelBadge
          key={tagName}
          isFilterLink
          label={label}
          filters={filters}
        />
      )
    })

    if (userName) {
      filtering.push(
        <Link
          key="user"
          className="badge"
          to={filters.toggleUserName(userName).url()}
        >
          {userName}
        </Link>
      )
    }

    let loginButton
    if (userInfo) {
      const avatarImage = (
        <img
          alt={'@' + userInfo.login}
          className="avatar-image"
          src={userInfo.avatarUrl}
        />
      )
      loginButton = (
        <BS.NavDropdown
          key="signin-dropdown"
          id="signin-dropdown"
          title={avatarImage}
        >
          <BS.MenuItem key="1" header>
            Signed in as <strong>{userInfo.login}</strong>
          </BS.MenuItem>
          <BS.MenuItem
            key="2"
            target="_blank"
            href="https://github.com/settings/tokens"
          >
            Review GitHub Access
          </BS.MenuItem>
          <BS.MenuItem key="3" divider />
          <BS.MenuItem
            key="4"
            target="_blank"
            href="https://github.com/mathieudutour/StroopWafel/issues/new"
          >
            Report a Bug
          </BS.MenuItem>
          <BS.MenuItem
            key="5"
            target="_blank"
            href="https://github.com/mathieudutour/StroopWafel"
          >
            View Source Code
          </BS.MenuItem>
          <BS.MenuItem key="6" divider />
          <BS.MenuItem key="7" eventKey="1">
            <span onClick={() => this.props.dispatch(logout())}>Sign Out</span>
          </BS.MenuItem>
        </BS.NavDropdown>
      )
    } else {
      loginButton = (
        <BS.NavItem
          className="sign-in"
          onClick={() => this.setState({ showModal: true })}
        >
          Sign In
        </BS.NavItem>
      )
    }

    const settingsTitle = <GearIcon />

    let repoDetails = null
    if (!filtering.length && repoInfos.length) {
      // Grab the 1st repo
      const [{ repoOwner, repoName }] = repoInfos
      let repoNameItems
      if (repoInfos.length === 1) {
        repoNameItems = (
          <Link to={filters.url()} className="repo-name">
            {repoName}
          </Link>
        )
      } else {
        repoNameItems = repoInfos.map((repoInfo, index) => {
          const currentRepoInfos = [repoInfo]

          const repoLink = new selectors.FilterBuilder(
            filters.state,
            currentRepoInfos
          ).url()
          return (
            <span key={repoLink} className="repo-name-wrap">
              {(index !== 0 && '&') || null}
              {/* Put an & between repo names */}
              <Link to={repoLink} className="repo-name">
                {repoInfo.repoName}
              </Link>
            </span>
          )
        })
      }
      repoDetails = (
        <li className="repo-links">
          <span className="repo-owner">{repoOwner}</span>
          {'/'}
          {repoNameItems}
        </li>
      )
    }
    const settingsMenuHelp = () => {
      /*eslint-disable no-alert */
      alert(
        'When an Issue and Pull Request are linked (by writing "fixes #123" in the Pull Request description) the related Issue/Pull request is removed from the list.\n Developers will probably want to see the Pull Request in their board (since they created it) while QA would probably rather see the Issue (since they created it).'
      )
      /*eslint-enable no-alert */
    }

    let managerMenu
    if (repoInfos.length) {
      managerMenu = (
        <SettingsItem key="manager" to={filters.setRouteName('by-user').url()}>
          Issues by User
        </SettingsItem>
      )
    }

    return (
      <div className="app-nav">
        <BS.Navbar className="topbar-nav" fixedTop>
          <BS.Navbar.Header>
            <BS.Navbar.Brand>{brand}</BS.Navbar.Brand>
          </BS.Navbar.Header>
          <BS.Nav key="repo-details">
            {repoDetails}
            <li key="active-filter" className="active-filter">
              <span className="-just-here-because-bootstrap-pads-anchor-children-in-the-nav">
                {filtering}
              </span>
            </li>
          </BS.Nav>
          <BS.Nav key="right" pullRight>
            <FilterDropdown filters={this.props.filters} />

            <BS.NavDropdown
              key="settings"
              id="display-settings"
              title={settingsTitle}
            >
              <BS.MenuItem key="display" header>
                Display Settings
              </BS.MenuItem>
              <SettingsItem
                key="ShowSimpleList"
                onSelect={() => this.props.dispatch(toggleShowSimpleList())}
                isChecked={settings.isShowSimpleList}
              >
                Show Simple List
              </SettingsItem>
              <SettingsItem
                key="HideUncategorized"
                onSelect={() => this.props.dispatch(toggleHideUncategorized())}
                isChecked={settings.isHideUncategorized}
              >
                Hide Uncategorized
              </SettingsItem>
              <SettingsItem
                key="ShowEmptyColumns"
                onSelect={() => this.props.dispatch(toggleShowEmptyColumns())}
                isChecked={settings.isShowEmptyColumns}
              >
                Show Empty Columns
              </SettingsItem>
              <BS.MenuItem key="divider" divider />
              <BS.MenuItem key="viewing-mode" header>
                Viewing Mode
                <button
                  className="btn btn-xs btn-default"
                  onClick={settingsMenuHelp}
                >
                  <QuestionIcon />
                </button>
              </BS.MenuItem>
              <SettingsItem
                key="RelatedHideIssues"
                onSelect={() =>
                  this.props.dispatch(setViewingMode(VIEWING_MODE.DEV))
                }
                isChecked={settings.viewingMode === VIEWING_MODE.DEV}
              >
                Developer-Friendly
              </SettingsItem>
              <SettingsItem
                key="RelatedHidePullRequests"
                onSelect={() =>
                  this.props.dispatch(setViewingMode(VIEWING_MODE.QA))
                }
                isChecked={settings.viewingMode === VIEWING_MODE.QA}
              >
                QA-Friendly
              </SettingsItem>
              <SettingsItem
                key="RelatedShowAll"
                onSelect={() =>
                  this.props.dispatch(setViewingMode(VIEWING_MODE.COMBINED))
                }
                isChecked={settings.viewingMode === VIEWING_MODE.COMBINED}
              >
                Combined
              </SettingsItem>
              <BS.MenuItem key="divider2" divider />
              <BS.MenuItem key="api-settings" header>
                GitHub API Settings
              </BS.MenuItem>
              <SettingsItem
                key="ShowPullRequestData"
                onSelect={() =>
                  this.props.dispatch(toggleShowPullRequestData())
                }
                isChecked={settings.isShowPullRequestData}
              >
                Show More Pull Request Info
              </SettingsItem>

              <BS.MenuItem key="divider3" divider />
              <BS.MenuItem key="manager-pages" header>
                Manager-ish Pages
              </BS.MenuItem>
              {managerMenu}
              <SettingsItem
                key="milestone-planning"
                to={filters.setRouteName('by-milestone').url()}
              >
                Milestone Planning View
              </SettingsItem>
              <SettingsItem
                key="burnup"
                to={filters.setRouteName('burnup').url()}
              >
                <GraphIcon /> Burnup Chart
              </SettingsItem>
              <SettingsItem
                key="gantt-chart"
                to={filters.setRouteName('gantt').url()}
              >
                <GraphIcon /> Gantt Chart
              </SettingsItem>
              <BS.MenuItem key="divider4" divider />
              <BS.MenuItem
                key="reset-databases"
                onClick={this.promptAndResetDatabases}
              >
                Reset Local Cache...
              </BS.MenuItem>
            </BS.NavDropdown>
            {loginButton}
          </BS.Nav>
        </BS.Navbar>
        <LoginModal show={showModal} container={this} onHide={close} />
        <MoveModal container={this} filters={filters} />
      </div>
    )
  }
}

export default connect((state, ownProps) => {
  const repoInfos = selectors.getReposFromParams(ownProps.params)
  return {
    userInfo: state.user.info,
    settings: state.settings,
    LABEL_CACHE: state.issues.LABEL_CACHE,
    filters: new selectors.FilterBuilder(state.filter, repoInfos),
    repoInfos,
  }
})(AppNav)

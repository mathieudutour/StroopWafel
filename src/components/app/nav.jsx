import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import * as BS from 'react-bootstrap'
import {
  EyeIcon,
  MilestoneIcon,
  PersonIcon,
  ProjectIcon,
  QuestionIcon,
  GraphIcon,
} from 'react-octicons'

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
import RepoInfos from '../repo-infos'

const SettingsItem = ({
  key,
  onSelect,
  isChecked,
  className,
  to,
  children,
  href,
}) => (
  <BS.MenuItem
    key={key}
    href={href || `#${to}`}
    onSelect={onSelect}
    className={className}
  >
    <span className="settings-item-checkbox" data-checked={isChecked}>
      {children}
    </span>
  </BS.MenuItem>
)

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

  onSignout = () => {
    this.props.dispatch(logout())
  }

  onSignin = () => {
    this.setState({ showModal: true })
  }

  promptAndResetDatabases = () => {
    /* eslint-disable no-restricted-globals */
    if (
      confirm(
        'Are you sure you want to reset all the local data? It will take some time to repopulate all the data from GitHub and you may need to reload the page'
      )
    ) {
      this.props.dispatch(resetDatabases()).then(() => {
        alert('Local cache has been cleared')
      })
    }
    /* eslint-enable */
  }

  render() {
    const { userInfo, repoInfos, settings, filters } = this.props
    const { showModal } = this.state
    const { username, labels } = filters.getState()

    // Note: The dashboard page does not have a list of repos
    const close = () => this.setState({ showModal: false })

    const brand = (
      <Link to="/">
        <Logo />
      </Link>
    )
    const filtering = labels.map(labelName => {
      // TODO: HACK. Find a better way to update the color of labels
      const label = window.LABEL_CACHE[labelName] || {
        name: labelName,
        color: 'ffffff',
      }
      return (
        <LabelBadge
          key={labelName}
          isFilterLink
          label={label}
          filters={filters}
        />
      )
    })

    if (username) {
      filtering.push(
        <Link
          key="user"
          className="badge"
          to={filters.toggleUsername(username).url()}
        >
          {username}
        </Link>
      )
    }

    let loginButton
    if (userInfo) {
      const settingsMenuHelp = () => {
        // eslint-disable-next-line no-alert
        alert(
          'When an Issue and Pull Request are linked (by writing "fixes #123" in the Pull Request description) the related Issue/Pull request is removed from the list.\n Developers will probably want to see the Pull Request in their board (since they created it) while QA would probably rather see the Issue (since they created it).'
        )
      }

      const avatarImage = (
        <img
          alt={`@${userInfo.login}`}
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
          <BS.MenuItem header>
            Signed in as <strong>{userInfo.login}</strong>
          </BS.MenuItem>
          <BS.MenuItem
            target="_blank"
            href="https://github.com/settings/tokens"
          >
            Review GitHub Access
          </BS.MenuItem>
          <BS.MenuItem divider />
          <BS.MenuItem header>Display Settings</BS.MenuItem>
          <SettingsItem
            onSelect={() => this.props.dispatch(toggleShowSimpleList())}
            isChecked={settings.showSimpleList}
          >
            Show Simple List
          </SettingsItem>
          <SettingsItem
            onSelect={() => this.props.dispatch(toggleHideUncategorized())}
            isChecked={!settings.hideUncategorized}
          >
            Show Uncategorized
          </SettingsItem>
          <SettingsItem
            onSelect={() => this.props.dispatch(toggleShowEmptyColumns())}
            isChecked={settings.showEmptyColumns}
          >
            Show Empty Columns
          </SettingsItem>
          <SettingsItem
            onSelect={() => this.props.dispatch(toggleShowPullRequestData())}
            isChecked={settings.showPullRequestData}
          >
            Show More Pull Request Info
          </SettingsItem>
          <BS.MenuItem divider />
          <BS.MenuItem header>
            Viewing Mode{' '}
            <span className="question-label" onClick={settingsMenuHelp}>
              <QuestionIcon />
            </span>
          </BS.MenuItem>
          <SettingsItem
            onSelect={() =>
              this.props.dispatch(setViewingMode(VIEWING_MODE.DEV))
            }
            isChecked={settings.viewingMode === VIEWING_MODE.DEV}
          >
            Developer-Friendly
          </SettingsItem>
          <SettingsItem
            onSelect={() =>
              this.props.dispatch(setViewingMode(VIEWING_MODE.QA))
            }
            isChecked={settings.viewingMode === VIEWING_MODE.QA}
          >
            QA-Friendly
          </SettingsItem>
          <SettingsItem
            onSelect={() =>
              this.props.dispatch(setViewingMode(VIEWING_MODE.COMBINED))
            }
            isChecked={settings.viewingMode === VIEWING_MODE.COMBINED}
          >
            Combined
          </SettingsItem>
          <BS.MenuItem divider />
          <BS.MenuItem
            target="_blank"
            href="https://github.com/mathieudutour/StroopWafel/issues/new"
          >
            Report a Bug
          </BS.MenuItem>
          <BS.MenuItem
            target="_blank"
            href="https://github.com/mathieudutour/StroopWafel"
          >
            View Source Code
          </BS.MenuItem>
          <BS.MenuItem divider />
          <BS.MenuItem onClick={this.promptAndResetDatabases}>
            Reset Local Cache...
          </BS.MenuItem>
          <BS.MenuItem onClick={this.onSignout}>Sign Out</BS.MenuItem>
        </BS.NavDropdown>
      )
    } else {
      loginButton = (
        <BS.NavItem className="sign-in" onClick={this.onSignin}>
          Sign In
        </BS.NavItem>
      )
    }

    return (
      <div className="app-nav">
        <BS.Navbar className="topbar-nav" fixedTop>
          <BS.Navbar.Header>
            <BS.Navbar.Brand>{brand}</BS.Navbar.Brand>
          </BS.Navbar.Header>
          <BS.Nav key="repo-details">
            <RepoInfos repoInfos={repoInfos} filters={filters} />
            {repoInfos.length > 0 && (
              <BS.NavDropdown
                key="settings"
                id="display-settings"
                title={<EyeIcon />}
              >
                <SettingsItem
                  key="kanban"
                  to={filters.setRouteName('kanban').url()}
                >
                  <ProjectIcon /> Kanban
                </SettingsItem>
                <SettingsItem
                  key="by-users"
                  to={filters.setRouteName('by-user').url()}
                >
                  <PersonIcon /> Issues by Assignee
                </SettingsItem>

                <SettingsItem
                  key="milestone-planning"
                  to={filters.setRouteName('by-milestone').url()}
                >
                  <MilestoneIcon /> Milestone Planning View
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
              </BS.NavDropdown>
            )}
            <li key="active-filter" className="active-filter">
              <span className="-just-here-because-bootstrap-pads-anchor-children-in-the-nav">
                {filtering}
              </span>
            </li>
          </BS.Nav>
          <BS.Nav key="right" pullRight>
            {repoInfos.length > 0 && (
              <FilterDropdown filters={this.props.filters} />
            )}
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
    filters: new selectors.FilterBuilder(state.filter, repoInfos),
    repoInfos,
  }
})(AppNav)

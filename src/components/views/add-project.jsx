import React from 'react'
import { connect } from 'react-redux'
import * as BS from 'react-bootstrap'
import { SyncIcon, LockIcon, RepoForkedIcon, RepoIcon } from 'react-octicons'
import { createFilter } from 'react-search-input'
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer'
import List from 'react-virtualized/dist/commonjs/List'

import { fetchRepositories, fetchRepo } from '../../redux/ducks/user'
import { goTo, selectors } from '../../redux/ducks/filter'
import AsyncButton from '../async-button'
import Time from '../time'
import AppNav from '../app/nav'

const ListGroup = ({ children }) => (
  <AutoSizer disableHeight>
    {({ width }) => (
      <List
        height={document.documentElement.clientHeight - 273}
        rowHeight={41}
        rowCount={children.length}
        rowRenderer={({ index, key, style }) => (
          <BS.ListGroupItem key={key} style={style}>
            {children[index]}
          </BS.ListGroupItem>
        )}
        width={width}
      />
    )}
  </AutoSizer>
)

class RepoItem extends React.Component {
  handleSelect = () => {
    this.props.onSelect(this.props.repo.owner.login, this.props.repo.name)
  }
  render() {
    const { isSelected, repo } = this.props

    let repoIcon
    if (repo.private) {
      repoIcon = <LockIcon className="repo-icon" />
    } else if (repo.fork) {
      repoIcon = <RepoForkedIcon className="repo-icon" />
    } else {
      repoIcon = <RepoIcon className="repo-icon" />
    }

    let updatedAt = null
    if (repo.pushedAt) {
      updatedAt = (
        <small className="repo-updated-at">
          {' updated '}
          <Time dateTime={repo.pushedAt} />
        </small>
      )
    }

    return (
      <div className="repo-item" onClick={this.handleSelect}>
        {repoIcon} {repo.name}
        {updatedAt}
        <input
          className="pull-right"
          type="checkbox"
          checked={isSelected || false}
          onChange={this.handleSelect}
        />
      </div>
    )
  }
}

const RepoGroup = ({
  repos,
  toggleSelect,
  selectedRepos,
  search,
  dispatch,
}) => (
  <div>
    <BS.Col md={12}>
      <BS.Panel>
        <ListGroup>
          {repos
            .sort((a, b) => (a.pushedAt > b.pushedAt ? -1 : 1))
            .filter(createFilter(search, ['name']))
            .map(repo => {
              const key = `${repo.owner.login}/${repo.name}`

              return (
                <RepoItem
                  key={key}
                  dispatch={dispatch}
                  repo={repo}
                  isSelected={selectedRepos[key]}
                  onSelect={toggleSelect}
                />
              )
            })}
        </ListGroup>
      </BS.Panel>
    </BS.Col>
  </div>
)

class OrganizationItem extends React.Component {
  handleClick = () => {
    if (this.props.onClick) {
      this.props.onClick(this.props.user)
    }
  }
  render() {
    return (
      <BS.MenuItem onClick={this.handleClick}>
        <img
          alt={`@${this.props.user.login}`}
          className="avatar-image"
          src={this.props.user.avatarUrl}
        />{' '}
        {this.props.user.login}
      </BS.MenuItem>
    )
  }
}

class ListRepos extends React.Component {
  state = {
    selectedOwner: null,
    search: '',
  }

  onSearch = event => {
    this.setState({
      search: event.target.value,
    })
  }

  handleOwnerSelection = owner => {
    this.setState({
      selectedOwner: owner,
    })
  }

  render() {
    const { repos, user, selectedRepos } = this.props
    const { search } = this.state

    const repoOwnersUpdatedAt = {}
    const reposByOwner = {}

    repos.forEach(repo => {
      const repoOwner = repo.owner.login
      const updatedAt = repo.pushedAt

      if (!repoOwnersUpdatedAt[repoOwner]) {
        repoOwnersUpdatedAt[repoOwner] = repo.owner
        repoOwnersUpdatedAt[repoOwner].updatedAt = updatedAt
      } else if (repoOwnersUpdatedAt[repoOwner] < updatedAt) {
        repoOwnersUpdatedAt[repoOwner].updatedAt = updatedAt
      }
      if (!reposByOwner[repoOwner]) {
        reposByOwner[repoOwner] = []
      }
      reposByOwner[repoOwner].push(repo)
    })

    const sortedRepoOwners = Object.keys(repoOwnersUpdatedAt)
      .map(repoOwner => repoOwnersUpdatedAt[repoOwner])
      .sort(
        (a, b) => (a.login === user.login || a.updatedAt > b.updatedAt ? -1 : 1)
      )

    const selectedOwner = this.state.selectedOwner || sortedRepoOwners[0]

    return (
      <div>
        <BS.Row>
          <BS.Col xs={3}>
            <BS.Dropdown id="organizations-dropdown">
              <BS.Dropdown.Toggle>
                <OrganizationItem user={selectedOwner} />
              </BS.Dropdown.Toggle>
              <BS.Dropdown.Menu>
                {sortedRepoOwners.map(owner => (
                  <OrganizationItem
                    key={owner.login}
                    user={owner}
                    onClick={this.handleOwnerSelection}
                  />
                ))}
              </BS.Dropdown.Menu>
            </BS.Dropdown>
          </BS.Col>
          <BS.Col xs={9}>
            <BS.FormControl
              type="text"
              value={search}
              placeholder="Filter repositories..."
              onChange={this.onSearch}
            />
          </BS.Col>
        </BS.Row>
        <BS.Row>
          {selectedOwner &&
            reposByOwner[selectedOwner.login] && (
              <RepoGroup
                toggleSelect={this.props.toggleSelect}
                selectedRepos={selectedRepos}
                user={user}
                key={selectedOwner}
                repos={reposByOwner[selectedOwner.login]}
                search={search}
              />
            )}
        </BS.Row>
      </div>
    )
  }
}

class CustomRepoModal extends React.Component {
  state = { customRepoName: null }

  onCustomRepoChange = e => {
    this.setState({ customRepoName: e.currentTarget.value })
  }

  goToBoard = customRepoName => {
    const [repoOwner, repoName] = customRepoName.split('/')
    const repoInfos = [{ repoOwner, repoName }]
    this.props.dispatch(goTo({ repoInfos, pathname: 'kanban' }))
  }

  render() {
    const { customRepoName } = this.state
    // Make sure the repo contains a '/'
    const isInvalid = customRepoName && !/[^/]\/[^/]/.test(customRepoName)
    const isDisabled = !customRepoName || isInvalid
    return (
      <BS.Modal {...this.props}>
        <BS.Modal.Header closeButton>
          <BS.Modal.Title>
            <RepoIcon size="mega" className="repo-icon" />
            {' Choose your GitHub Repo'}
          </BS.Modal.Title>
        </BS.Modal.Header>
        <BS.Modal.Body className="modal-body">
          <p>Enter the repository owner and name:</p>
          <BS.FormControl
            type="text"
            placeholder="Example: mathieudutour/StroopWafel"
            bsStyle={(isInvalid && 'error') || null}
            onChange={this.onCustomRepoChange}
          />
        </BS.Modal.Body>
        <BS.Modal.Footer>
          <AsyncButton
            disabled={isDisabled}
            bsStyle="primary"
            waitingText="Checking..."
            action={() => this.props.dispatch(fetchRepo(customRepoName))}
            onResolved={() => this.goToBoard(customRepoName)}
            renderError={() => <span>Invalid Repo. Please try again.</span>}
          >
            Show Board
          </AsyncButton>
        </BS.Modal.Footer>
      </BS.Modal>
    )
  }
}

class DashboardShell extends React.Component {
  state = {
    showModal: false,
    selectedRepos: {},
  }

  componentWillMount() {
    if (this.props.user && !this.props.user.repositories) {
      this.props.dispatch(fetchRepositories())
    }
  }

  onClickMore = () => {
    this.setState({ showModal: true })
  }

  onHide = () => this.setState({ showModal: false })

  toggleSelect = (repoOwner, repoName) => {
    const key = `${repoOwner}/${repoName}`
    const { selectedRepos } = this.state
    this.setState({
      selectedRepos: {
        ...selectedRepos,
        [key]: selectedRepos[key] ? undefined : { repoOwner, repoName },
      },
    })
  }

  render() {
    const { user, ready } = this.props
    const { selectedRepos } = this.state

    const repos = (user || {}).repositories || []

    let myRepos

    if (repos.length) {
      myRepos = (
        <ListRepos
          repos={repos}
          user={user}
          toggleSelect={this.toggleSelect}
          selectedRepos={selectedRepos}
        />
      )
    } else if (!ready) {
      myRepos = (
        <span className="custom-loading is-loading">
          <SyncIcon className="icon-spin" />
          {' Loading List of Repositories...'}
        </span>
      )
    } else {
      myRepos = <div>Didn't find any repos</div>
    }

    let viewBoard = null
    if (Object.keys(selectedRepos).length) {
      const repoInfos = Object.keys(selectedRepos)
        .map(k => selectedRepos[k])
        .filter(r => !!r)
      const filters = new selectors.FilterBuilder(undefined, repoInfos)
      const repoLink = filters.url()
      viewBoard = (
        <BS.Button
          className="pull-right"
          bsStyle="primary"
          href={`/#${repoLink}`}
        >
          Continue
        </BS.Button>
      )
    } else {
      viewBoard = (
        <BS.Button className="pull-right" bsStyle="primary" disabled>
          Continue
        </BS.Button>
      )
    }

    return (
      <BS.Grid className="add-project">
        <AppNav params={this.props.params} />
        <BS.Row>
          <h1>Create a Project</h1>
          <p>
            A project is created from one or multiple GitHub repositories, go
            ahead and pick one! All your GitHub repo’s issues and pull requests
            will be shown on a board as cards using their labels to
            automatically move them between columns.
          </p>
        </BS.Row>
        <BS.Row>{myRepos}</BS.Row>
        <BS.Row>
          <BS.Button className="repo-item" onClick={this.onClickMore}>
            Manually create a project
          </BS.Button>
          {viewBoard}

          <CustomRepoModal
            dispatch={this.props.dispatch}
            show={this.state.showModal}
            container={this}
            onHide={this.onHide}
          />
        </BS.Row>
      </BS.Grid>
    )
  }
}

export default connect(state => ({
  ready: state.user.ready,
  user: state.user.info,
}))(DashboardShell)

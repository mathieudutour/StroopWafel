import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import * as BS from 'react-bootstrap'
import { PlusIcon } from 'react-octicons'
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer'
import List from 'react-virtualized/dist/commonjs/List'

import AddProject from './add-project'
import About from './about'
import RepoInfos from '../repo-infos'
import { selectors } from '../../redux/ducks/filter'

class ListProjects extends React.Component {
  render() {
    const { children } = this.props
    return (
      <AutoSizer disableHeight>
        {({ width }) => (
          <List
            height={document.documentElement.clientWidth - 203 - 200}
            rowHeight={41}
            rowCount={children.length}
            rowRenderer={({ index, key, style }) => {
              return (
                <BS.ListGroupItem key={key} style={style}>
                  {children[index]}
                </BS.ListGroupItem>
              )
            }}
            width={width}
          />
        )}
      </AutoSizer>
    )
  }
}

class DashboardShell extends React.Component {
  render() {
    let { projects, user, filter } = this.props

    if (!user) {
      return <About />
    }

    if (!Object.keys(projects).length) {
      return <AddProject />
    }

    return (
      <BS.Grid className="dashboard">
        <h1>
          Your Projects{' '}
          <BS.Button href="/#/add-project">
            <PlusIcon /> Create Project
          </BS.Button>
        </h1>
        <BS.Panel>
          <ListProjects>
            {Object.keys(projects).map(k => {
              const repoInfos = projects[k]
              const projectLink = new selectors.FilterBuilder(
                filter,
                repoInfos
              ).url()
              return (
                <Link
                  key={repoInfos.repoName + repoInfos.repoOwner}
                  to={projectLink}
                >
                  <RepoInfos repoInfos={repoInfos} />
                </Link>
              )
            })}
          </ListProjects>
        </BS.Panel>
      </BS.Grid>
    )
  }
}

export default connect(state => {
  return {
    projects: state.projects,
    user: state.user.info,
    filter: state.filter,
  }
})(DashboardShell)

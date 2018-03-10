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
import AppNav from '../app/nav'

const ListProjects = ({ children }) => (
  <AutoSizer disableHeight>
    {({ width }) => (
      <List
        height={document.documentElement.clientHeight - 200}
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

const Dashboard = ({ projects, user, filter, params }) => {
  if (!user) {
    return <About params={params} />
  }

  if (!Object.keys(projects).length) {
    return <AddProject params={params} />
  }

  return (
    <BS.Grid className="dashboard">
      <AppNav params={params} />
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

export default connect(state => ({
  projects: state.projects,
  user: state.user.info,
  filter: state.filter,
}))(Dashboard)

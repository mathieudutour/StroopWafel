import React from 'react'
import { Link } from 'react-router'
import { selectors } from '../redux/ducks/filter'

export default function RepoInfos({ repoInfos, filters }) {
  if (!repoInfos || !repoInfos.length) {
    return null
  }
  // Grab the 1st repo
  const [{ repoOwner, repoName }] = repoInfos
  let repoNameItems
  if (repoInfos.length === 1) {
    if (filters) {
      repoNameItems = (
        <Link to={filters.url()} className="repo-name">
          {repoName}
        </Link>
      )
    } else {
      repoNameItems = <span className="repo-name">{repoName}</span>
    }
  } else {
    repoNameItems = repoInfos.map((repoInfo, index) => {
      const key = repoInfo.repoName + repoInfo.repoOwner

      if (filters) {
        const currentRepoInfos = [repoInfo]

        const repoLink = new selectors.FilterBuilder(
          filters.state,
          currentRepoInfos
        ).url()
        return (
          <span key={key} className="repo-name-wrap">
            {(index !== 0 && '&') || null}
            {/* Put an & between repo names */}
            <Link to={repoLink} className="repo-name">
              {repoInfo.repoName}
            </Link>
          </span>
        )
      }

      return (
        <span key={key} className="repo-name-wrap">
          {(index !== 0 && '&') || null}
          {/* Put an & between repo names */}
          <span className="repo-name">{repoInfo.repoName}</span>
        </span>
      )
    })
  }
  return (
    <li className="repo-links">
      <span className="repo-owner">{repoOwner}</span>
      {'/'}
      {repoNameItems}
    </li>
  )
}

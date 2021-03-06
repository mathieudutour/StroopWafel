import React from 'react'
import classnames from 'classnames'
import { GitPullRequestIcon } from 'react-octicons'

const IssueOrPullRequestBlurb = ({
  card,
  primaryRepoName,
  primaryRepoOwner,
  context,
  href,
}) => {
  const { issue, repoName, repoOwner } = card

  let multipleRepoName = null

  if (primaryRepoOwner !== repoOwner) {
    multipleRepoName = `${repoOwner}/${repoName}`
  } else if (primaryRepoName !== repoName) {
    multipleRepoName = repoName
  }

  let blurbContext
  if (context) {
    blurbContext = <span className="blurb-context">{context}</span>
  }

  if (issue) {
    const isPullRequest = card.isPullRequest() || issue.base // use .base in case we are given the PR JSON (which does not contain labels)

    let icon = null
    if (isPullRequest) {
      let { state } = issue
      if (card.isPullRequestMerged()) {
        state = 'merged'
      }
      icon = (
        <GitPullRequestIcon
          title="Click for Pull Request Details"
          className="blurb-icon"
          data-state={state}
        />
      )
    }

    const classes = {
      'issue-blurb': true,
      'is-pull-request': isPullRequest,
      'is-merged': card.isPullRequestMerged(),
    }

    return (
      <span className={classnames(classes)}>
        <a
          className="blurb-number-link"
          target="_blank"
          href={href || issue.htmlUrl}
        >
          {icon}
          <span className="blurb-secondary-repo">{multipleRepoName}</span>
          <span className="blurb-number">#{card.number}</span>
        </a>
        {blurbContext}
      </span>
    )
  }
  // no Issue found
  return (
    <span className="issue-blurb">
      <a className="blurb-number-link" target="_blank" href={href}>
        <span className="blurb-secondary-repo">{multipleRepoName}</span>
        <span className="blurb-number">#{card.number}</span>
      </a>
      {blurbContext}
    </span>
  )
}

export default IssueOrPullRequestBlurb

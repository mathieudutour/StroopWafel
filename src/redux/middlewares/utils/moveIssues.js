import { KANBAN_LABEL, UNCATEGORIZED_NAME } from '../../../helpers'

export function getNewLabels(card, label) {
  // Find all the labels, remove the kanbanLabel
  const labels = card.issue.labels.filter(_label => {
    return UNCATEGORIZED_NAME !== _label.name && !KANBAN_LABEL.test(_label.name)
  })

  if (label && UNCATEGORIZED_NAME !== label.name) {
    labels.push(label) // that's the label we want to add
  }

  return labels
}

export function getNewAssignees(card, newAssignee, oldAssignee) {
  // Find all the assignes and remove the assignees we are messing with
  const assignees = card.issue.assignees.filter(assignee => {
    return (
      (!oldAssignee || assignee.login !== oldAssignee.login) &&
      (!newAssignee || assignee.login !== newAssignee.login)
    )
  })

  if (newAssignee) {
    assignees.push(newAssignee)
  }

  return assignees
}

export default function moveIssues(
  githubClient,
  cards,
  { label, milestone, user, oldUser }
) {
  return githubClient.getOcto().then(({ repos }) => {
    return Promise.all(
      cards.map(card => {
        if (label || label === null) {
          const labels = getNewLabels(card, label)
          const labelNames = labels.map(x => x.name)

          return repos(card.repoOwner, card.repoName)
            .issues(card.issue.number)
            .update({ labels: labelNames })
        } else if (user || user === null) {
          const assignees = getNewAssignees(card, user, oldUser)

          return repos(card.repoOwner, card.repoName)
            .issues(card.issue.number)
            .update({ assignees: assignees.map(u => u.login) })
        } else if (milestone) {
          return repos(card.repoOwner, card.repoName)
            .milestones.fetchAll()
            .then(milestones => {
              // Find the milestone with a matching Title
              const matchingMilestone = milestones.find(_milestone => {
                return _milestone.title === milestone.title
              })

              if (matchingMilestone) {
                return repos(card.repoOwner, card.repoName)
                  .issues(card.issue.number)
                  .update({ milestone: matchingMilestone.number })
              } else {
                const error = `It seems the target repository (${
                  card.repoOwner
                }/${card.repoName}) does not have a matching milestone ${
                  milestone.title
                } to move the Issue(s) to. Please create the milestone manually for now`
                alert(error)
                throw new Error(error)
              }
            })
        } else if (milestone === null) {
          return repos(card.repoOwner, card.repoName)
            .issues(card.issue.number)
            .update({ milestone: null })
        }
      })
    )
  })
}

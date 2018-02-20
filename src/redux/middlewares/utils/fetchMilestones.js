export default function fetchMilestones(githubClient, repoOwner, repoName) {
  return githubClient
    .getOcto()
    .then(({ repos }) => repos(repoOwner, repoName).milestones.fetchAll())
}

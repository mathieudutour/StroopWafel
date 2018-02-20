# StroopWafel

_Serverless Kanban Board for GitHub Issues_

Why waste time and money paying for a Ticket Tracker when you already work in GitHub? Now, you don't have to.

<img width="1485" alt="screen shot 2018-02-20 at 15 39 05" src="https://user-images.githubusercontent.com/3254314/36427008-97edb32c-1654-11e8-9c12-11daa54c0a7d.png">

* [Features](#features)
  * [Multiple Repositories](#multiple-repositories)
  * [Linked Issues and Pull Requests](#linked-issues-and-pull-requests)
  * [Filtering](#filtering)
  * [Milestone Planning](#milestone-planning)
  * [Moving Cards](#moving-cards)
  * [Task Lists](#task-lists)
  * [CI Status and Merge Conflict](#ci-status-and-merge-conflict)
  * [Issue Images](#issue-images)
  * [Pull Request to non-default branch](#pull-request-to-non-default-branch)
  * [Burnup Chart](#burnup-chart)
* [Development](#development)

## Features

### Multiple Repositories

Multiple Repositories in an organization can be shown on a board (from different organizations too!). The repository is shown in gray next to the Issue number.

![image](https://cloud.githubusercontent.com/assets/253202/13621991/70bb1312-e569-11e5-86ef-82372752fbff.png)

### Linked Issues and Pull Requests

Just add `#123` or `orgName/RepoName#123` to the Issue or Pull Request body and linked Issues will show up with the column they are in, both below the Card and in the preview popup.

![image](https://cloud.githubusercontent.com/assets/253202/13620658/63f99478-e55f-11e5-8e9f-9babcfb69a29.png)

### Filtering

* cards can be filtered by label, milestone, board column, or user
* filters can be inclusive as well as exclusive

![filters](https://cloud.githubusercontent.com/assets/253202/13621706/958fafec-e567-11e5-9411-405de7f34664.gif)

### Milestone Planning

When doing Milestone (or Sprint) planning there is a view to easily move cards into milestones

![milestone-planning](https://cloud.githubusercontent.com/assets/253202/13621710/9e763c98-e567-11e5-95bd-6473ffedd0ef.gif)

### Moving Cards

Cards can be dragged from one column to the next

![moving-cards](https://cloud.githubusercontent.com/assets/253202/13621716/a4ea20f8-e567-11e5-9150-795f1acf89e9.gif)

### Task Lists

By using the `- [ ]` notation in the body of an Issue or Pull Request, the progress of an Issue is shown in the top-right corner of a Card.

![task-lists](https://cloud.githubusercontent.com/assets/253202/13621813/523b1438-e568-11e5-997f-5f5014456783.gif)

<!--
![task-lists](https://cloud.githubusercontent.com/assets/253202/13621722/ae9fff82-e567-11e5-93bd-96a6c0330e07.gif) -->

### CI Status and Merge Conflict

* CI Status shows up as a green :heavy_check_mark: or a red :x: on the top-right corner of a card
* Merge conflicts are shown with a yellow :warning: and have a diagonal striped background

<!-- ![image](https://cloud.githubusercontent.com/assets/253202/13620679/862188ee-e55f-11e5-831f-f5059c18d3ac.png) -->

![image](https://cloud.githubusercontent.com/assets/253202/13621863/bac1f62a-e568-11e5-9761-ce41c84b4eef.png)

![image](https://cloud.githubusercontent.com/assets/253202/13621876/d1bcfeb0-e568-11e5-8a73-c5ef61645a88.png)

![image](https://cloud.githubusercontent.com/assets/253202/13621905/dfee5920-e568-11e5-94df-98a887f63d24.png)

### Burnup Chart

[Why Burnup instead of Burndown?](http://brodzinski.com/2012/10/burn-up-better-burn-down.html)

Shows a burnup chart for a Milestone (ie "Sprint" or "Iteration"). If you use select multiple repositories it will include all of them.

It also skips when nothing was opened or closed that day/month/year (useful to see weekends or holidays).

![burnup-chart](https://cloud.githubusercontent.com/assets/253202/14406693/5e05c870-fe7d-11e5-9564-ecddb08ebe0d.png)

### Issue Image

If an Issue or Pull Request contains an image then it will be shown in the Issue

![image](https://cloud.githubusercontent.com/assets/253202/14223380/bbc026c2-f84c-11e5-9ccb-639f62aaf6d7.png)

### Pull Request to non-default branch

Sometimes Pull Requests go to a branch other than the main branch. This makes it clear when that happens.

![image](https://cloud.githubusercontent.com/assets/253202/14266496/ac9581b4-fa96-11e5-9991-d15a146f1e3b.png)

## Development

* `npm start` to start up the dev server and go to `http://localhost:8080`

### How Does it Work

* JavaScript calls the GitHub API and pulls in the Issues for a given repository.
  * Since there is no server to do OAuth, people need to provide a GitHub token which is stored in `localStorage`
* It uses the first repository to get the Issue Labels and Milestones.
* There are special Labels which represent the board columns (in the format `# - Column Title`)
* To be a "Good API Citizen" StroopWafel uses eTags provided by GitHub and saves them in `localStorage` (or `IndexedDB`)

### Hosting your own Forked Version

1. create a fork
2. run `npm run deploy`
3. go to `https://${USERNAME}.github.io/StroopWafel/`

#### To make edits and push them up on GitHub

1. make edits in the src directory in `master`
2. commit your changes
3. run `npm run deploy`

#### To update your fork with the upstream (this repo)

1. `git pull https://github.com/mathieudutour/StroopWafel.git master`
2. run `npm run deploy`

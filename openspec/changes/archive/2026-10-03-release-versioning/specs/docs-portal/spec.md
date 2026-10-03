## MODIFIED Requirements

### Requirement: Pull requests validate the site and `develop` deploys it

A GitHub Actions workflow SHALL run `pnpm portal:build` on every pull request,
on every push to `develop`, and when dispatched on `develop` (which the release
workflow does after publishing a release). It SHALL check out the full history
with tags, so the changelog sees every version. A run triggered by a pull
request SHALL NOT deploy. A run on `develop` triggered by a push or a dispatch
SHALL upload `docs-portal/dist/` and deploy it to GitHub Pages through the
`github-pages` environment. Deployments SHALL NOT cancel one another; a newer
pull-request run for the same branch SHALL cancel the older one.

#### Scenario: A pull request with a broken Storybook
- **WHEN** a pull request breaks the Storybook build
- **THEN** the workflow's build job fails on that pull request and nothing is deployed

#### Scenario: A merge into develop
- **WHEN** a pull request is merged into `develop`
- **THEN** the workflow builds the site and deploys it, and the deployed site reflects the merged commit

#### Scenario: A release asks for a redeploy
- **WHEN** the release workflow dispatches the docs portal workflow on `develop`
- **THEN** the site is built from `develop` with the new tag and deployed

#### Scenario: Pull requests never deploy
- **WHEN** the workflow file is read
- **THEN** its deploy job runs only on `develop`, and never for a pull request

# release-versioning Specification

## Purpose
Define how a release of English Course is named and published: every push to `main` gets the next SemVer version from git-cliff (`feat` bumps the minor, anything else the patch, staying in `0.x`), a tag on the released `develop` commit, and a GitHub Release with generated notes, after which the docs portal is redeployed. It also records the history tags `v0.1.0`–`v0.5.0`. Merging the `release: …` pull request stays the only manual step.
## Requirements
### Requirement: Every release to main is versioned and published

A GitHub Actions workflow SHALL run on every push to `main`. It SHALL compute
the next version with `git-cliff --bumped-version`, tag the released commit
with it, push the tag, and create a GitHub Release named after the tag whose
notes are the changelog of that version without the page header. When the
push brings no new conventional commits since the last tag (the computed
version equals the latest tag) or the released commit already carries a
version tag, it SHALL create nothing.

#### Scenario: Merging a release pull request
- **WHEN** a `release: …` pull request from `develop` is merged into `main` and its commits include a `feat`
- **THEN** a tag one minor above the previous release is pushed and a GitHub Release with that version's notes is published

#### Scenario: Nothing new to release
- **WHEN** the workflow runs on a `main` whose released commit already carries the latest version tag
- **THEN** no tag and no release are created, and the run succeeds

### Requirement: The tag marks the released develop commit

When the push to `main` is a merge commit, the tag SHALL be placed on its
second parent — the `develop` commit that was released — so the tag is
reachable from both `main` and `develop`. When it is not a merge, the tag
SHALL be placed on the pushed commit.

#### Scenario: A release merge
- **WHEN** the release pull request's merge commit lands on `main`
- **THEN** the new tag points at the merge's second parent, and `git describe --tags` on `develop` names it

### Requirement: Versions follow SemVer in 0.x

Version tags SHALL be `v<major>.<minor>.<patch>`. A release containing a
`feat` commit SHALL bump the minor; otherwise the patch. A breaking change
SHALL bump the minor while the major is `0`. `cliff.toml` SHALL hold these
rules.

#### Scenario: A fixes-only release
- **WHEN** the commits since `v0.5.0` are only `fix`, `refactor` and `test`
- **THEN** the computed version is `v0.5.1`

### Requirement: Past releases are tagged

The repository SHALL carry `v0.1.0` on the `main` tip before release pull
request #73, and `v0.2.0`, `v0.3.0`, `v0.4.0` and `v0.5.0` on the released
`develop` commits of #73, #81, #85 and #98, each with a GitHub Release.

#### Scenario: Listing the releases
- **WHEN** the repository's releases are listed
- **THEN** `v0.1.0` through `v0.5.0` appear, `v0.5.0` the latest

### Requirement: A release redeploys the docs portal

After publishing a release, the workflow SHALL dispatch the docs portal
workflow on `develop`, so the changelog page moves the released commits out
of "Unreleased". (A tag pushed with the workflow's own token does not trigger
other workflows by itself.)

#### Scenario: The changelog catches up
- **WHEN** a release is published
- **THEN** the docs portal workflow runs on `develop` and the deployed changelog lists the new version


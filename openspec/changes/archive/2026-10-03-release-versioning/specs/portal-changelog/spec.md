## ADDED Requirements

### Requirement: The portal has a changelog generated from history

`pnpm portal:changelog` SHALL write the portal page
`docs-portal/src/content/docs/changelog.md` with git-cliff from the repository
history: first an **Unreleased** section for commits after the latest version
tag, then one section per version tag, newest first, each headed by the
version and its date. The page SHALL be generated, ignored by git and never
edited by hand. `pnpm portal:build` SHALL generate it before building the
portal, and the sidebar SHALL link it as "Changelog".

#### Scenario: Unreleased work on develop
- **WHEN** `develop` holds commits after the latest version tag and the portal is built
- **THEN** the changelog's first section is "Unreleased" and lists them

#### Scenario: A version's section
- **WHEN** the changelog is read after `v0.5.0` exists
- **THEN** a `v0.5.0` section dated with its tagged commit lists the commits between `v0.4.0` and `v0.5.0`

### Requirement: Entries read as product changes

Each section SHALL group its commits by type in a fixed order — Features,
Fixes, Performance, Refactoring, Documentation, Tests, Build, CI, Chores — and
list each as its scope in bold followed by its summary, with the gitmoji code
removed and the short hash linked to the commit on GitHub. Commits that are
not Conventional Commits (such as pull-request merges) and `docs(openspec)`
commits SHALL be left out.

#### Scenario: A feature entry
- **WHEN** the commit `feat(enrollment-welcome): :sparkles: welcome the learner on enrolling from the course page` is listed
- **THEN** it appears under Features as **enrollment-welcome:** welcome the learner on enrolling from the course page, with no `:sparkles:`

#### Scenario: Merges and OpenSpec bookkeeping stay out
- **WHEN** the changelog is generated
- **THEN** no "Merge pull request" line and no `docs(openspec)` commit appears

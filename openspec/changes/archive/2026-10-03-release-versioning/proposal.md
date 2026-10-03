## Why

Production is whatever the last `release: …` pull request merged into `main`
— #73, #81, #85 and #98 so far — but none of those releases has a name. There
is no way to say which version is live, what changed between two releases, or
what is waiting in `develop`. Every commit already follows Conventional
Commits (enforced by commitlint), so the versions and their notes can be
derived from history instead of written by hand.

## What Changes

- **Version every release automatically.** A new workflow runs on every push
  to `main`: it computes the next SemVer version with git-cliff from the
  commits since the last release (`feat` → minor, otherwise patch, staying in
  `0.x`), tags the released commit, and publishes a GitHub Release with
  generated notes. Merging the release pull request stays the only manual
  step.
- **Tag the released `develop` commit, not the merge.** Release merges exist
  only on `main`; their second parent — the `develop` tip that was released —
  is in both branches, so the tag is visible from `develop` too.
- **Tag the past.** One-off: `v0.1.0` for everything before the release flow
  (the `main` tip before #73), then `v0.2.0` (#73), `v0.3.0` (#81), `v0.4.0`
  (#85) and `v0.5.0` (#98), each with its GitHub Release.
- **Changelog in the docs portal.** `/changelog/` lists every release and,
  first, an **Unreleased** section with what `develop` holds beyond the last
  release. It is generated at build time, so it is never edited by hand.
- **Redeploy the portal after a release,** so the new version leaves
  "Unreleased" without waiting for the next merge into `develop`.
- **The API reference names the real version.** Its version badge reads
  `git describe --tags` (e.g. `v0.5.0-12-gabc1234`) instead of
  `package.json`'s `0.1.0`, which never changes.

## Capabilities

### New Capabilities

- `release-versioning`: how a release is versioned, tagged and published, the
  bump rules, and the history tags.
- `portal-changelog`: the docs portal's changelog page, how it is generated
  from history, and what it shows.

### Modified Capabilities

- `docs-portal`: the workflow also deploys when the release workflow asks it
  to, and checks out full history so the changelog sees every tag.
- `api-reference-theme`: the home page's version badge shows the release
  version from git, falling back to the package version.

## Non-goals

- Bumping `package.json`'s `version` or committing anything to `main` from
  CI. The version lives in the tag only.
- A `CHANGELOG.md` committed to the repository.
- Pre-releases, release candidates or `1.0.0`. Breaking changes bump the minor
  while in `0.x`.
- Versioning anything other than the app (the portal is not versioned).
- Changing how releases are prepared: the `release: …` pull request from
  `develop` to `main` stays as it is.

## Impact

- **New dependency:** `git-cliff` (dev), with `cliff.toml` at the root.
- **New workflow:** `.github/workflows/release.yml` (`contents: write` to push
  tags and create releases, `actions: write` to dispatch the portal).
- **`docs-portal.yml`:** full-history checkout and a `workflow_dispatch`
  trigger that deploys from `develop`.
- **Portal:** a generated, gitignored `changelog.md` page and a sidebar link.
- **TypeDoc theme:** `scripts/typedoc-cinema-theme/` reads the version from
  git.
- **GitHub:** five tags and five GitHub Releases created once.

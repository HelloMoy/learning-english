## Context

- Releases are `release: …` pull requests from `develop` into `main`, merged
  with a merge commit (#73, #81, #85, #98). Before #73, feature pull requests
  went straight to `main`; `develop` was cut from `main` at #69's merge
  (`b38ea2c`).
- Release merges exist only on `main`; `main` is never merged back into
  `develop`. Each merge's **second parent** — the `develop` tip it released
  (`e4b4394`, `a2fcb8d`, `7c2357d`, `c2c64b5`) — is an ancestor of both
  branches.
- commitlint enforces `type(scope): :gitmoji: summary`; 688 of 795 commits
  follow it, the rest are pull-request merges.
- The docs portal builds from `develop` with a shallow checkout; the API
  reference shows `v0.1.0` from `package.json`, which never changes.
- No tags or GitHub Releases exist.

## Goals / Non-Goals

**Goals:** releases named and published without a manual step; history
tagged; a changelog in the portal with an Unreleased section; the API
reference naming the real version.

**Non-Goals:** see the proposal — no version commits to `main`, no committed
`CHANGELOG.md`, no pre-releases, no change to how releases are prepared.

## Decisions

### 1. git-cliff, configured once in `cliff.toml`

`git-cliff` (npm, dev dependency; the package ships the binary) reads
`cliff.toml` at the root, used by the release workflow, the portal and the
history tags alike:

- `[git]` — `conventional_commits = true`, `filter_unconventional = true`
  (drops pull-request merges), `tag_pattern = "v[0-9].*"`, a
  `commit_preprocessor` that removes the `:gitmoji: ` after the type and scope,
  and `commit_parsers` that skip `docs(openspec)` and map each type to an
  ordered group (an HTML comment prefix fixes the order and is stripped in the
  template).
- `[bump]` — `features_always_bump_minor = true`,
  `breaking_always_bump_major = false` (breaking → minor while in `0.x`).
- `[changelog]` — the header is the Starlight front matter of the portal page;
  the body renders `## <version> — <date>` (or `## Unreleased`), then
  `### <Group>` with `- **scope:** summary ([hash](commit URL))`.

GitHub Release notes reuse the same template with `--strip header`, so the
front matter never reaches them.

### 2. Release workflow: `.github/workflows/release.yml`

On `push` to `main` (concurrency group `release`, never cancelled):

1. Checkout with `fetch-depth: 0`, install, then:
2. `released=$(git rev-parse HEAD^2 2>/dev/null || git rev-parse HEAD)` — a
   release merge's second parent is the released `develop` commit; anything
   else tags itself.
3. `version=$(pnpm exec git-cliff --bumped-version)`; stop with success if
   `released` already carries a `v*` tag, or if `version` equals
   `git describe --tags --abbrev=0` (nothing to release).
4. `notes=$(pnpm exec git-cliff --unreleased --tag "$version" --strip header)`
5. `git tag "$version" "$released" && git push origin "$version"`
6. `gh release create "$version" --title "$version" --notes "$notes" --latest`
7. `gh workflow run docs-portal.yml --ref develop`

Permissions: `contents: write` (tag, release) and `actions: write`
(dispatch). Lightweight tags avoid configuring a committer identity.

**Why tag the second parent:** a tag on the merge commit is invisible from
`develop`, so the portal — built from `develop` — would list all history as
Unreleased. The second parent is exactly the tree that was released.

**Why dispatch the portal:** events created with the workflow's
`GITHUB_TOKEN` (the tag push) do not start other workflows; a
`workflow_dispatch` is the documented exception.

### 3. History tags, created once

| Tag | Commit | Release |
| --- | --- | --- |
| `v0.1.0` | `b38ea2c` (main before #73) | everything up to the legal pages |
| `v0.2.0` | `e4b4394` | #73 |
| `v0.3.0` | `a2fcb8d` | #81 |
| `v0.4.0` | `7c2357d` | #85 |
| `v0.5.0` | `c2c64b5` | #98 |

Each gets a GitHub Release with `git-cliff <prev>..<tag> --strip header`
notes, created oldest first, `v0.5.0` marked latest. Every release brought
features, so consecutive minors match what the bump rules would have chosen.

### 4. The portal page

`portal:changelog` = `git-cliff --output docs-portal/src/content/docs/changelog.md`,
run by `portal:build` after the email gallery and before Astro. Gitignored and
Prettier-ignored. Sidebar: `{ label: "Changelog", link: "/changelog/" }`.
`docs-portal.yml` checks out with `fetch-depth: 0` (tags included) and gains
`workflow_dispatch`; the artifact upload and the deploy job run when
`github.ref == 'refs/heads/develop' && github.event_name != 'pull_request'`.

### 5. The API reference's version

The TypeDoc plugin listens to the converter's resolve-end event and sets
`project.packageVersion` to the release version when git reports one:
`git describe --tags --match "v[0-9]*"` → `v0.5.0-12-gabc1234`, leading `v`
dropped because the badge adds it. A pure `releaseVersionFrom(describe)`
carries the parsing; the plugin only runs git and falls back silently to the
package version when git or tags are missing (a tarball, a shallow clone).

## Risks / Trade-offs

- **A hotfix pushed straight to `main`** is tagged on itself and is not in
  `develop` → the portal will not see that tag until `main` is merged into
  `develop`. Releases have never done this; noted, not solved.
- **The release workflow cannot be fully exercised before merge** → its
  decision logic is rehearsed locally on a throwaway merge of `develop` into
  `main` (computed version, notes, tag target) without pushing; contract tests
  pin the workflow.
- **Tags are pushed before this change merges** → harmless: nothing reads
  them until the portal and the release workflow do.
- **`--bumped-version` with no conventional commits** returns the latest tag →
  that is the skip condition.

## Testing strategy

- **Vitest unit (node), `src/deployment/release.test.ts`** — mirrors
  `deployment.test.ts`: the release workflow's trigger, permissions,
  second-parent target, skip guard, release creation and portal dispatch;
  `cliff.toml`'s bump rules; the `portal:changelog` script and its place in
  `portal:build`; the sidebar link and ignores.
- **Vitest integration (node), `src/deployment/cliff.test.ts`** — runs
  `git-cliff` with the real `cliff.toml` against a throwaway git repository
  built in a temp dir (repeatable, independent of this repo's tags): a fixes-only
  history bumps the patch, a `feat` bumps the minor, gitmoji are removed,
  merges and `docs(openspec)` are dropped, groups follow the fixed order, an
  Unreleased section precedes the tagged ones.
- **Vitest unit, `scripts/typedoc-cinema-theme/release-version.test.ts`** —
  `releaseVersionFrom` for a tag, a tag plus commits, and empty output.
- **`src/deployment/docs-portal.test.ts`** — update the workflow assertions
  (dispatch trigger, full history, deploy condition, build steps).
- **Visual check** — Playwright MCP on `pnpm portal:preview`: the changelog
  page and the API badge.
- **Rehearsal** — the release steps on a local throwaway merge.

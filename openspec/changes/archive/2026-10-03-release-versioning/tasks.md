## 1. git-cliff configuration

- [x] 1.1 Add `git-cliff` as a dev dependency (check `package.json` for a stray package afterwards)
- [x] 1.2 (TDD: test → impl) In `src/deployment/cliff.test.ts`, against a throwaway repository: a fixes-only history bumps the patch, a `feat` bumps the minor, a breaking change bumps the minor in `0.x`; write the `[bump]` section of `cliff.toml`
- [x] 1.3 (TDD: test → impl) Same harness: gitmoji removed, scope in bold, short hash linked, merges and `docs(openspec)` dropped, groups in the fixed order, Unreleased before tagged versions, front matter only in the header; write `[git]` and `[changelog]`

## 2. Changelog page

- [x] 2.1 (TDD: test → impl) In `docs-portal.test.ts`, assert `portal:changelog`, its place in `portal:build` (after the emails, before Astro), the "Changelog" sidebar link and the ignored `changelog.md`; implement the script, sidebar entry and ignores

## 3. API reference version

- [x] 3.1 (TDD: test → impl) `releaseVersionFrom(describe)` returns the version without its `v` for a tag and for a tag plus commits, and nothing for empty output
- [x] 3.2 (TDD: test → impl) The plugin sets `project.packageVersion` from git on resolve end, keeping the package version when git has none

## 4. Workflows

- [x] 4.1 (TDD: test → impl) In `src/deployment/release.test.ts`, pin `release.yml`: push to `main`, full history, `contents: write` + `actions: write`, second-parent target, skip guard, tag push, `gh release create`, portal dispatch; write the workflow
- [x] 4.2 (TDD: test → impl) In `docs-portal.test.ts`, pin `workflow_dispatch`, `fetch-depth: 0` and the deploy/upload condition on `develop` outside pull requests; update `docs-portal.yml`

## 5. History tags

- [x] 5.1 Create and push `v0.1.0`–`v0.5.0` on the commits in the design's table, and a GitHub Release for each with `git-cliff <prev>..<tag> --strip header` notes, `v0.5.0` latest

## 6. Verification

- [x] 6.1 Rehearse the release steps on a local throwaway merge of `develop` into `main` (version, notes, target) without pushing
- [x] 6.2 Run `pnpm portal:build`; check the changelog page and the API badge with Playwright MCP
- [x] 6.3 Run `pnpm verify`

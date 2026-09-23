## 1. Resolve the merge

- [x] 1.1 Resolve `src/app/[locale]/layout.tsx`: keep both imports (`LearnerStateSeed` from develop, `SiteFooter` from main). The JSX mount point did not conflict.
- [x] 1.2 Resolve `src/messages/{en,es,pt}.json`: keep both sides — develop's auth-era namespaces and main's `Legal`. Confirm `Components.SiteFooter` survived the automatic merge in all three.
- [x] 1.3 Commit the merge.

## 2. Groundwork

- [x] 2.1 Answered: it asserts **contents**, not shape — `expect(listed.sort()).toEqual(["/en", "/es", "/pt"])`. Task 4 is required.
- [x] 2.2 Ran `pnpm verify` on the merged tree: 324 files, 2730 tests, all green. The footer broke nothing on develop. Note for the CI work: the `provider destroyed` rejection did NOT reproduce locally. Run `pnpm verify` on the merged tree **before** touching the sitemap, so any failure caused by the footer is attributed to the merge rather than to this change.

## 3. Sitemap

- [x] 3.1 (TDD: test → impl) Extend `src/app/sitemap.test.ts`: the sitemap lists `/privacy` and `/terms` once per supported locale.
- [x] 3.2 (TDD: test → impl) Same file: the English privacy entry declares the `en`, `es` and `pt` privacy URLs.
- [x] 3.3 (TDD: test → impl) Same file: exactly three entries per supported locale — the guard against a personal route being added to the tuple.
- [x] 3.4 Rewrite `src/app/sitemap.ts` to map over `routing.locales` crossed with a `PUBLIC_PATHS` tuple, keeping `absolute()` and its home special case.
- [x] 3.5 Confirm the two pre-existing tests — no course URL, no personal or account route — still pass untouched.

## 4. End-to-end, only if task 2.1 says so

- [x] 4.1 (TDD: test → impl) If `e2e/search-discoverability.spec.ts` asserts sitemap contents, update it to expect the three public paths.

## 5. Verification

- [x] 5.1 Ran `pnpm verify`: 324 files, 2733 tests green. One intermittent failure appeared in `smtp-email-sender.test.ts` under full-suite load and vanished on rerun and in isolation — a testcontainers contention flake, the same family as CI's `provider destroyed`, recorded for the CI change rather than fixed here. Run `pnpm verify` and fix every failure at its root — no `@ts-ignore`, no rule disabling.
- [x] 5.2 Ran `search-discoverability` and `legal-pages` on chromium: 18/18. Run the e2e suites the merge could have disturbed, at minimum `search-discoverability` and one that renders a full page, against a local server.
- [ ] 5.3 Open the PR against `develop`, and report which CI failures are pre-existing versus caused here — the branch's CI is red for unrelated reasons.

## 1. Resolve the merge

- [ ] 1.1 Resolve `src/app/[locale]/layout.tsx`: keep both imports (`LearnerStateSeed` from develop, `SiteFooter` from main). The JSX mount point did not conflict.
- [ ] 1.2 Resolve `src/messages/{en,es,pt}.json`: keep both sides — develop's auth-era namespaces and main's `Legal`. Confirm `Components.SiteFooter` survived the automatic merge in all three.
- [ ] 1.3 Commit the merge.

## 2. Groundwork

- [ ] 2.1 Read `e2e/search-discoverability.spec.ts` and record whether it asserts the sitemap's contents or only its shape — the design's open question, and it decides whether task 4 exists.
- [ ] 2.2 Run `pnpm verify` on the merged tree **before** touching the sitemap, so any failure caused by the footer is attributed to the merge rather than to this change.

## 3. Sitemap

- [ ] 3.1 (TDD: test → impl) Extend `src/app/sitemap.test.ts`: the sitemap lists `/privacy` and `/terms` once per supported locale.
- [ ] 3.2 (TDD: test → impl) Same file: the English privacy entry declares the `en`, `es` and `pt` privacy URLs.
- [ ] 3.3 (TDD: test → impl) Same file: exactly three entries per supported locale — the guard against a personal route being added to the tuple.
- [ ] 3.4 Rewrite `src/app/sitemap.ts` to map over `routing.locales` crossed with a `PUBLIC_PATHS` tuple, keeping `absolute()` and its home special case.
- [ ] 3.5 Confirm the two pre-existing tests — no course URL, no personal or account route — still pass untouched.

## 4. End-to-end, only if task 2.1 says so

- [ ] 4.1 (TDD: test → impl) If `e2e/search-discoverability.spec.ts` asserts sitemap contents, update it to expect the three public paths.

## 5. Verification

- [ ] 5.1 Run `pnpm verify` and fix every failure at its root — no `@ts-ignore`, no rule disabling.
- [ ] 5.2 Run the e2e suites the merge could have disturbed, at minimum `search-discoverability` and one that renders a full page, against a local server.
- [ ] 5.3 Open the PR against `develop`, and report which CI failures are pre-existing versus caused here — the branch's CI is red for unrelated reasons.

## 1. Groundwork

- [x] 1.1 Read `src/messages/messages.test.ts` and record whether locale parity is enforced structurally or against a fixed namespace list — the design's first open question, and it decides task 2.3.
- [x] 1.2 Confirm the branch is based on `origin/main` and that `src/app/sitemap.ts` stays untouched for the whole change.

## 2. Translations

- [x] 2.1 Draft the `Legal.privacy` section copy in `en`, covering exactly the subjects the spec requires — accounts, learning data in Turso, transactional mail via Resend, Turnstile bot scoring, Sentry reports with addresses and bodies stripped, and account deletion. Nothing the service does not do.
- [x] 2.2 Draft the `Legal.terms` section copy in `en`, plus `Components.SiteFooter` labels.
- [x] 2.3 Translate both namespaces into `es` and `pt`. (TDD: test → impl) Task 1.1 found parity is enforced structurally by `keyPaths`, so adding `Legal.*` to `en.json` alone already fails `messages.test.ts` — that is the red. No extension needed. Note: a sibling test bans the words season/temporada/episode/episodio/episódio in any string.

## 3. Legal document component

- [x] 3.1 (TDD: test → impl) `legal-document.test.tsx`: renders the title as the page heading, one `<section>` per supplied section with its heading and body, in the order given.
- [x] 3.2 (TDD: test → impl) Same file: the last-updated date renders through next-intl's `format.dateTime` for the active locale, not as a fixed string — assert the `pt` rendering differs from a hardcoded `en` order.
- [x] 3.3 Add `legal-document.stories.tsx` with a default story and one per locale via `parameters.locale`; never mock `next-intl`.
- [x] 3.4 Add JSDoc to the component and its props per `jsdoc-typescript-docs`.

## 4. Site footer

- [x] 4.1 (TDD: test → impl) `site-footer.test.tsx`: renders a `contentinfo` landmark containing a privacy link and a terms link.
- [x] 4.2 (TDD: test → impl) Same file: the labels translate in all three locales. The locale *prefix* cannot be asserted here — next-intl resolves it from the router context, which jsdom lacks, so every locale-aware Link renders its bare href (`Brand` asserts `/` for the same reason). The prefix moves to e2e, task 6.2.
- [x] 4.3 Add `site-footer.stories.tsx` and JSDoc.
- [x] 4.4 Mount `<SiteFooter />` in `src/app/[locale]/layout.tsx`, after the `flex-1` children wrapper and outside `main`.

## 5. Routes

- [x] 5.1 (TDD: test → impl) Create `src/app/[locale]/privacy/page.tsx` rendering `LegalDocument` from the `Legal.privacy` namespace, with `generateMetadata` setting a translated title and description.
- [x] 5.2 (TDD: test → impl) Create `src/app/[locale]/terms/page.tsx` the same way from `Legal.terms`.
- [x] 5.3 Verified: `main` carries no session or onboarding guard at all — there is no auth on this branch — so both routes are public by construction. The e2e in task 6.1 asserts it rather than assuming it.

## 6. End-to-end

- [x] 6.1 (TDD: test → impl) `/en/privacy` and `/es/terms` return their content to a request with no session cookie, rather than redirecting or 404ing.
- [x] 6.2 (TDD: test → impl) The footer link reaches the privacy page from the home and keeps the locale prefix.

## 7. Verification

- [x] 7.1 Run `pnpm verify` (typecheck, format, lint, unit + component tests) and fix every failure at its root — no `@ts-ignore`, no rule disabling.
- [x] 7.2 Run `pnpm test:e2e --project=chromium` for the touched specs.
- [x] 7.3 Review both pages in the browser with Playwright MCP in `en`, `es` and `pt`, light and dark, at mobile and desktop widths — never hand a visual check back to the user.
- [ ] 7.4 Surface the drafted legal copy to the project owner for review, per the proposal's non-goal on legal review.

## 8. Release and follow-up

- [x] 8.0 **Release blocker**: make `privacy@english-course.online` receive mail. Both documents print it as the contact address, and the apex has no MX today, so every message to it bounces. Resolved 2026-09-22 with ImprovMX free forwarding: two MX records on the apex (mx1/mx2.improvmx.com) forwarding `privacy@` to the owner's inbox. No SPF added at the apex on purpose — ImprovMX's recommended record omits Amazon SES, so publishing it would contradict the Resend sender that already passes. Delivery confirmed end to end.
- [ ] 8.1 Open the PR against `main`, land it, and confirm the Vercel production deploy serves `https://www.english-course.online/en/privacy`.
- [ ] 8.2 Tell the owner the URL is live so the Google consent screen can be published — this is the step the whole change exists to unblock, and it must happen after the deploy.
- [ ] 8.3 Merge `main` into `develop` so the branches do not drift, and confirm `layout.tsx` merged without conflict.
- [ ] 8.4 Open a follow-up change on `develop` adding `/privacy` and `/terms` to the sitemap, with the `search-discoverability` delta this change deliberately left out.

## 1. Setup

- [ ] 1.1 **Owner, in PostHog.** The account exists as of 2026-10-10, organization `english-course`, project `657590`, **US** region (`us.posthog.com`). The code, the policy and the runbook were switched from EU to US to match.
  - [x] Cookieless tracking enabled — done 2026-10-11 through `posthog-cli api` (`cookieless_server_hash_mode: 2`).
  - [x] Session replay enabled — it already was.
  - [x] Console log capture and network capture off — done 2026-10-11 (`capture_console_log_opt_in` and `capture_performance_opt_in` set to `false`).
  - [x] Project token and project ID loaded into Vercel, Preview (`develop`) — done 2026-10-11, and read back. Temporary: there for the verification only, removed in 14.6.
  - [ ] Enable two-factor authentication on the account. Web UI only.
  - [ ] Create a personal API key scoped to persons (read, write) and session recordings (write), and load it into Vercel as `POSTHOG_PERSONAL_API_KEY`, Preview (`develop`). **Before the PR is merged:** with the token set and the key missing, the server environment refuses to start.
  - [x] No card on file, and the free allowances — confirmed 2026-10-11 through `posthog-cli api` (`billing-overview-get`): plan `free`, no subscription, no billing customer; 1,000,000 events and 5,000 recordings a month.
- [x] 1.2 Branch from `develop`: `feat/posthog-product-analytics`.
- [x] 1.3 Add `posthog-js` with `pnpm add posthog-js`. This changes `package.json` and the lockfile; approving this proposal is the approval for it. Check nothing else was added.

## 2. Client options and URL scrubbing (pure logic)

- [x] 2.1 (TDD: test → impl) `src/lib/product-analytics-options/product-analytics-options.test.ts`: without a token `productAnalyticsOptions` returns `null`. Create the module with that behaviour only.
- [x] 2.2 (TDD: test → impl) Same file, one test per row of the table in design decision 3: consent mode, person profiles, host-only secure cookie, recording disabled at start, inputs masked with no request bodies or headers, no console capture, no exception capture, relay path as API host. Type the configuration as the SDK's `PostHogConfig`, so a wrong option name fails `pnpm typecheck`; this settles design open question 1.
- [x] 2.3 (TDD: test → impl) Same file: the `before_send` function turns `…/en/reset-password?token=<secret>` into `…/en/reset-password`, and no value anywhere in the event contains the secret. Hardcode the route; generate the secret with `@faker-js/faker`.
- [x] 2.4 (TDD: test → impl) Same file: a URL nested inside `$set_once` is cleaned; a lesson URL keeps its whole path; an external referrer loses its query string; a value that is not an absolute URL is unchanged.
- [x] 2.5 JSDoc on the exported function, type and constants (`@category Observability`). Walk the `clean-code` checklist.

## 3. The analytics module

- [x] 3.1 (TDD: test → impl) `src/lib/product-analytics/product-analytics.test.ts`: with no client attached, every operation is a no-op and the consent status is `unavailable`. Create the module, its client interface and the fake used by every later test.
- [x] 3.2 (TDD: test → impl) Same file: `captureProductEvent` forwards the name and properties to the client. Add the `ProductEvents` catalogue from design decision 10, with `// @ts-expect-error` cases for an undeclared event and a wrongly typed property.
- [x] 3.3 (TDD: test → impl) Same file: consent — grant, deny and status map to the client's opt-in, opt-out and explicit status.
- [x] 3.4 (TDD: test → impl) Same file: `resetIdentity` leaves a granted choice granted and a denied choice denied.
- [x] 3.5 Add a `no-restricted-imports` entry to `eslint.config.mjs` forbidding `posthog-js` outside `src/lib/product-analytics/` and `src/instrumentation-client.ts`. Changes ESLint configuration; approved with this proposal. Confirm `pnpm lint` fails on a deliberate violation, then remove it.

## 4. Entry point

- [x] 4.1 (TDD: test → impl) `startProductAnalytics(options)` in the analytics module dynamically imports `posthog-js`, initializes it and attaches the client; `src/instrumentation-client.ts` calls it only when `productAnalyticsOptions` returns options. Moved out of the entry point during implementation so it is tested and the SDK has a single importer.

## 5. The relay

- [x] 5.1 (TDD: test → impl) `src/lib/analytics-relay/analytics-relay.test.ts`: a request outside the relay path returns nothing. Create the module, mirroring `session-gate`.
- [x] 5.2 (TDD: test → impl) Same file: a request under the relay path carrying a session cookie and an `Authorization` header is rewritten to the US ingestion host (EU when first written; switched 2026-10-10) with neither header and with `host` set to the upstream.
- [x] 5.3 (TDD: test → impl) Same file: `/static/` and `/array/` paths go to the US asset host; the relay prefix is removed from the forwarded path.
- [x] 5.4 (TDD: test → impl) `src/proxy.ts`: the relay is consulted before `sessionGate`, and the matcher covers the relay path including paths with a dot. Test in the existing proxy test file, or a new `src/proxy.test.ts`.

## 6. Consent

- [x] 6.1 Add the banner copy under `Components.ConsentBanner` and the footer control's label under the footer's namespace, in `src/messages/en.json`, `es.json` and `pt.json`. `messages.test.ts` key parity is the check.
- [x] 6.2 (TDD: test → impl) `src/components/consent-banner/consent-banner.test.tsx`: renders nothing unless the status is `pending`; renders accept, reject and a locale-aware link to the privacy policy when it is.
- [x] 6.3 (TDD: test → impl) Same file: accepting grants consent and hides the banner; rejecting denies it and hides the banner; both buttons are reachable by keyboard and are the same button variant.
- [x] 6.4 `consent-banner.stories.tsx` (`Components/ConsentBanner`), checked in `en`, `es` and `pt` with the toolbar; JSDoc on the component and its props. Follow the `storybook-story-writing` and `jsdoc-typescript-docs` skills.
- [x] 6.5 (TDD: test → impl) `src/components/site-footer/site-footer.test.tsx`: the footer carries a control that reopens the banner, and renders no such control when analytics is unavailable. Update the footer's story.
- [ ] 6.6 Mount the banner in `src/app/[locale]/layout.tsx`, outside `RouteTransition` (done). Verify it in the browser with Playwright MCP, light and dark, at phone width: it must not cover the lesson player's controls or the sign-in form's submit button.

## 7. Identity

- [x] 7.1 (TDD: test → impl) `src/hooks/use-analytics-identity/use-analytics-identity.test.ts`: with a learner ID and granted consent it identifies with that ID and no other property; with denied or pending consent it does not.
- [x] 7.2 (TDD: test → impl) Same file: granting consent while already signed in identifies at that moment, without a reload.
- [x] 7.3 Pass the learner's ID from `src/app/[locale]/layout.tsx` to `GlobalProviders` and call the hook there; update `global-providers.test.tsx`.
- [x] 7.4 (TDD: test → impl) Ending the identity when nobody is signed in. Implemented in `useAnalyticsIdentity` rather than at each call site: with no account ID it calls `forgetLearner()`, which resets only while PostHog still holds an identified learner. That covers sign-out (the layout re-renders signed out), the account-deleted page and an expired session with one tested rule, and leaves an anonymous visitor's identity alone.

## 8. Recording

- [x] 8.1 Audit every component and page for the learner's **email address** rendered as text or as an attribute. Done 2026-10-10: five elements in four components — `account-section` (two rows), `change-email-section` (the description **and** the confirmation; the description was not in the original list), `forgot-password-form` and `sign-up-form` (both through `AccountConfirmation`). No attribute carries it.
- [x] 8.2 (TDD: test → impl) In each of those components' test files: the element containing the address carries the `ph-no-capture` class. Then add it.
- [x] 8.3 (TDD: test → impl) `src/lib/recordable-route/recordable-route.test.ts`: sign-in, sign-up, forgot-password and reset-password are not recordable under every locale in `routing.locales`; the home, a lesson page and the profile are.
- [x] 8.4 (TDD: test → impl) `src/hooks/use-session-recording-gate/use-session-recording-gate.test.ts`: recording starts only with granted consent on a recordable route; it stops on entering a credential route, on a denied choice, and resumes on leaving.
- [x] 8.5 Call the hook from `GlobalProviders`; update its test.

## 9. Named events

- [x] 9.1 (TDD: test → impl) The lesson video player: `video_played`, `video_paused`, `video_seeked`, `video_speed_changed` and `video_ended` fire with the lesson reference and the declared properties. Tests in the player components' existing files, against the fake.
- [x] 9.2 (TDD: test → impl) `lesson_completed`, with `by: "learner"` from the completion toggle and `by: "playback"` when watching completes it.
- [x] 9.3 (TDD: test → impl) `course_enrolled` from the enroll action, on success only.
- [x] 9.4 (TDD: test → impl) `prize_claimed` where a prize claim succeeds.
- [x] 9.5 ~~`app_install_prompt_answered` with the browser's outcome.~~ Dropped during implementation: `use-install-prompt` and `InstallPromptModal` deliberately do not read the browser dialog's `userChoice` ("claiming it would be claiming to know something it cannot see"), and the click on the application's own prompt is already captured with its text. The event was removed from the catalogue and the spec.

## 10. Erasure

- [x] 10.1 Read PostHog's API reference (Context7) for the persons lookup by distinct ID, the private API host and the key scopes; record the answers in design open question 2.
- [x] 10.2 (TDD: test → impl) `src/lib/server-env/server-env.test.ts`: the environment parses with none of the three PostHog variables; with all three; and fails, naming the missing one, when the token is set without the key or the project ID. Add them to `serverEnvShape` with the `refine`.
- [x] 10.3 (TDD: test → impl) `src/adapters/analytics/posthog-person-eraser/posthog-person-eraser.test.ts`, with `fetch` stubbed: a known person is looked up and deleted with `delete_events` and `delete_recordings`; an unknown person is `Ok`; a failing response is an `Err` carrying no email address. Confirm Better Auth's hook name here (design open question 3).
- [x] 10.4 (TDD: test → impl) In the `auth.ts` tests: deleting an account calls the eraser with the account ID; when it returns `Err`, the deletion still completes and `reportHandledError` receives the account ID.
- [x] 10.5 JSDoc on the adapter; walk the `clean-code` checklist.

## 11. The privacy policy

- [x] 11.1 (TDD: test → impl) `src/lib/legal-sections/legal-sections.test.ts`: `PRIVACY_SECTION_KEYS` lists `usageData` immediately after `errorReports`. Add the key. `messages.test.ts` now fails in all three locales — that failure is the test for 11.2.
- [x] 11.2 Write the `usageData` heading and body in all three locales, from the draft in design decision 13.
- [x] 11.3 Edit the `cookies` passage in all three locales: the locale and session cookies are always set; PostHog's cookie and storage only after accepting; the choice is remembered.
- [x] 11.4 Edit the `yourChoices` passage in all three locales: the footer control, and deletion erasing usage data and recordings.
- [x] 11.5 (TDD: test → impl) `src/components/legal-document/legal-document.test.tsx` (and the page tests, if they assert the date): each page renders its own date. Replace `LEGAL_LAST_UPDATED` with `PRIVACY_LAST_UPDATED` (the day of this edit) and `TERMS_LAST_UPDATED` (unchanged, 2026-09-22); update both pages and the stories.

## 12. Runbook and environment

- [x] 12.1 (TDD: test → impl) `src/deployment/deployment.test.ts`: the PostHog step of `DEPLOYMENT.md` names the US region, the Cookieless tracking and session replay settings, two-factor authentication, and says the personal API key is server-only. The existing parametrised test already fails for the three undocumented variables. Then write the step, including `posthog-cli` install, `login --host https://eu.posthog.com`, and how to finish a failed erasure by hand.
- [x] 12.2 Add the three variables, commented, to `.env.example`, saying that without the token nothing is sent and no banner appears.

## 13. End to end

- [x] 13.1 (TDD: test → impl) `e2e/legal-pages.spec.ts`: add `PostHog` to the processors the privacy policy must name.
- [x] 13.2 (TDD: test → impl) New `e2e/product-analytics.spec.ts`: on the home page and a lesson page, no consent banner is rendered and no request goes to the relay path or to a `posthog.com` host. It passes because the test build has no token, which is the scenario it guards.

## 14. Verification

- [x] 14.1 Run `pnpm verify`, then `pnpm test:e2e` for `legal-pages` and `product-analytics` (with `PLAYWRIGHT_BASE_URL`, since port 3000 is taken on this machine). Done 2026-10-10: typecheck, format and lint clean; 3937 Vitest tests pass; 15 Playwright tests pass on chromium. One run timed out `generate-metadata-locale-guard` at 5 s under load; it passes alone and in a calm full run.
- [ ] 14.2 Load the three variables into Vercel for Preview (`develop`), merge to `develop`, and on the preview, with Playwright MCP in a fresh context and a throwaway learner, check each of:
  - before any choice: the banner shows, no PostHog cookie or storage entry exists, no request went to the relay;
  - after rejecting: events are sent, still no cookie and no PostHog storage, signing in sends no account ID;
  - after accepting: the cookie is scoped to the preview host only, signing in identifies by account ID with no name or email;
  - a request from `/en/reset-password?token=x` carries no `token` anywhere;
  - signing out does not bring the banner back, and later events carry a new identity.
- [ ] 14.3 **Owner:** install the CLI (`npm install -g @posthog/cli`) and run `posthog-cli login` (US is its default host). Then, with `posthog-cli api`, confirm on the data 14.2 produced:
  - events from the rejecting visit were **ingested**, not merely visible in Live events;
  - two rejecting visits from different networks count as two visitors (design open question 4);
  - no event carries a `Cookie` value, an email address or a query string;
  - whether a country or city is present (design open question 5) — update the `usageData` passage if so;
  - the recording of the accepting visit has no credential page in it, shows the profile's email as a blank block and typed input as masked.
- [ ] 14.4 Delete the throwaway learner's account on the preview and confirm with `posthog-cli api` that the person, their events and their recording are gone.
- [ ] 14.5 **Owner:** review the final `usageData`, `cookies` and `yourChoices` passages and the banner copy in `en`, `es` and `pt`.
- [ ] 14.6 Remove the three PostHog variables from Vercel Preview (`develop`) once 14.2–14.4 are done: `vercel env rm <name> preview develop`. Confirm with `vercel env ls preview develop` that none is left, and on the next `develop` build that no banner appears and nothing is sent. PostHog then exists in production only.

## 15. Rollout

- [ ] 15.1 Load the three variables into Vercel **Production** before `develop` is merged to `main`. The token needs `--type config --value <token> --yes`; the personal API key is a Secret.
- [ ] 15.2 After the production deploy: `/en/privacy` shows the new text and date; the banner appears on a first visit; accepting and rejecting behave as on the preview.
- [ ] 15.3 With `posthog-cli api`, create the first dashboards, filtered to the production host: page views by path; the sign-up funnel (home → sign-up → first course); where lesson visits end; video play-to-end rate per lesson.
- [ ] 15.4 Run `/opsx:verify`, then `/opsx:archive`.

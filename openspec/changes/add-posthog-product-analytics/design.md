## Context

**What exists.** Sentry is the only third-party browser concern today. `src/instrumentation-client.ts` — the earliest hook Next offers — starts it from one tested pure function, `sentryInitOptions(dsn)`, which returns `null` without a DSN. There is no Content Security Policy. `src/proxy.ts` chains `sessionGate → missingPage → next-intl`, and its matcher skips `api`, `_next`, `_vercel` and any path containing a dot.

**What the privacy policy promises today:** two cookies and no others, "no third-party trackers", and for Sentry "no performance tracing and no session recording". `openspec/specs/legal-pages/spec.md` requires the text to claim no analytics "because the application performs none". All of that changes with this work, in the same deploy.

**The scope the owner chose** (2026-10-10): everything PostHog's free plan offers for traceability — identified learners, cross-day tracking, recordings, heatmaps, click text, named events, visitors behind content blockers, the `develop` preview — holding back only what is unsafe to send. That makes a consent banner unavoidable, which the owner was told when choosing.

**What a security read of the codebase found** (2026-10-10). Each item below would leave the browser under PostHog's defaults:

| Finding | Where | Channel it would leak through |
| --- | --- | --- |
| A single-use token in the address | `/[locale]/reset-password?token=…` | Page views, and the page address stored inside a recording |
| The password in a request body | `authClient.signIn.email`, `signUp.email`, change-password | Recording, if network payload capture is enabled |
| The email address printed as text | `account-section` (profile), `change-email-section`, `forgot-password-form`, `sign-up-form` confirmations | Recordings and click text |
| Name and email typed into inputs | sign-up, onboarding, profile, change-email | Recordings, if input masking is relaxed |
| The session cookie on same-origin requests | any request to the application's own origin | The relay, if it forwards headers untouched |
| A cookie readable by other subdomains | PostHog's cookie defaults to the registrable domain; `docs.english-course.online` is served by GitHub Pages | Every request to the docs portal would carry the learner's analytics identity |
| Unredacted error text | Sentry's pipeline strips addresses and bodies; PostHog's would not | Exception capture |
| One learner's activity attributed to the next | a shared device after sign-out | Identity not reset |
| Data outliving the account | the policy promises deletion | No erasure in PostHog |

Not a finding: the learner types no free text anywhere except their name; lesson notes are course content, not learner input. The Turnstile and YouTube frames are cross-origin and are never captured by a recording. Client code logs nothing to the console today.

**What the PostHog documentation establishes** (read 2026-10-10):

- `cookieless_mode: "on_reject"` — nothing is stored and no event is captured until the visitor answers; `opt_in_capturing()` enables cookies, `opt_out_capturing()` switches to the cookieless hash; `get_explicit_consent_status()` returns `granted`, `denied` or `pending`.
- Cookieless tracking must also be enabled in the project (Settings → Web analytics), or cookieless events are discarded while still appearing in Live events.
- `reset()` on logout clears identity **and consent settings**.
- `cross_subdomain_cookie` shares the cookie across subdomains; `persistence` defaults to `localStorage+cookie`, the cookie holding the distinct ID and session ID.
- `session_recording: { maskAllInputs, maskTextSelector, recordBody, recordHeaders }`; the class `ph-no-capture` replaces an element with a blank block in recordings and stops autocapture from it.
- `DELETE /api/projects/<project_id>/persons/<person_uuid>?delete_events=true&delete_recordings=true` with a personal API key; recordings are destroyed by crypto-shredding.
- PostHog documents a Next.js proxy relay that sets the `host` header, deletes `cookie` and `authorization`, and rewrites to the region's ingestion host or, for `/static/` and `/array/` paths, its asset host (`us.i.posthog.com` and `us-assets.i.posthog.com` for a US project).
- `posthog-cli login` stores a personal API token; `posthog-cli api` exposes the MCP tool catalogue, including SQL. The CLI defaults to the US host and takes `--host`.

**Deployment facts.** Vercel Hobby, non-commercial. Only `main` and `develop` build. `NEXT_PUBLIC_*` values are inlined at build time. The `develop` preview sits behind Vercel Authentication and has its own Turso database. PostHog's free plan has one project.

## Goals / Non-Goals

**Goals:**

- See who did what, across days, with recordings, for every learner who agrees.
- Still count, anonymously, everyone who does not.
- Send nothing that is a credential, a secret or a contact detail.
- Keep the privacy policy exactly true.
- Erase a learner's analytics when they erase their account.
- Spend nothing; query and manage from a terminal.

**Non-Goals:**

- Email or name as PostHog properties.
- Surveys, flags, experiments, PostHog error tracking, server-side capture.

## Decisions

### 1. Consent decides: `cookieless_mode: "on_reject"`

Identification and recording are personal-data processing that stores things on the device, so the visitor is asked. `on_reject` is the mode built for this: accept gives the full client, reject falls back to the anonymous daily hash instead of dropping the visitor altogether.

The consent state is PostHog's own (`opt_in_capturing` / `opt_out_capturing`), not a second store of ours — one source of truth, and the banner shows exactly when `get_explicit_consent_status()` is `pending`.

**Alternative — `cookieless_mode: "always"`, no banner.** The previous version of this design. Anonymous only; dropped at the owner's request.

**Alternative — cookies for everyone, no banner.** Identifies and records people who were never asked. Rejected.

### 2. One module talks to the SDK

`src/lib/product-analytics/product-analytics.ts` holds the dynamically imported client and exports the only operations the application needs: capture a catalogued event, grant or deny consent, read the consent status, identify, reset, start and stop recording. An ESLint `no-restricted-imports` entry forbids `posthog-js` everywhere else.

Every rule in the spec is then enforced in one file, and components are tested against a fake of six functions instead of the SDK. Without a token every operation is a no-op, which is what keeps development and CI silent without a single `if` at a call site.

### 3. Options come from one tested pure function, as Sentry's do

`productAnalyticsOptions(token)` returns the token and a configuration typed as the SDK's `PostHogConfig`, or `null`. A wrong option name is a type error. Each security requirement maps to a field one unit test asserts:

| Requirement | Option |
| --- | --- |
| Consent first | `cookieless_mode: "on_reject"` |
| Profiles only for identified learners | `person_profiles: "identified_only"` |
| Cookie stays on its host | `cross_subdomain_cookie: false`, `secure_cookie: true` |
| Recording starts only when the application says so | `disable_session_recording: true` |
| Inputs masked, no payloads | `session_recording: { maskAllInputs: true, recordBody: false, recordHeaders: false }` |
| No console capture | `enable_recording_console_log: false` |
| No exceptions | `capture_exceptions: false` |
| URLs scrubbed | `before_send` |
| Relay | `api_host` set to the relay path, `ui_host: "https://us.posthog.com"` |
| No redirect per request | `rewriteRequestPath` removes the trailing slash |

### 4. The SDK is loaded on demand

`instrumentation-client.ts` calls the options function and, only when it returns options, calls the analytics module's `startProductAnalytics`, which dynamically imports `posthog-js`, initializes it and keeps the client. The import lives in the analytics module so that it stays the SDK's only importer, entry point included. A static import would put the SDK in every page's first bundle, including builds with no token.

### 5. A first-party relay in `proxy.ts`, with headers stripped

`analyticsRelay(request)` in `src/lib/analytics-relay/` is a pure function in the shape of `sessionGate`: it returns a rewrite response for a request under the relay path and nothing otherwise. `proxy.ts` calls it first. The matcher gains a second entry for the relay path, because PostHog's script files contain a dot and the existing pattern skips those.

The relay forwards an allowlist of headers and nothing else. This is the one place where a mistake hands the Better Auth session to a third party, so the test builds a request carrying a session cookie and asserts on the forwarded headers. Three things found while implementing it (2026-10-10):

- **PostHog's published example does not strip anything in Next.** It calls `NextResponse.rewrite(url, { headers })`, and in Next `headers` are the *response* headers. The upstream request, cookie included, is untouched. The request headers are replaced through `request: { headers }`, confirmed in the Next 16.2.9 documentation and in `resolve-routes.js`, which deletes every incoming header not named in the override.
- **`Referer` leaks the token too.** For a same-origin request the browser sends the full page address, so a request from the reset-password page carries `?token=…` in a header that `before_send` never sees. An allowlist drops it, along with the platform's own `x-vercel-*` headers, without anyone having to enumerate them.
- **Next redirects PostHog's paths.** They end in a slash (`/e/`), and Next answers those with a 308 to the slash-less path before the proxy runs. PostHog's hosts serve both spellings identically, in the EU and in the US (checked for `/e`, `/i/v0/e`, `/s`, `/flags`, `/batch`), so the client is configured with `rewriteRequestPath` to ask for the slash-less one. The documented alternative, `skipTrailingSlashRedirect`, would change how every page of the site answers a trailing slash.

The upstream hosts are constants. The policy says where the data is stored; a variable could contradict that sentence with no test able to notice. `messages.test.ts` holds the other half: every locale's passage names the same country the constants point at.

**The region is the US** (changed 2026-10-10). This design first assumed the EU, on the usual reasoning that European visitors' data would stay in Europe. The owner's account turned out to be in the US region, which cannot be changed, and the reasoning did not hold for this project anyway: the database (Turso `aws-us-east-1`), Sentry and the Vercel functions (`iad1`) are all in the United States already, so PostHog there adds no new kind of transfer, and the relay sits next to it. What the US does require is that the policy says so, which it now does in all three locales.

The path is `/pulse`, which no content-blocker list names; PostHog advises against `/ingest`, `/analytics` and the like.

**Alternative — `rewrites` in `next.config.ts`.** Fewer lines, and it forwards every request header, the session cookie included. Rejected on that alone.

**Alternative — a route handler under `src/app/`.** Works, and runs a Node function per event instead of a rewrite at the edge. More expensive on Hobby for no gain.

**Alternative — straight to PostHog's ingestion host.** Simpler and cheaper; loses visitors behind a blocker. Declined by the owner.

### 6. Every query string and fragment is removed, at any depth

`before_send` passes each event through a pure function that walks the event's properties recursively and, for every string that parses as an absolute URL, drops `search` and `hash`.

Recursive, because PostHog nests the first-contact URLs inside `$set_once`. Everything rather than a denylist of `token`, because a denylist protects against the parameters someone remembered.

What is lost: the `next` return path, the `from` and `claim` flags, and any future `nuqs` filter state. Campaign parameters survive: the SDK extracts `utm_*` into their own properties, which are not URLs.

### 7. Recording is started by the application, on recordable routes, with consent

The client starts with recording disabled. `useSessionRecordingGate()` in `GlobalProviders` starts it when consent is granted **and** `isRecordableRoute(pathname)` holds, and stops it otherwise.

`isRecordableRoute` is a pure function over the pathname, with or without its locale prefix; the four credential routes return `false`. A recording stores the address of each page it shows, inside snapshot data that `before_send` does not reach — so the reset-password page must never be in one, and "off until started" is the only ordering that holds when that page is the first of a visit. The other three are excluded because they are where passwords are typed; inputs are masked, and not recording them at all is the stronger statement for the policy.

The sign-up funnel stays visible through page views and clicks.

**Alternative — record everywhere and list blocked URLs in the PostHog project.** A dashboard setting, invisible in review, that one click removes.

### 8. The email is excluded by marking the elements that print it

The elements that print the address get PostHog's `ph-no-capture` class, exported as `NOT_CAPTURED_CLASS` and set explicitly as the recorder's `blockClass`. The audit found five, not four: `change-email-section` prints the address in its description as well as in its confirmation. `AccountRow` and `AccountConfirmation` take a `personal` prop for it. They are: blank in recordings, silent for click capture. Where the address sits inside a translated sentence, the sentence's element is marked.

Each of those components gets a test asserting the class on the element that contains the address, so a refactor that drops it fails.

The learner's **name** is not masked. It is not a credential, the reader has agreed to recordings by the time it appears in one, and the owner asked for click text. It is not sent as a property either — see decision 9.

**Alternative — mask all text in recordings (`maskTextSelector: "*"`).** Safe by construction and useless: every recording becomes rows of asterisks.

### 9. Identity is the account ID, synchronized from the layout

`src/app/[locale]/layout.tsx` already reads the learner snapshot on the server; it passes the learner's ID to `GlobalProviders`, where `useAnalyticsIdentity(learnerId)` calls `identify` when there is an ID and consent is granted.

No email, no name. With the ID, any PostHog result joins to Turso in one query, and PostHog holds nothing that identifies a person on its own.

Ending the identity is the same hook's job, not each call site's. With no account ID it calls `forgetLearner()`, which resets only while PostHog still holds an identified learner (`$user_state`, the property the SDK's own `_isIdentified()` reads). That one rule covers a sign-out — the layout re-renders signed out — the account-deleted page, and a session that expired, and it leaves an anonymous visitor's identity alone: resetting on every signed-out page would turn one visit into many.

Because the SDK's `reset()` also clears consent, `forgetLearner()` opts back in afterwards, without the event an acceptance normally sends; otherwise every sign-out would bring the banner back. Only a consenting visitor can be identified, so there is no declined case to restore.

The layout's session read became `currentLearner()`, returning the account ID beside the snapshot it already loaded; it was the function's only caller.

### 10. Named events are a typed catalogue

```ts
type LessonReference = { lessonId: string };

type ProductEvents = {
  video_played: LessonReference & { positionSeconds: number };
  video_paused: LessonReference & { positionSeconds: number };
  video_seeked: LessonReference & { fromSeconds: number; toSeconds: number };
  video_speed_changed: LessonReference & { rate: number };
  video_ended: LessonReference;
  lesson_completed: LessonReference & { by: "learner" | "playback" };
  course_enrolled: { courseSlug: string };
  prize_claimed: { moduleSlug: string };
};
```

`captureProductEvent<K extends keyof ProductEvents>(name: K, properties: ProductEvents[K])`. Clicks on ordinary controls — the outline, the notes tabs, the locale and theme switches — are already captured with their text and need no entry. The catalogue is for what a click cannot say: where in the video, who completed the lesson, whether an enrollment or a claim was really saved.

Adjusted while implementing (2026-10-10):

- **The lesson reference is the lesson ID alone.** The player is composed where only the ID is known; it is unique across the catalogue, and every event already carries the page address, which names the course and module.
- **No install-prompt event.** `use-install-prompt` deliberately does not read the browser dialog's `userChoice`, and the click on the application's own prompt is captured with its text.
- **A seek is debounced into one jump** (`useReportPlayback`, 500 ms), with the position before the first seek of a run as its origin. Dragging the slider would otherwise send dozens of events.
- **Enrollment, claim and completion are reported after the server accepts them**, not on the optimistic write that shows them at once.

Two arguments, one of them the event name: within the project's argument-count rule.

### 11. Erasure runs in Better Auth's deletion hook, through an adapter

`src/adapters/analytics/posthog-usage-data-eraser/` implements a small `UsageDataEraser` interface, in the shape of `EmailSender`: look the person up by distinct ID, then `DELETE` with `delete_events=true&delete_recordings=true`. It returns a `ResultAsync`, never throws, and treats "no such person" as success — most deleted accounts will belong to someone who rejected, or never signed in after consenting.

`auth.ts` calls it from `user.deleteUser.afterDelete`, handing the work to `afterResponse`. On an `Err` the adapter itself has already called `reportHandledError` with the account ID, as `SmtpEmailSender` does for a failed send. The account deletion has already happened and is not undone: an analytics outage must not keep someone's account alive.

`POSTHOG_PERSONAL_API_KEY` and `POSTHOG_PROJECT_ID` join `serverEnvShape`, with a `refine` like the Turso one: required whenever the project token is set. A deployment that can collect but cannot erase does not start.

### 12. Production only; the preview is switched on once, to verify

Decided by the owner on 2026-10-11: PostHog exists in production and nowhere else. Where it exists is nothing but where the variables are set, so this is a deployment decision with no code behind it.

The first real test of consent, of what a recording leaves out and of erasure should still not happen in front of learners. So the three variables are set for `Preview (develop)` for the verification in group 14 and removed when it is done (task 14.6). The relay is the reason this cannot be done on a laptop instead: stripping the session cookie depends on how the platform applies the proxy's header override, and only a real Vercel deployment shows that.

The preview's cookie is host-only (decision 3), so a test identity never crosses into production, and the few events the check leaves behind are filtered out by host.

**Alternative — verify directly in production.** Nothing extra to set up, and the first failure is a real learner's. Declined.

**Alternative — keep the preview collecting.** The earlier version of this decision. Declined by the owner.

Account IDs come from two different databases. They are random and long; a collision between a preview and a production ID is not a practical concern.

### 13. The privacy text: one new passage, two edited, a date per document

- New key `usageData` after `errorReports` in `PRIVACY_SECTION_KEYS`.
- `cookies`: the two cookies are always set; PostHog's cookie and storage exist only after accepting; the choice itself is remembered.
- `yourChoices`: the footer control; deleting the account erases usage data and recordings.
- `LEGAL_LAST_UPDATED` becomes `PRIVACY_LAST_UPDATED` and `TERMS_LAST_UPDATED`; the terms keep 2026-09-22.

Draft of the English passage, for the owner's review:

> **Usage data.** To understand how the site is used, we send usage data to PostHog, which stores it in the United States. We ask you first. If you accept, PostHog sets a cookie and uses your browser's storage to recognise you between visits, links what you do to your account by its ID — never by your name or email address — and records your sessions: what the page showed and where you clicked and scrolled. If you decline, your visit is still counted, anonymously: nothing is stored in your browser, nothing is linked to your account, and nothing is recorded. Either way we collect the pages you visit, what you click, actions such as playing a video, and the kind of browser and device you use. We never collect what you type into a form, your email address, anything after the question mark in a page address, or recordings of the sign-in, sign-up and password pages. You can change your answer at any time from the link at the bottom of every page.

### 14. Managed with `posthog-cli`, installed on the owner's machine

`npm install -g @posthog/cli`, then `posthog-cli login`; US is its default host. A personal tool like `sentry-cli`; nothing in the build calls it.

### 15. The banner reserves the space it covers

Added while implementing. The banner is fixed to the viewport and mounted in the locale layout, outside `RouteTransition`, so it neither travels with an outgoing page nor is re-asked by the incoming one. A fixed element would permanently cover whatever sits beneath it on a page no taller than the screen — a form's submit button, the footer's own links — so the component also lays out an invisible, inert copy of its card in the page's flow. The page is always exactly as much taller as the banner is high, at every width and locale, without a script measuring anything.

## Risks / Trade-offs

- [Cookieless tracking left off in the project] → every rejecting visitor's events are discarded while Live events still shows them. The runbook says so; task 14.3 checks ingested data, not the live stream.
- [Recordings show learners using the site, and whoever can sign in to PostHog can watch them] → two-factor authentication on the PostHog account, stated in the runbook. The owner is the only member.
- [A new element prints the email and nobody marks it] → the four known places are tested; a fifth is not. Task 8.1 audits at implementation time; the residual risk is a future component.
- [The relay spends Vercel Hobby allowances] → every event and every recording chunk is a proxied request with its transfer. At this traffic it is small; if it is not, sampling recordings in the project settings is the first lever, and dropping the relay the second.
- [The free plan's allowances — about one million events and five thousand recordings a month by third-party accounts — are exceeded] → with no card, ingestion pauses until the month resets. The owner must not add a card. Confirm the figures on PostHog's pricing page.
- [The personal API key leaks] → it can delete persons and recordings. It is a Vercel Secret, server-only, scoped to the minimum, and `serverEnv` is the only reader.
- [Erasure fails silently] → it cannot: an `Err` is a Sentry event carrying the account ID, and the runbook says how to finish the job with `posthog-cli`.
- [An option does not behave as documented here] → unit tests assert what is passed to the SDK, not what the SDK does. Task 14.2 checks the real browser on the preview.
- [The project token is public] → by design; it only permits sending events.
- [Consent is asked of every visitor, including on the public home] → the banner does not block the page, and rejecting is one click of equal weight.
- [Whether this banner and this policy satisfy a given jurisdiction] → nothing is stored before the choice, rejection is as easy as acceptance, and the processing is disclosed. That is an engineering reading, not legal advice.

## Testing strategy

| Behaviour | Layer | Where |
| --- | --- | --- |
| No token → `null`; with a token, one assertion per row of decision 3's table | Vitest unit | `src/lib/product-analytics-options/product-analytics-options.test.ts`, mirroring `sentry-init-options.test.ts` |
| URL scrubbing: reset token, nested URL, path kept, non-URL untouched | Vitest unit | same file; route hardcoded, secret from `@faker-js/faker` |
| The relay strips `Cookie` and `Authorization`, picks the US host, sends script paths to the asset host, ignores other paths | Vitest unit | `src/lib/analytics-relay/analytics-relay.test.ts`, mirroring `session-gate.test.ts` |
| The relay runs before the session gate | Vitest unit | the existing proxy test, if one exists; otherwise a new `src/proxy.test.ts` |
| Credential routes are not recordable, in every locale; other routes are | Vitest unit | `src/lib/recordable-route/recordable-route.test.ts` |
| The facade is a no-op without a client; reset preserves the consent choice | Vitest unit | `src/lib/product-analytics/product-analytics.test.ts`, with a fake client |
| An undeclared event or a wrong property type does not compile | Type test | same file, `// @ts-expect-error` |
| Identify when signed in and consenting; not when rejecting; reset on sign-out | Vitest + RTL (`renderHook`) | `src/hooks/use-analytics-identity/use-analytics-identity.test.ts` |
| Recording starts and stops with consent and route | Vitest + RTL (`renderHook`) | `src/hooks/use-session-recording-gate/use-session-recording-gate.test.ts` |
| The banner: pending shows it, both buttons act, a choice hides it, the policy link is locale-aware, keyboard reachable | Vitest component + RTL + user-event | `src/components/consent-banner/consent-banner.test.tsx`; stories in `en`, `es`, `pt` |
| The footer control reopens the banner | Vitest component | `src/components/site-footer/site-footer.test.tsx` |
| Each element printing the email carries `ph-no-capture` | Vitest component | the four components' existing test files |
| Each named event fires with the right properties | Vitest component | the emitting components' test files, against the fake facade |
| Erasure: looks up, deletes with both flags, "not found" is success, a failure is an `Err` | Vitest unit | `src/adapters/analytics/posthog-person-eraser/posthog-person-eraser.test.ts`, with `fetch` stubbed. Not a persistence adapter, so the testcontainers rule does not apply |
| A failed erasure is reported and does not block deletion | Vitest unit | the `auth.ts` tests that already cover the email hooks |
| The token requires the key and the project ID | Vitest unit | `src/lib/server-env/server-env.test.ts` |
| `DEPLOYMENT.md` names every variable and the PostHog settings | Vitest unit | `src/deployment/deployment.test.ts` |
| Every locale writes the new passage and the banner copy | Vitest unit | `src/messages/messages.test.ts` — existing tests |
| Each legal page shows its own date | Vitest component | `src/components/legal-document/legal-document.test.tsx` |
| The policy names PostHog | Playwright e2e | `e2e/legal-pages.spec.ts` |
| With no token: no banner, no analytics request | Playwright e2e | new `e2e/product-analytics.spec.ts`; the CI build has no token |
| With a token: nothing stored before the choice; accept and reject each behave as specified; the session cookie is absent upstream; the reset page is not recorded; the email is blank in a recording | Manual, once | Playwright MCP on the `develop` preview, then inspected with `posthog-cli` |

The last row is not automated: the token is inlined at build time and CI builds once without it. It is checked by hand on the preview before `main`, and the unit tests keep the options from drifting afterwards.

## Migration Plan

1. **Owner, in PostHog:** the region is confirmed as US; enable Cookieless tracking and session replay; leave console and network capture off; enable two-factor authentication; create a personal API key scoped to persons and recordings; copy the project token and project ID.
2. Load the three variables into Vercel for Preview (`develop`), for the verification only.
3. Merge to `develop`. Verify everything on the preview, with a throwaway learner. Then remove the three variables from Preview.
4. Load the three variables into Vercel Production.
5. Merge `develop` → `main`. The token and the new policy go live in the same build.
6. Verify in production; build the first dashboards with `posthog-cli`.

**Rollback:** remove the project token in Vercel and redeploy. The client stops starting, the banner disappears, the relay forwards nothing. The policy then over-describes; revert it if the removal is permanent.

## Open Questions

1. ~~**Option and method names.**~~ Resolved 2026-10-10 against `posthog-js` 1.438.7: every name exists as written, with one correction — heatmaps are `capture_heatmaps`; `enable_heatmaps` is deprecated. `pnpm typecheck` holds them.
2. ~~**The persons lookup.**~~ Resolved 2026-10-10 from the API reference: `GET /api/projects/:id/persons/?distinct_id=…` on `https://us.posthog.com`, then `DELETE …/persons/<uuid>/?delete_events=true&delete_recordings=true`. The key needs `person:read` and `person:write`; whether deleting recordings also needs `session_recording:write` is confirmed by the real deletion in task 14.4.
3. ~~**Better Auth's deletion hook.**~~ Resolved 2026-10-10: `user.deleteUser.afterDelete(user, request)` exists in `@better-auth/core` 1.7.5. The erasure is handed to `afterResponse`, so the deletion does not wait on PostHog.
4. **The visitor's IP through the relay.** Whether Vercel's rewrite preserves the client address PostHog needs for the cookieless hash is checked at task 14.3: two rejecting visitors must count as two.
5. **What an ingested event carries.** Whether a country or city is derived from the IP is read from a real event at task 14.3, and the policy passage says so if it is.

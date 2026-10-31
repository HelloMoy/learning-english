## Why

The application records what a learner achieves — enrollments, completed lessons, playback position — but nothing about how they move through it. There is no way to tell which pages are visited, where a visit ends, which controls are used or ignored, how the video player is actually handled, or where visitors arrive from. Every product decision about navigation and layout is made without evidence.

The owner wants the fullest picture PostHog's free plan gives — who did what, across days, with recordings — managed from a terminal, and has asked that only what is unsafe to send be held back.

## What Changes

- **PostHog collects usage data in production only**, sent to PostHog's US cloud on the free plan. The `develop` preview is switched on once, to verify the integration before it reaches learners, and switched off again.
- **A consent banner decides how much.** Nothing is stored or sent before the visitor chooses.
  - **Accept:** cookies and browser storage are used, the visit is followed across days, a signed-in learner is identified by their account ID, and sessions are recorded.
  - **Reject:** the visit is still counted, anonymously, with no cookie, no storage, no identity and no recording.
  - The choice can be changed at any time from the footer.
- **What is captured:** page views, page leaves, clicks with the text of what was clicked, heatmaps, session recordings, and a small typed catalogue of named events for what a click cannot express (video playback, lesson completion, enrollment, prize claims, app install).
- **Requests go through the application's own domain**, so a content blocker that stops PostHog's hosts does not stop the count.
- **Deleting an account erases its PostHog data too** — the person, their events and their recordings.
- **Held back for security**, and only this:
  - everything after the `?` in any address (the password-reset link carries its token there);
  - anything typed into a form;
  - the learner's email address, wherever the interface prints it;
  - recordings of the four credential pages (sign-in, sign-up, forgot password, reset password);
  - the bodies and headers of network requests, and the browser console, inside recordings;
  - the session cookie, which the relay strips before forwarding;
  - errors, which stay in Sentry where addresses are redacted.
- **The privacy policy says all of it**, in `en`, `es` and `pt`. Each legal document gets its own last-updated date, so editing the privacy policy does not re-date the terms.
- **The runbook covers PostHog**: the project, its settings, the variables, and `posthog-cli` for querying data and managing dashboards from a terminal.

## Capabilities

### New Capabilities

- `product-analytics`: what usage data the application sends to PostHog, how consent governs it, how a learner is identified, what is recorded, what must never be sent, and how the data is erased with the account.

### Modified Capabilities

- `legal-pages`: the privacy text names PostHog as a processor, describes the consent choice and the cookies that follow from it, and no longer claims the application performs no analytics; each document carries its own last-updated date.
- `production-deployment`: the provisioning runbook covers the PostHog project, its settings and its variables.

## Impact

- **New dependency**: `posthog-js` (browser SDK). Changes `package.json`, the lockfile and `pnpm-workspace.yaml` (its `core-js` dependency's install script is denied; it only prints a funding notice).
- **New modules**:
  - `src/lib/product-analytics-options/` — the client configuration and the URL scrubbing;
  - `src/lib/product-analytics/` — the one module allowed to talk to the SDK, and the typed event catalogue;
  - `src/lib/analytics-relay/` — the first-party relay, called from `src/proxy.ts`;
  - `src/lib/recordable-route/` — which routes may be recorded;
  - `src/hooks/use-consent-question/`, `use-consent-status/`, `use-analytics-identity/`, `use-session-recording-gate/`, `use-report-playback/`;
  - `src/components/consent-banner/` and `src/components/privacy-choices-button/` — with stories, tests and messages in three locales;
  - `src/adapters/analytics/` — the `UsageDataEraser` interface and its PostHog implementation.
- **Modified**: `src/instrumentation-client.ts`, `src/proxy.ts`, `src/components/global-providers.tsx`, `src/app/[locale]/layout.tsx`, `src/components/site-footer/`, `src/lib/auth/auth.ts` (deletion hook), `src/lib/auth/current-learner/` (renamed from `current-learner-snapshot`; now also returns the account ID), `src/lib/server-env/server-env.ts`, the components that print the email address (`account-row`, `account-confirmation`, `account-section`, `change-email-section`, `forgot-password-form`, `sign-up-form`), the points that emit named events (the lesson player, the completion toggle, `use-complete-when-watched`, `use-enrolled-courses`, `use-prize-claims`), `src/lib/legal-sections/`, `src/components/legal-document/`, both legal pages, `src/messages/{en,es,pt}.json`, `e2e/legal-pages.spec.ts`; new `e2e/product-analytics.spec.ts`.
- **Tooling**: an ESLint `no-restricted-imports` entry confining `posthog-js` to `src/lib/product-analytics/`. Changes `eslint.config.mjs`.
- **Docs**: `DEPLOYMENT.md`, `.env.example`.
- **New environment variables**: `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` (public), `POSTHOG_PROJECT_ID` and `POSTHOG_PERSONAL_API_KEY` (server-only, a secret). All three in Vercel Production. In Preview (`develop`) only during verification, then removed.
- **New external service**: a PostHog Cloud US project. The account already exists (organization `english-course`), in the US region — where the database, Sentry and the functions already are.
- **Vercel usage**: every analytics request, including recording data, now passes through the application's proxy and counts against the Hobby plan's request and transfer allowances.
- **Owner's machine**: `posthog-cli` installed globally. Not a project dependency.
- **Specs**: new `openspec/specs/product-analytics/spec.md`; deltas to `legal-pages` and `production-deployment`.

## Non-goals

- **Sending the learner's email address or name as PostHog properties.** The account ID is the identity; Turso holds who it belongs to. The name still appears where the interface prints it, in click text and in recordings.
- **Surveys, feature flags and experiments.** They are not traceability, and nothing here needs them.
- **PostHog's error tracking.** Errors stay in Sentry, whose pipeline strips addresses and message bodies; a second, unredacted channel would undo that.
- **Server-side capture** with `posthog-node`. Everything captured here happens in the browser; the server only talks to PostHog to erase.
- **Honouring Do Not Track.** The banner is the choice now, and it is explicit.
- **Usage data from the `develop` preview.** The owner wants PostHog in production only. The preview carries the variables just long enough to verify the integration; the handful of test events that leaves in the one free project is told apart by its host.
- **The PostHog MCP server or Claude Code plugin.** The CLI exposes the same tool catalogue.

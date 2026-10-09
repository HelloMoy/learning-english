## 1. The pattern

- [x] 1.1 (TDD: test → impl) `sentry-init-options.test.ts`: when a DSN is set, an event shaped like `ENGLISH-COURSE-2` (type `UnhandledRejection`, value `Non-Error promise rejection captured with value: provider destroyed`) is dropped by the SDK's `eventFiltersIntegration` configured with the options' `ignoreErrors`.
- [x] 1.2 Add the exported, documented pattern list and return it from `sentryInitOptions` as `ignoreErrors`; extend `SentryInitOptions`.

## 2. What must still be reported

- [x] 2.1 (TDD: test → impl) Same file: a non-Error rejection whose value only contains the words (`provider destroyed while saving progress`) is kept.
- [x] 2.2 (TDD: test → impl) Same file: a thrown `Error("provider destroyed")` event is kept.
- [x] 2.3 (TDD: test → impl) Same file: without a DSN the function still returns `null`, so the existing "Sentry is not started" cases keep passing unchanged.

## 3. Verification

- [x] 3.1 Walk the `clean-code` checklist; confirm the JSDoc names the library, the observed version and the removal condition.
- [x] 3.2 Run `pnpm test:run src/lib/sentry-init-options`, then `pnpm verify`.
- [ ] 3.3 After the production deploy, resolve `ENGLISH-COURSE-2` in Sentry and confirm over the following days that it does not reopen.
- [x] 3.4 Archive `ENGLISH-COURSE-5` (the headless scraper) in Sentry. Done 2026-10-09.
- [ ] 3.5 `ENGLISH-COURSE-3`: archive it in Sentry and report the slider-preview race upstream, or patch Vidstack — the owner's call, see the proposal's non-goals.

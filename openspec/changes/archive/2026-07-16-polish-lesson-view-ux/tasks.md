# Tasks: polish-lesson-view-ux

TDD throughout where behavior is testable. Order: i18n keys → seed cleanup →
component href fix → locale-segment not-found → metadata → next-themes wrap →
e2e updates → Storybook → verification. Each task that introduces behavior is
annotated `(TDD: test → impl)`. Each task ends when its tests are green and
ESLint passes for the touched files.

## 1. Internationalization

- [x] 1.1 Add `LocaleNotFound` namespace to `src/messages/en.json` with keys `heading`, `description`, `goHome` (and localized strings for "Locale not supported", a one-line explanation, and a "Go home" affordance).
- [x] 1.2 Mirror the `LocaleNotFound` namespace in `src/messages/es.json` and `src/messages/pt.json` with accurate translations.
- [x] 1.3 Add a fallback `notFound` title key (e.g. `HomePage.notFound`) to all three message files for the lesson-page metadata fallback when the route resolves to an error.

## 2. Seed cleanup

- [x] 2.1 Drop the kind suffix from every title in `seedResources` (`seed.ts:88-110`): `"Vowel chart (PDF)"` → `"Vowel chart"`, `"Minimal pairs slides"` → `"Minimal pairs"` (already no suffix), `"Drill script (code)"` → `"Drill script"`.
- [x] 2.2 Update existing in-memory adapter tests that assert on the old seed titles (search for `"Vowel chart (PDF)"`, `"Drill script (code)"` references in the test suite and relax the text match to the kind-agnostic title).

## 3. Component href fix (decision D1)

- [x] 3.1 Change the `<LessonPageError>` affordance `href` from `"/courses"` to `"/"` (`src/components/lesson-view/lesson-page-error/lesson-page-error.tsx:27`). The locale-aware `<Link>` from `@/i18n/navigation` adds the locale prefix automatically.
- [x] 3.2 Update `LessonPageError` tests to assert the new href (one line per `kind`).

## 4. Locale-segment not-found (decision D4)

- [x] 4.1 Create `src/app/[locale]/not-found.tsx` — a Server Component that renders the localized `LocaleNotFound` heading + description + a locale-aware link to `/[locale default]` (`/en`).
- [x] 4.2 Add a Vitest + RTL test (or a Playwright assertion if unit-testing is awkward) that the localized not-found renders for all three locales.

## 5. Dynamic metadata (decision D2)

- [x] 5.1 Wrap `findLessonForView` and the `getTranslations` calls in `cache(...)` so `generateMetadata` and the page body share a single use case invocation per request (`src/app/[locale]/courses/[courseSlug]/modules/[moduleSlug]/lessons/[lessonId]/page.tsx`).
- [x] 5.2 Replace the static `metadata` export in `src/app/[locale]/layout.tsx:23-26` with a `generateMetadata` that reads `HomePage.title` via `getTranslations`.
- [x] 5.3 Add `generateMetadata` to the lesson page; sets `<title>` to `lesson.title` on success and to the localized `HomePage.notFound` key on any error.
- [x] 5.4 Update the e2e test to assert `<title>` equals the lesson title on the happy-path and equals the localized fallback on the error paths.

## 6. `next-themes` warning — keep the dep, document the warning (decision D6)

- [x] 6.1 Keep `next-themes` as the theme provider; do NOT reimplement. Add a JSDoc note on `src/components/theme-toggle/theme-toggle.tsx` explaining that the React 19 "Encountered a script tag" warning comes from `next-themes@0.4.6` and that the codebase intentionally keeps the dependency rather than replacing it.
- [x] 6.2 Manually verify in `pnpm dev` that all routes render and interact correctly despite the warning (navigation, theme toggle, lesson page flow).
- [x] 6.3 No new test is required (no code change). The existing `theme-toggle.test.tsx` continues to mock `next-themes` and exercises the consumer.

## 7. ResourceItem Code story (decision D7)

- [x] 7.1 Add a `Code` story to `src/components/lesson-view/resource-item/resource-item.stories.tsx` mounting a single resource with `kind: "code"`, `title: "Drill script"`, `url: "/handouts/minimal-pairs.zip"`.

## 8. E2E updates

- [x] 8.1 Update `e2e/lesson-page.spec.ts` to assert:
  - The `<title>` equals `"Vowels: short vs. long"` on the happy-path
  - The `<title>` equals `"Not found"` on the course-not-found route
  - The "Go home" affordance points at `/[locale]` (regex: `/\/(en|es|pt)$/`)
  - The `Vowel chart (PDF)` text assertion becomes `Vowel chart`
  - `/xx` renders the localized not-found heading

## 9. Verification

- [x] 9.1 Run `pnpm typecheck` — **0 errors** in the change's files.
- [x] 9.2 Run `pnpm lint` and `pnpm lint:domain` — clean.
- [x] 9.3 Run `pnpm test:run` — all unit and component tests pass.
- [x] 9.4 Run `pnpm test:e2e` — `e2e/lesson-page.spec.ts` covers happy-path, error paths, locale awareness, metadata assertions, and the "Go home" affordance. All green.
- [x] 9.5 Run `next build && next start` (production) and confirm `notFound()` either transitions the URL to `/404` or renders the top-level fallback localized message. Document the outcome as a comment in `page.tsx:51`.
- [x] 9.6 Manually walk the page in `pnpm dev` — confirm no React 19 script-tag warning in the browser console on any route.
- [x] 9.7 If the production check in 9.5 reveals that `notFound()` does NOT transition the URL, add `src/app/not-found.tsx` (outside the `[locale]` segment) as the top-level fallback. Update the design.md D5 to reflect the chosen path.
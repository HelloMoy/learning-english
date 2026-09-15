## Context

The learner profile (name + avatar) lives only in this device's `localStorage`, read through
`useLearnerProfile`, which reports `unknown` until hydration and then `absent` / `present`. Personal
routes (My learning, Profile, onboarding step 2) already guard themselves on the client with
`useLearnerRedirect(status, { when, to })`, which calls `router.replace` from `@/i18n/navigation`
once the status matches.

Course routes have no guard. They are Server Components that render full content plus structured
data. There is no `courses/layout.tsx` today, and `nuqs` is mounted in `GlobalProviders` but no
component reads query state yet.

## Goals / Non-Goals

**Goals:**

- One guard covering course, module and lesson routes, with no per-page wiring.
- Carry the requested course path through both onboarding steps and return to it when they finish.
- Refuse any `next` that could leave the site or land outside course routes.

**Non-Goals:**

- Server/middleware enforcement, hiding content during hydration, or keeping the query string or
  hash of the original route (see proposal).

## Decisions

### 1. The gate lives in `src/app/[locale]/courses/layout.tsx`

A server layout renders `{children}` next to a route-local client component,
`require-learner-profile.tsx`, that returns `null` and runs the redirect. A layout wraps all three
nested routes, so a new course route is covered automatically. The layout persists across
client-side navigation between course routes, which is fine: the profile status does not change on
navigation.

_Alternatives:_ calling the guard inside `CourseOverview`, `ModuleOverview` and `LessonView` (three
call sites to keep in step, and those components are also rendered in stories/tests where a
redirect is noise); middleware (cannot read `localStorage`).

The client component is route-local and not reusable, so it follows the `catalog-levels.ts`
precedent of app-folder helpers and does not get a story. The logic it runs is a tested hook.

### 2. `useRequireLearnerProfile()` in `src/hooks/use-require-learner-profile/`

It composes `useLearnerProfile`, `usePathname` from `@/i18n/navigation` (locale-stripped path) and
`useLearnerRedirect(status, { when: "absent", to: onboardingPath(pathname) })`. It reuses the
existing "decide nothing while unknown" and `replace` semantics instead of re-implementing them.

### 3. A pure `next` validator and path builder in `src/lib/onboarding-return-path/`

- `isCourseReturnPath(value: string): boolean` — starts with `/courses/`, and contains no `//`,
  `\`, `:` or `..` segment.
- `withReturnPath(path: string, returnPath: string | undefined): string` — appends
  `?next=<encoded>` only when the return path is valid.

Pure functions, unit-tested with edge cases (external URL, protocol-relative, backslash, traversal,
`/profile`, empty). Only pathnames are carried, never query or hash.

_Alternative:_ allow any internal path. Rejected: the only producer is the course gate, and a
narrow allowlist makes an open redirect impossible by construction.

### 4. The onboarding steps read `next` through `nuqs`

A hook `useOnboardingDestinations()` in `src/hooks/use-onboarding-destinations/` reads
`useQueryState("next", parseAsString)` with the parser declared at module scope, validates it and
returns non-nullable destinations:

```ts
{ avatarStep: string; afterOnboarding: string; nameStep: string }
// avatarStep      "/start/avatar" (+ ?next when valid)
// afterOnboarding the valid next, else "/learning"
// nameStep        "/start" (+ ?next when valid)
```

`OnboardingNameStep` uses `avatarStep` after saving and `afterOnboarding` for its "already
onboarded" forward. `OnboardingAvatarStep` uses `afterOnboarding` after saving and `nameStep` for
its "no profile" redirect. Returning strings rather than `string | null` keeps the call sites free
of null checks.

`nuqs` is the project's standard for URL-bound state. `useSearchParams` from `next/navigation` is
the alternative, but it is exactly the kind of direct import the project routes through wrappers.

### 5. The router receives a string href with the query

`router.replace("/start?next=%2Fcourses%2Fc")` via the `@/i18n/navigation` router prefixes the
locale and keeps the query. Encoding happens in `withReturnPath`, so no call site builds a query
string by hand.

## Risks / Trade-offs

- [Course content flashes before the redirect on a device without a profile] → accepted by the
  user in exchange for unchanged SSR/SEO; the redirect runs on the first effect after storage is
  read, and it uses `replace` so Back does not return to the flash.
- [The lesson page's client effects (e.g. `RememberContinueWatching`) may run once before the
  redirect] → at worst a continue-watching record for the requested lesson is written; that is the
  lesson the learner returns to, so it is harmless. No progress is marked complete without playback.
- [Existing e2e specs open course routes on a clean device and will now land on `/start`] → a shared
  `e2e/learner-profile-fixture.ts` seeds a valid profile with `addInitScript`; every affected spec
  calls it. Specs that clear storage on first load (`lesson-playback-resume.spec.ts`) seed after the
  clear.
- [`nuqs` in component tests] → wrap renders with `withNuqsTestingAdapter({ searchParams })` from
  `nuqs/adapters/testing` rather than mocking `nuqs`.
- [A crafted `next`] → rejected by the allowlist in decision 3; invalid values degrade silently to
  today's behaviour.

## Testing strategy

| Behavior | Layer | File / pattern mirrored |
| --- | --- | --- |
| `next` validation and href building (valid, external, `//`, `\`, `..`, `:`, non-course, empty) | Vitest unit | `src/lib/onboarding-return-path/onboarding-return-path.test.ts`, style of `src/lib/module-route/*.test.ts` |
| Gate: redirects `absent` to `/start?next=<pathname>`, stays on `present`, waits on `unknown` | Vitest `renderHook` | `use-require-learner-profile.test.ts`, mirroring `use-learner-redirect.test.ts` (mocked `@/i18n/navigation` router) |
| Destinations from `?next=` (valid, invalid, missing) | Vitest `renderHook` + nuqs testing adapter | `use-onboarding-destinations.test.ts` |
| Step 1 carries `next` to step 2 and forwards an onboarded device to `next` | Vitest + RTL + user-event | extend `onboarding-name-step.test.tsx` (stub `LearnerProfileRepository`) |
| Step 2 finishes at `next`, else My learning; no-profile redirect keeps `next` | Vitest + RTL + user-event | extend `onboarding-avatar-step.test.tsx` |
| Full round trip: clean device opens a lesson URL → onboarding → back on that lesson; profile device opens lesson directly; landing card → onboarding | Playwright | new `e2e/course-onboarding-gate.spec.ts` |
| Existing course/module/lesson flows keep passing | Playwright | seed profile via new `e2e/learner-profile-fixture.ts` in the affected specs |

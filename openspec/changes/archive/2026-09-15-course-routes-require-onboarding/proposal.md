## Why

The onboarding only runs when the learner presses **Start course** on the landing. Every other way
into the course — a catalog card on the landing, a shared lesson link, a typed URL, Back from
another site — opens course, module and lesson pages on a device that has no learner card, so the
header, My learning and Profile have no name or avatar to show for progress the learner is already
making. A learner card is the entry ticket to the course, whatever door they use.

## What Changes

- Course routes (`/[locale]/courses/[courseSlug]`, `.../modules/[moduleSlug]`,
  `.../lessons/[lessonId]`) send a device without a learner profile to the onboarding once storage
  has been read, replacing the history entry.
- The route the learner asked for travels through the onboarding as a `next` query parameter, so
  finishing step 2 returns them to that course route instead of My learning.
- `next` is accepted only when it is an internal course path; any other value is ignored and the
  onboarding behaves as today (finishing opens My learning).
- A device that already holds a profile and opens `/start?next=<course path>` is forwarded to that
  path instead of My learning.
- The server keeps rendering course pages in full, so crawlers, structured data and share previews
  are unchanged; the decision happens on the client after hydration, like the existing guards on My
  learning and Profile.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `learner-onboarding`: course routes become guarded by the profile; step 1 forwards `next` to
  step 2; step 2 finishes at `next` when present; the "already onboarded" forward honours `next`.

## Non-goals

- Guarding the landing (`/[locale]`), which stays public and keeps its **Start course** /
  **Continue** action.
- Server-side or middleware enforcement — the profile lives only in this device's `localStorage`.
- Hiding course content until the profile is known (the user chose render-then-redirect).
- Preserving the original route's query string or hash through the onboarding; only its path
  returns.
- Accounts, sign-in, or any profile field beyond name and avatar.

## Impact

- New `src/app/[locale]/courses/layout.tsx` mounting a client gate for all three course routes.
- New hook for the gate and a pure validator for the `next` path under `src/hooks/**` and
  `src/lib/**`.
- `OnboardingNameStep` and `OnboardingAvatarStep` read `next` (via `nuqs`) to choose their
  destinations.
- E2E specs that open course routes on a clean device must seed a learner profile first; a new
  e2e spec covers the gate and the round trip.
- No new dependencies, no domain changes, no new UI strings.

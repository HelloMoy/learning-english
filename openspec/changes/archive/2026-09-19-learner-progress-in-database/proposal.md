## Why

`auth-and-database-foundation` gives every learner an account and the app a database, but progress
still lives in one browser's `localStorage`. Signing in on a second device shows nothing, and
clearing the browser erases it. This change moves the four pieces of progress to the signed-in
learner's rows in Turso: lesson completion, playback positions, the continue-watching location and
the learner profile.

## What Changes

- **Four Turso adapters** implement the existing ports (`ProgressTracker`,
  `PlaybackPositionRepository`, `ContinueWatchingRepository`, `LearnerProfileRepository`), each
  bound to one learner at construction. The ports do not change.
- **Four tables**, `learner_profile`, `lesson_completion`, `playback_position` and
  `continue_watching`. Each is keyed by the learner's user id, with `ON DELETE CASCADE` to `user`,
  so deleting an account later removes its progress by construction.
- **The server loads a learner snapshot** (profile, completed lessons, positions, continue-watching
  location) once per request in the locale layout, and hands it to the client.
- **The client keeps its hooks and their public API** (`useCompletedLessons`,
  `markLessonComplete`, `useSavedPlaybackPositions`, `usePlaybackPosition`,
  `useContinueWatching`, `useLearnerProfile`, …). They now read a client store seeded from that
  snapshot. They still render nothing personal before hydration, exactly as today, so no hydration
  rule changes.
- **Writes go through authenticated Server Actions** (`next-safe-action` with a session
  middleware), updating the client store optimistically and rolling back when the server refuses.
  The learner id comes only from the session, never from the client.
- **Playback writes are coalesced.** During continuous playback the server is written at most once
  every 10 seconds per lesson. Pause, seek, end, unmount and page hide flush immediately, the last
  one through `navigator.sendBeacon` to a route handler.
- **BREAKING. Progress is per account, not per device.** It follows the learner across devices and
  browsers. What was in `localStorage` is not imported. It is ignored, as decided.
- The four `browser-local-storage` adapters are removed. The in-memory progress and position
  adapters stay for stories and use-case tests only.

## Capabilities

### New Capabilities

- `learner-state`: the per-learner tables and Turso adapters, the server snapshot, the seeded
  client store, authenticated write actions with optimistic rollback, playback write coalescing and
  the page-hide beacon.

### Modified Capabilities

- `lesson-progress`: the `localStorage` adapter is removed, and completion survives across devices
  for the account instead of per device.
- `playback-position`: the `localStorage` adapter is removed.
- `continue-watching`: the `localStorage` adapter is removed.
- `learner-profile`: the profile is stored per account, and cross-tab propagation through the
  `storage` event is dropped.
- `watch-progress`: the positions snapshot comes from the learner store, not `localStorage`, and
  progress is per account.

## Non-goals

- Tickets, prize claims and the pending-prize announcement (`learner-achievements-in-database`).
- Rendering progress on the server. The first frame stays empty and marks appear after hydration,
  as every current spec requires. It is a possible later enhancement.
- Live sync between two open tabs or devices. Another tab's changes arrive on its next navigation
  or reload.
- Importing or clearing the legacy `localStorage` keys.
- The seek-step preference, the theme and the pending-prize announcement. They stay device-local
  on purpose.
- Account deletion (`account-deletion`).

## Impact

- **Code:** `src/adapters/persistence/turso/**` (4 adapters, schema, `learner-repositories`
  factory), `src/lib/safe-action` (an authenticated client), new actions under
  `src/app/[locale]/learner-actions.ts`, `src/app/api/learner/playback-position/route.ts`, the
  locale layout (snapshot), a `LearnerStateSeed` client component, and the hooks
  `use-lesson-completion`, `use-saved-playback-positions`, `use-playback-position`,
  `use-persist-playback-position`, `use-continue-watching` and `use-learner-profile`.
- **Removed:** `browser-local-storage-{progress-tracker,playback-position-repository,continue-watching-repository,learner-profile-repository}`.
- **Tests:** hook and component tests that seeded `localStorage` seed the learner store instead.
  Stories likewise. e2e specs seed rows for the fixture learner instead of `addInitScript`.
- **Migration:** one new Drizzle migration with the four tables.

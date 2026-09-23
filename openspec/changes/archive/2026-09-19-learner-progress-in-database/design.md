## Context

After `auth-and-database-foundation`, every personal route has a verified session and the app has a
migrated libSQL database, but the four progress stores are still `localStorage`:

| Port | Browser adapter today | Client composition root |
|---|---|---|
| `ProgressTracker` | `BrowserLocalStorageProgressTracker` | `use-lesson-completion` (module store over `useSyncExternalStore`) |
| `PlaybackPositionRepository` | `BrowserLocalStoragePlaybackPositionRepository` | `use-playback-position` (per lesson), `use-saved-playback-positions` (snapshot) |
| `ContinueWatchingRepository` | `BrowserLocalStorageContinueWatchingRepository` | `use-continue-watching` |
| `LearnerProfileRepository` | `BrowserLocalStorageLearnerProfileRepository` | `use-learner-profile` (store per repository) |

Every consumer already goes through those roots, and every root already renders an empty or
`unknown` server snapshot, then the real one after hydration. That is the seam this change uses:
swap what sits behind the roots and leave the ~40 consumers and every hydration rule alone.

## Goals / Non-Goals

**Goals:**

- Progress per account in Turso, with the ports unchanged.
- No consumer-visible API change in the hooks, and no change to what the server renders.
- A learner id that can only come from the session.
- A playback write rate a hosted database is comfortable with.

**Non-Goals:**

- Server-rendered progress, and live multi-tab sync (both deferred).
- Achievements state (next change) and device preferences (they stay local).

## Decisions

### D1 — Tables, cascade, and one adapter per port

`schema.ts` gains the following tables, each with a `user_id` foreign key to `user` declared
`ON DELETE CASCADE`:

- `learner_profile(user_id PK, name, avatar_kind, avatar_illustration_id NULL, updated_at)`
- `lesson_completion(user_id, lesson_id, completed_at, PK(user_id, lesson_id))`
- `playback_position(user_id, lesson_id, seconds REAL, updated_at, PK(user_id, lesson_id))`
- `continue_watching(user_id PK, course_slug, module_slug, lesson_id, updated_at)`

Timestamps use SQL defaults (`unixepoch()`), so no clock enters the adapters. Upserts use
`onConflictDoUpdate`. Reads parse rows through the domain's Zod schemas (`LearnerProfile`,
`ContinueWatchingLocation`, `PlaybackPosition`), and a row that fails to parse reads as absent,
which is what every port's scenarios already say about corrupt storage.

Adapters live in `src/adapters/persistence/turso/turso-<port>/`, and
`learner-repositories/learner-repositories.ts` builds all four from `(db, learnerId)`.

*Alternative:* one JSON blob per learner. Rejected: it gives up per-row upserts and would make the
cascade and the tests less honest.

### D2 — Authenticated action client

`src/lib/safe-action/safe-action.ts` gains `learnerActionClient = actionClient.use(...)`. Its
middleware resolves the session through `getAuth().api.getSession({ headers })`, throws on absence
(which becomes `serverError`), and passes `{ learnerId }` in `ctx`. This is the derived-client
pattern the file's docstring already describes. Actions live in
`src/app/[locale]/learner-actions.ts`:

- `markLessonCompleteAction`, `unmarkLessonCompleteAction`: input `{ lessonId }`. They go through
  the existing `markLessonComplete` and `unmarkLessonComplete` use cases, built with the learner's
  `ProgressTracker`.
- `recordPlaybackPositionAction`: input `PlaybackPosition`, through `recordPlaybackPosition`.
- `recordContinueWatchingAction`: input `ContinueWatchingLocation`.
- `saveLearnerProfileAction`: input `LearnerProfile`, so an invalid card comes back as
  `validationErrors` before the `saveLearnerProfile` use case runs.

The input schemas live in `learner-action-schemas.ts`, apart from the actions, because a
`"use server"` module may only export async functions. The toggle no longer receives the completion
actions as props: the completion composition root is the only client module that calls them, as
the `lesson-progress` delta requires.

No input schema carries an id for the learner. A test asserts it by inspecting the schemas.

### D3 — Server snapshot, client-only seeding

`loadLearnerSnapshot(learnerId)` (in `src/adapters/persistence/turso/learner-snapshot/`) runs four
selects and returns plain serializable data:
`{ profile, completedLessonIds: string[], positions: Record<string, number>, continueWatching }`.
The locale layout calls it when a session exists and renders `<LearnerStateSeed snapshot={…} />`.

The seed is a client component that writes the snapshot into a module-level client store
(`src/lib/learner-store/`, a vanilla `zustand` store) inside a `useLayoutEffect`. It runs only in
the browser and never during server rendering, so no server module holds any learner's data (the
cross-request leak the spec forbids).

Each existing root keeps `useSyncExternalStore(subscribe, getSnapshot, serverSnapshot)`, but
`getSnapshot` now selects from the learner store (memoized, identity-stable). `serverSnapshot`
stays the same empty constant. The hydration pass therefore still renders empty, and React
re-renders with the seeded snapshot immediately after. Every hydration requirement in
`lesson-progress`, `watch-progress`, `lesson-completion-toggle` and `learner-profile` keeps holding
without edits.

*Alternatives:* seeding during render, with a per-request store in context. That is the zustand
Next.js pattern, and it enables SSR marks, but it requires changing every hydration requirement and
most component tests. It is deferred. Fetching the snapshot client-side after mount was rejected:
it costs an extra round-trip on every full load.

### D4 — Client adapters of the same ports, optimistic with rollback

The hooks already take their port as an injectable argument
(`usePlaybackPosition(lessonId, repository?)`, `useContinueWatching(repository?)`,
`useLearnerProfile(repository?)`, and the module-level tracker in `use-lesson-completion`). Only
the **default adapter** changes. The `browser-local-storage` adapters are replaced by client-side
adapters of the same ports under `src/adapters/persistence/learner-store/` (a new watched root):

- `LearnerStoreProgressTracker`, `LearnerStorePlaybackPositionRepository`,
  `LearnerStoreContinueWatchingRepository` and `LearnerStoreLearnerProfileRepository`.

Each one reads from the learner store. Each write does four things:

1. Captures the previous slice.
2. Applies the change to the store.
3. Awaits its Server Action.
4. Restores the slice when the envelope has `serverError` or `validationErrors`, or the call
   throws.

The rollback lives in one helper, `writeThrough(apply, action)`, in the learner store module, so
the four adapters do not each re-implement it. The actions are injected into each adapter's
constructor, so adapter tests pass fakes and never import a `"use server"` module. Hooks and their
tests keep injecting in-memory stubs exactly as today. The profile's `save` keeps its
`Promise<boolean>` contract (`false` on refusal).

This keeps the hexagon honest: hooks remain composition roots that name one adapter, and the
adapters are the only code that knows about the store or the actions.

### D5 — Coalesced playback writes and the page-hide beacon

`use-persist-playback-position` keeps its 1.5 s debounce into `usePlaybackPosition().set`, which is
spec'd, and the store updates at that cadence. The server write inside `set` goes through a
per-lesson throttle (10 s, trailing). `flush()` is exposed and is called on `pause`, `seeking`,
`ended` and unmount.

`beforeunload` is replaced by `pagehide`, which also fires on iOS Safari and bfcache. It sends
`navigator.sendBeacon("/api/learner/playback-position", JSON)`. The route handler reuses the
session check, parses `PlaybackPosition` and writes through the adapter. It answers `401` without
a session and `400` on a bad body.

### D6 — The onboarding gate and the profile

`useRequireLearnerProfile` is unchanged. With the store seeded, the profile goes from `unknown` to
`present` or `absent` right after hydration, and the existing redirect rule runs. A learner who
made their card on another device is `present` everywhere.

### D7 — Removals

Delete the four `browser-local-storage-*` adapters and their tests. `LEARNER_PROFILE_STORAGE_KEY`
and the `storage`-event listeners in the roots go with them. `getCoursePlatformDeps` drops
`progress` and `positions` (the in-memory stubs). Server code that needs them now builds them per
learner. The in-memory adapters remain for use-case unit tests and stories.

## Testing strategy

| Behavior | Layer | Mirrors |
|---|---|---|
| Four Turso adapters honour their port scenarios; learner isolation; corrupt rows read as absent; cascade on user delete | Vitest integration + testcontainers (`libsql-container` helper from change 1) | `s3-blob-store.test.ts`; the existing in-memory adapter tests' scenarios |
| `loadLearnerSnapshot` shape and learner isolation | Vitest integration + testcontainers | — |
| `learnerActionClient` refuses without a session; action input schemas carry no id | Vitest unit (session resolver injected) | `src/app/[locale]/actions.test.ts` |
| Route handler: `401` without session, `400` on bad body, write on success | Vitest integration + testcontainers | — |
| Learner store: seed only in the browser; `writeThrough` applies and rolls back; identity-stable selectors | Vitest unit | `use-lesson-completion.test.ts` |
| Roots (`use-lesson-completion`, `use-saved-playback-positions`, `use-playback-position` throttle/flush, `use-continue-watching`, `use-learner-profile`): server snapshot empty, seeded after hydration, optimistic plus rollback | Vitest + RTL `renderHook` (actions mocked at the module boundary) | the existing hook tests, re-seeded through the store instead of `localStorage` |
| `use-persist-playback-position`: `pagehide` sends the beacon with the latest position | Vitest + RTL, `navigator.sendBeacon` spied | `use-persist-playback-position.test.ts` |
| Component tests that seeded `localStorage` | Vitest + RTL, through a `seedLearnerStore()` test helper | existing tests |
| Cross-device: mark on context A, see it on context B as the same learner; resume offered after reload; onboarding skipped when the profile exists | Playwright, two browser contexts on one fixture learner | `lesson-playback-resume.spec.ts`, `course-onboarding-gate.spec.ts` |
| Existing specs that seeded `localStorage` seed rows for the fixture learner | Playwright | `learner-profile-fixture.ts` |

## Risks / Trade-offs

- **One extra render after hydration on every page** (empty, then seeded). This is already the case
  today with `localStorage`, so nothing regresses.
- **Stale state in a second open tab.** Accepted as a non-goal. The next navigation or reload
  corrects it.
- **A full page load in the instant after a write can cancel it.** A reload or a typed URL
  aborts an in-flight Server Action before it reaches the server, so the optimistic mark is lost.
  In-app navigation (links, "Up next") does not abort it. Positions are covered by the page-hide
  beacon; completion and profile writes are not, and a `pagehide` beacon for them is the follow-up
  if this proves real.
- **Up to 10 s of position lost on a crash with no page hide.** Accepted. The resume offer is
  approximate by design (see `playback-resume-thresholds`).
- **Many test files change.** The `seedLearnerStore()` helper keeps each edit mechanical, and the
  consumers' own assertions do not change.
- **Snapshot size.** At most around 150 lessons, so a few KB per request. Revisit if the catalog
  grows by an order of magnitude.

## Migration Plan

`pnpm db:migrate` applies the new tables. Existing `localStorage` progress is not imported; every
learner starts with empty progress (product decision). Rollback: revert the change and the
migration's tables are simply unused.

## Open Questions

- None.

## Context

The codebase ships a working `NativeVideoPlayer` (`<video controls>`) with no resume
behavior. Lessons in the content seed reach 30+ minutes — without resuming, a learner
who pauses loses real time re-watching. The industry standard (YouTube, Netflix,
Coursera, Disney+) is to persist the second at which the user paused and, on return,
offer to resume.

This change introduces that capability. **Storage in v1 is `localStorage`** because
there is no `StudentId` port, no auth feature, and no production DB. The contract is
designed so swapping to a server-backed adapter later is mechanical.

The project already follows hexagonal architecture
(see `openspec/specs/architecture-boundaries/spec.md`) and has a one-to-one precedent
for the migration shape: `LessonNotesRepository` is a port with a
`LocalFilesystemLessonNotesRepository` adapter today and will receive a real DB
adapter later — the contract is what stays. This change mirrors that pattern.

## Goals / Non-Goals

**Goals**

- Persist the playback position per lesson between page loads.
- Resume from the saved position with an overlay if the position passes the
  threshold rules (D4).
- Hexagonal purity: the domain knows nothing about `window.localStorage`. The port
  contract is identical to what a future Postgres-backed adapter would expose.
- Localized overlay (en/es/pt).
- Accessibility: the overlay is keyboard-reachable, dismissible, and uses
  `aria-live="polite"` (does not hijack focus).
- CI green: `pnpm verify` and `pnpm test:e2e`.

**Non-Goals**

- Per-student, cross-device sync. Defers to the future auth + DB change.
- Auto-mark-complete at any watched-percentage threshold. `completed` and
  `lastPosition` remain decoupled (D1).
- Cross-tab sync via `storage` events. Out of v1 scope; documented as a known
  limitation.
- HLS, custom chrome, or anything replacing `NativeVideoPlayer`.
- A visible progress indicator on lesson lists or course cards.
- A "watch history" or "continue watching" rail.

## Decisions

### D1. New port `PlaybackPositionRepository`, not an extension of `ProgressTracker`

`ProgressTracker` answers a *boolean* question: has the learner completed this
lesson? `PlaybackPositionRepository` answers a *continuous* question: at which
second did they pause? They are different concepts, migrate to different tables,
and are consumed by different use cases. Fusing them in a single port would
tangle two domain decisions that the spec keeps separate
(`course-platform-domain` §"`markLessonComplete` is ephemeral in v1" — the same
paragraph could not analogously host a per-second position without losing its
semantic clarity).

Trade-off: one more port, one more stub, one more adapter. Worth it because the
contract is the only thing the future DB adapter needs to match, and the seam
stays clean when auth arrives.

### D2. Folder location: `src/adapters/persistence/browser-local-storage/`

The existing persistence adapters live under
`src/adapters/persistence/<storage-kind>/<repo-folder>/`. The `local-filesystem`
adapter is server-side (Node `fs`). `browser-local-storage` follows the same
shape — same level of the tree, same folder-per-entity convention:

```
src/adapters/persistence/browser-local-storage/
└── browser-local-storage-playback-position-repository/
    ├── browser-local-storage-playback-position-repository.ts
    └── browser-local-storage-playback-position-repository.test.ts
```

The adapter is the *only* purely client-side persistence adapter in the project.
It MUST NOT be imported from a Server Component, a Server Action, or
`getCoursePlatformDeps` (the factory is server-only). Importing it from a
`"use server"` file would crash the build.

Keys are namespaced: `learning-english:playback:{lessonId}`. Prefix guards
against shared devtools, future sub-apps, and improves visibility during
debugging.

### D3. Debounced `timeupdate` + immediate writes on lifecycle events

The HTMLMediaElement fires `timeupdate` roughly four times a second. Writing
`localStorage` on every event destroys the browser's main thread. Pattern
(matches YouTube/Coursera):

- Subscribe to `timeupdate`, debounce **1500ms** via `useDebouncedCallback`
  (already in the project stack — `AGENTS.md` § "Debounce — `use-debounce`",
  default for callbacks).
- On `pause`, `seeking`, `ended`, and the `beforeunload` window event → call
  the underlying setter immediately (not the debounced wrapper).
- On component unmount (route change, React strict-mode double-mount in dev) →
  call the debounced function's `flush()` to drain any pending write.

This gives a hard upper bound of "1.5s of position loss on a hard close" and
zero loss on graceful close. The debounce delay is the only number exposed to
product feedback — see `design.md § Open Questions`.

### D4. Resume thresholds: ≥ 30s saved, ≥ 10s remaining

Two reasons the overlay is wrong even with a saved position:

- **Saved position < 30s from start.** The user effectively didn't watch
  anything; auto-resuming saves a click and looks broken (video jumps mid-intro).
- **Saved position within last 10s of `durationSeconds`.** The user effectively
  finished; resuming shows a "you watched it all, except the last 3s" moment that
  feels broken.

Rules:

- If `getPosition(lessonId)` returns `null` → don't render overlay, start at `0`.
- If returned `seconds < 30 || seconds > durationSeconds - 10` → don't render
  overlay, start at `0`.
- Otherwise → render overlay at the saved position with
  "Resume from `MM:SS`" + "Restart from beginning".

Both bounds are encoded as named constants in `lesson-video-resume/`. No magic
numbers in the call sites.

### D5. `completed` and `lastPosition` stay decoupled — no auto-complete

The existing `markLessonCompleteAction` is explicit ("Mark as complete" button).
We do NOT auto-mark a lesson complete at 95% watched. Reasons:

- The user is currently in charge of `completed`
  (per `course-platform-domain` §"`markLessonComplete` is ephemeral in v1").
  Mixing an automatic transition into the manual model is the kind of hidden
  rule that surprises the user ("why does it say I completed this?").
- Domain purity: the two concepts migrate to different tables. Auto-completing
  from position requires a rule that has no analog in the existing port.

If a future change wants "auto-complete on 95% watched", it can be added as a
*separate* use case (e.g. `autoMarkLessonComplete`), leaving the manual button
intact.

### D6. Overlay UX = Netflix/YouTube style, with primary CTA "Resume"

Netflix, YouTube, Coursera all converge on the same pattern. Reasons not to
reinvent:

- Universal muscle memory. "Resume" is the verb every English-speaking user
  recognizes.
- Two CTAs are the maximum — three would crowd the overlay; zero would force a
  default the user might not want.
- "Restart" is the only meaningful secondary action when there is a saved
  position.

UX spec:

```
┌────────────────────────────────────────────────────┐
│  ▶  Resume from 12:34                              │
│     Restart from beginning                         │
└────────────────────────────────────────────────────┘
```

- Auto-dismiss after **5s** of inactivity (no click, no keypress).
- Escape / Space / Enter on focused button behaves like primary click.
- Click anywhere outside the overlay dismisses **without changing playback**
  (defaults to "play from 0" because no overlay action was taken).

Accessibility:

- `role="dialog"` with `aria-label` set by i18n (no title baked in).
- `aria-live="polite"` so screen readers learn about the option without focus
  stealing.
- Keyboard: tab cycles between Resume / Restart; visible focus.

### D7. v1: per-device only, defer `StudentId`

`ids.ts` defines `StudentId` as a brand type, but no port consumes it. There is
no auth feature. Adding `StudentId` to the port now means inventing the auth
shape before its time and forces a breaking change later.

Decision: in v1 the port signature is `getPosition/setPosition(lessonId)`. The
adapter's key is `learning-english:playback:{lessonId}`. When auth ships, the
port gains a `studentId` argument, the adapter renames its key to
`learning-english:playback:{studentId}:{lessonId}`, and existing localStorage
entries are migrated or abandoned per the future auth migration policy — out of
scope here.

### D8. Migrate `markLessonCompleteAction` to `next-safe-action` in this change

Today, `markLessonCompleteAction` is a plain `"use server"` async function:

```ts
"use server";
export async function markLessonCompleteAction(input: { lessonId: LessonId }) {
  const deps = getCoursePlatformDeps();
  const result = await deps.useCases.markLessonComplete({
    lessonId: input.lessonId,
  });
  if (result.isErr()) return { completed: false };
  return { completed: true };
}
```

`AGENTS.md` § "Server Actions — `next-safe-action`" requires the `actionClient`
+ `schema(...)` wrapper for any Server Action taking client input. Adding a
second Server Action to the same file would leave two styles side by side;
migrating both in the same change is small (one Zod schema wrap, one
`actionClient.action(...)` call) and prevents future drift.

The existing `lesson-view.test.tsx` depends on the `(input) => Promise<{
completed: boolean }>` shape — the safe-action client returns the same value for
the success path through `executeAsync` (typed, awaited). The migration reuses
the same call signature from the client.

## Testing strategy

Per repo rules (`AGENTS.md`), each behavior is placed at its cheapest reliable
layer.

- **Vitest unit** — port, use cases, adapter:
  - `recordPlaybackPosition`: happy path, lesson-not-found, port rejection
    → `internal-error`. Mirrors the structure of `mark-lesson-complete.test.ts`.
  - `getPlaybackPosition`: returns `{ seconds: null }` when port returns
    `null`; returns wrapped value otherwise; `internal-error` on port
    rejection.
  - `BrowserLocalStoragePlaybackPositionRepository`: round-trip, isolation
    across `lessonId`s, `null` when key missing, defensive behavior when
    `window.localStorage` is undefined.
- **Vitest component + RTL** — colocated `*.test.tsx`:
  - `LessonVideoResume`: renders only when position is within thresholds;
    "Resume" click invokes `onResume(seconds)`; "Restart" invokes
    `onRestart`; Escape / click-outside dismisses; `aria-live` present;
    localized strings from `en/es/pt` messages.
  - `PlaybackPositionedVideoPlayer`: applies `currentTime` on mount when the
    initial position passes thresholds; does NOT apply when it doesn't;
    debounced save on simulated `timeupdate`; immediate save on simulated
    `pause` / `ended`; `flush` on unmount; never writes before first user
    interaction.
- **Playwright e2e** — new `e2e/lesson-playback-resume.spec.ts`:
  - Happy path: load the lesson, advance the `<video>` to 0:30 via `evaluate`,
    reload, assert overlay shows "Resume from 00:30", click Resume, assert
    `currentTime ≈ 30`.
  - Negative case: advance to `durationSeconds - 5`, reload, assert no
    overlay, `currentTime` is `0`.
  - Default case: cold load (no stored position), no overlay,
    `currentTime === 0`.
- **Storybook** — stories colocated for `LessonVideoResume` and
  `PlaybackPositionedVideoPlayer` (folder-per-component convention).

Verification gates: `pnpm verify` (typecheck + lint + format + vitest) and
`pnpm test:e2e` clean.

## Risks / Trade-offs

- **`localStorage` quota (~5 MB).** Position + lessonId is a few hundred bytes
  per lesson; with 107 lessons in the seed, total storage use is negligible
  (~10 KB). Mitigation: not a real risk at the current scale; revisit if the
  seed grows.
- **Browser-only adapter can leak to server.** A future contributor might
  import the adapter from a `"use server"` file by reflex. Mitigation: the
  adapter file starts with a JSDoc warning; the adapter's tests live next to
  its impl (no server-environment test); `getCoursePlatformDeps` is unchanged
  for the new port (the adapter is injected).
- **Auto-complete expectation from product.** Some product reviews might
  expect "finished watching the video → automatically marked complete".
  Mitigation: D5 is explicit; if the team disagrees, a separate change can
  add an `autoMarkLessonComplete` use case without touching D1/D2/D3.
- **Debounce delay choice (1500ms).** Too low = noise writes; too high = lost
  progress on hard close. Mitigation: 1500 is the project's `use-debounce`
  default for callbacks and YouTube's effective window. The wrapper exposes
  the constant, so it's tunable in one place.
- **`storage` event for cross-tab sync.** Out of scope (D7); documented as a
  known v1 limitation so a future contributor doesn't assume it works.
- **Migrating an existing Server Action.** D8 migrates
  `markLessonCompleteAction` to `next-safe-action` in this change. Risk: the
  existing `lesson-view.test.tsx` depends on the action's
  `(input) => Promise<{ completed: boolean }>` shape. The safe-action client
  preserves the success shape through `executeAsync`; the test seam holds and
  we add one validation-error test.

## Migration Plan

No data migration. Order of work:

1. Domain port + stub (foundation).
2. Use cases + tests (red → green → refactor).
3. Adapter + tests (red → green).
4. Wire deps (`getCoursePlatformDeps`).
5. Server Actions (migrate existing + add new).
6. Resume overlay component.
7. Smart `PlaybackPositionedVideoPlayer` component.
8. Wire into `LessonView` and lesson page.
9. i18n keys, JSDoc, Storybook stories.
10. Playwright e2e.
11. Verify + archive.

Each step is independently shippable once the foundation lands. No step
requires a DB.

## Open Questions

- **Debounce 1500ms vs 2000ms vs 1000ms.** Is the chosen default going to feel
  right in the e2e test, or should we tune before the change goes in?
  (Reviewable in Playwright after step 10.)
- **Resume prompt auto-dismiss timeout (currently 5s).** Is "5 seconds of
  inactivity" long enough? Or should it stay until the user interacts?
- **`formattedSeconds` UX.** "Resume from 12:34" — `MM:SS` only, or `HH:MM:SS`
  for videos over an hour? The Zod schema for `durationSeconds` allows any
  positive int; the seed's longest lesson is well under an hour.

## Known limitations (v1)

- **Per-device only.** Changing browser, clearing site data, or using a second
  device loses progress. Designed-in until auth + DB ship.
- **No cross-tab sync.** Two tabs watching the same lesson overwrite each
  other; last write wins. Acceptable for v1; will be free with the DB adapter.
- **No auto-complete.** Position does not imply `completed`. The learner still
  clicks "Mark as complete" manually.

These three are the cheapest way to ship the feature today without inventing
the auth shape. All three become non-issues once the future Postgres-backed
adapter + auth land.

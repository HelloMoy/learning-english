## Context

Two facts about a learner already live in `localStorage`, written by capabilities
that shipped earlier:

| Fact | Key | Written by | Read by |
| --- | --- | --- | --- |
| Completion | `learning-english:completed:{lessonId}` | `BrowserLocalStorageProgressTracker`, via `markLessonComplete` | `useLessonCompletion` — a module-level `useSyncExternalStore` store shared by every mounted indicator |
| Playback position | `learning-english:playback:{lessonId}` | `BrowserLocalStoragePlaybackPositionRepository`, via `usePersistPlaybackPosition` | `usePlaybackPosition` — a **per-lesson, promise-returning** hook used by exactly one consumer, the player |

The asymmetry is the crux of this change. Completion already has a synchronous,
subscribable, list-friendly reader; position does not. `usePlaybackPosition(lessonId)`
returns `{ get, set }` where `get` is a promise — fine for the one player that awaits
it on mount, useless for 31 rows that each need a number during render.

Both surfaces we are changing are **Server Components** — `ModuleOverview` and
`ModuleShowcaseCard` render on the server and are not `"use client"`. Progress can only
appear after hydration, so each indicator has to be its own client island dropped into
a server-rendered row, exactly as `LessonCompletionMark` already is.

The third constraint is the domain: `ModuleSummary.leadingLessons` is capped at
`LEADING_LESSONS_CAP = 6` on purpose, so a 31-lesson module cannot project all of
itself into a card. A meter reading "7 / 17" needs the *whole* set, so the summary has
to carry something the cap does not bound.

## Goals / Non-Goals

**Goals:**

- One shared rule for "how much of this lesson has been watched" and one for "is it
  finished", used identically by every surface.
- A list can read every saved position in one synchronous pass.
- Finishing a video records completion through the existing `ProgressTracker`, so
  there is one stored notion of "done".
- Existing stored positions light up the new indicators with no migration.
- The two server-rendered views stay server-rendered except for the indicators.

**Non-Goals:**

- Cross-device sync, a server-backed adapter, or auth.
- A new storage key, a new persisted field, or a backfill.
- Course-level progress, progress on the home page, the continue-watching rail or the
  breadcrumb.
- Any change to the resume overlay, its thresholds, or the write cadence.

## Decisions

### D1 — Progress is derived, never stored

`watchedFraction` and `hasFinishedWatching` are pure functions of
`(positionSeconds, durationSeconds)`. Nothing new is written to storage; the only new
write in the whole change is the completion key the tracker already owns.

**Why:** a stored `watchedFraction` would be a third fact that can disagree with the
two we already keep, and it would need a migration for every position saved before
today. Deriving instead means a learner who watched three lessons last week sees three
bars the moment this ships.

**Alternative considered:** persist a per-lesson `watchedSeconds` high-water mark, so
that scrubbing backwards does not appear to lose progress. Rejected for v1: it is a
new persisted field (an explicit non-goal), and the position we already store is a
faithful answer to "where are you", which is what the bar claims to show.

They live in `src/lib/watch-progress/watch-progress.ts`, mirroring
`src/lib/playback-resume-thresholds/` — the established home for a **presentation
policy** that is neither a domain invariant nor component code, and that a player must
be able to gate on without importing anything visual.

### D2 — The finish threshold is `min(duration - 15, duration * 0.95)`

Two rules, whichever comes first, with a fallback for clips under 15 seconds where
`duration - 15` goes negative:

```
threshold = min(duration - 15, duration * 0.95)
if threshold <= 0 then threshold = duration * 0.95
```

**Why both:** the percentage alone is wrong for long videos (5% of a 40-minute lesson
is two minutes of credits the learner will never sit through); the fixed tail alone is
wrong for short ones (15 seconds of a 60-second clip is a quarter of it). Taking the
earlier of the two is generous in the direction that matters — a learner who has
effectively finished should not have to sit through an outro to get their check mark.

This threshold is deliberately *earlier* than the existing resume rule's
`SECONDS_NEAR_END = 10`. The two answer different questions ("is this done?" vs "is it
worth offering to resume?") and there is a narrow band where a lesson reads as complete
and still offers a resume point. That is coherent, not contradictory: completion is not
a claim that there is nothing left to rewatch.

The constants live beside the predicates and are exported, as `MIN_SECONDS_FROM_START`
and `SECONDS_NEAR_END` are, so tests name them rather than repeating magic numbers.

### D3 — A second client composition root for *all* saved positions

`useSavedPlaybackPositions()` — a module-level store built on `useSyncExternalStore`,
a near-copy of `use-lesson-completion`'s structure: one shared snapshot, a `Set` of
listeners, a stable `EMPTY` value returned on the server, a `storage` listener for
cross-tab writes, and a `refreshSavedPlaybackPositions()` exported for same-tab writes.
The snapshot is a `ReadonlyMap<string, number>` built by scanning `localStorage` keys
under the playback prefix.

**Naming:** `useSavedPlaybackPositions`, not `usePlaybackPositions` — one character
away from the existing `usePlaybackPosition` is a trap for both readers and
autocomplete.

**Why not extend `usePlaybackPosition`:** it is the player's *write* path and its
promise-returning shape is right for that job (it composes the `getPlaybackPosition`
use case and the `PlaybackPosition` value object). Two readers with different shapes
for different jobs is honest; one hook doing both would be neither.

**Why a full key scan rather than N `getItem` calls:** the same reason
`use-lesson-completion` scans — the store does not know which lessons a consumer will
ask about, and one pass over a few hundred keys on subscribe is cheaper and simpler
than a per-consumer registry.

**Alternative considered:** teach the existing `BrowserLocalStoragePlaybackPositionRepository`
a `listPositions()` method and add it to the port. Rejected — the port is a domain
contract, and a bulk read exists purely to make a browser list render in one pass. It
would push a presentation concern into the hexagon for no domain gain.

### D4 — Two consumer hooks compose the two stores

Components never touch either store directly:

- `useLessonWatchState({ lessonId, durationSeconds }) → { watchedFraction, isComplete }`
- `useModuleWatchProgress(lessonRuntimes) → { completedCount, lessonCount }`

`isComplete` is `countsAsComplete({ isMarkedComplete, positionSeconds, durationSeconds })`
— a pure predicate exported beside the other two in `src/lib/watch-progress/`, so the
per-lesson hook and the per-module count share one implementation of the spec
requirement "A lesson counts as complete when it was marked or watched to the end". When
`watchedFraction` is 0 and `isComplete` is false the consumer renders nothing, which is
what keeps the pre-hydration frame from asserting a falsehood.

`useModuleWatchProgress` counts with the same predicate over the module's lesson
runtimes, so a card and its rows cannot diverge. It cannot call `useLessonWatchState`
per lesson — the count varies from module to module and a hook per lesson would break
the rules of hooks — so `use-lesson-completion` also exports `useCompletedLessons()`,
the same store read as a set. That keeps the concrete adapter behind the one hook that
already owns it rather than opening a second door onto storage.

**Consequence for `LessonCompletionMark`:** it gains an optional `durationSeconds` prop
and reads `useLessonWatchState` instead of `useLessonCompletion` directly. Every place
it renders — module overview rows and the lesson outline — passes the lesson's duration
where it has one. This is not "progress in the outline" (a non-goal); it is the outline
using the one completion rule rather than a stale half of it.

### D5 — `ModuleSummary` gains `lessonRuntimes`, and `leadingLessons` keeps its cap

```ts
export type LessonRuntime = { id: LessonId; durationSeconds: number };
// ModuleSummary
lessonRuntimes: LessonRuntime[]; // every lesson, in sequence order; 0 for reading lessons
```

**Why the whole set:** the meter's denominator is the module's lesson count, and its
numerator counts completions across all of them. Counting only the previewed six would
report "6 / 17" as a maximum.

**Why runtimes and not just ids:** completion is derived from position *and* duration
(D4). A card holding only ids could not apply the shared rule and would have to fall
back to the tracker alone — which would undercount every lesson finished before this
change shipped, and disagree with the row on the module overview. The extra cost is one
number per lesson.

**Payload:** the largest course carries 107 lessons; ~107 `{id, durationSeconds}`
entries is a few kilobytes in the RSC payload, against a page that already ships poster
URLs for sixty gallery cards. Acceptable. If a course ever reaches thousands of
lessons, the meter's inputs are the thing to move behind a bounded endpoint.

`leadingLessons` is untouched — the cap exists to bound what the *gallery* renders, and
that is still bounded.

### D6 — Auto-completion hangs off the player, gated like the write gate

A new hook `useCompleteWhenWatched({ lessonId, durationSeconds, player })` returns
`{ handlePlaybackStarted, handleProgress }`, bound in
`PlaybackPositionedVideoPlayer` alongside the persistence handlers:

- `onPlay` → `handlePlaybackStarted` (opens the gate, beside `openWriteGate`)
- `onTimeUpdate` / `onEnded` → `handleProgress`

Two refs, both for the reason `usePersistPlaybackPosition` uses one: a gate that is
closed until playback begins, so a cold load whose stored position is already past the
threshold writes nothing; and a "already marked" ref, so a lesson watched to its end
writes once rather than once per `time-update` for the remaining fifteen seconds.

The `player` handle gains a `duration` getter, so the hook prefers the lesson's
`durationSeconds` prop and falls back to what the provider reports when the prop is 0
(the player's default). `ended` is then reliable even for a lesson whose metadata is
missing a duration.

**Why not inside `usePersistPlaybackPosition`:** that hook owns *one* thing — the write
cadence for the position. Completion is a different fact written to a different port.
Two hooks bound to the same events keep each one's rule readable and separately
testable, and `PlaybackPositionedVideoPlayer` is already documented as "composition and
nothing else".

**Why the write, given completion is also derived (D4):** the derived rule needs a
duration, and the module card would otherwise have to trust its `lessonRuntimes` for
lessons the learner finished. Writing the mark makes "done" a fact any surface can read
with no duration at hand, and keeps the manual button and the finish rule producing
literally the same state.

### D7 — Three components: one dumb bar, two islands

| Component | Kind | Renders |
| --- | --- | --- |
| `WatchProgressBar` (`src/components/watch-progress-bar/`) | presentational, no storage, no i18n | the track, the fill, `role="progressbar"` with `aria-valuenow/min/max`, an `aria-label` and a visible label, both passed in |
| `LessonWatchProgress` (`src/components/lesson-watch-progress/`) | client island | reads `useLessonWatchState`, renders the bar at the watched fraction with an `N%` label, or `null` |
| `ModuleWatchProgress` (`src/components/module-watch-progress/`) | client island | reads `useModuleWatchProgress`, renders the bar with `N / M videos`, or the completed state, or `null` |

**Why the dumb bar is separate:** the two islands differ in what they count, what they
label and when they render nothing, but not in how a bar looks. Splitting keeps one
visual definition and lets the islands be tested for *policy* (when nothing renders)
against a bar tested for *presentation* (fill width, ARIA values).

Both islands render `null` rather than a zero bar — the `lesson-progress` rule about
never asserting a false state, extended to progress.

**Placement.** In the module overview row, `LessonWatchProgress` goes inside the
existing central `flex-1` column beneath the title — the row's open middle, which is
where the learner asked for it and the only place that does not compete with the
eyebrow, the duration or the "Open" action. In the showcase card, `ModuleWatchProgress`
sits between the count line and the call to action, so the panel reads *what it holds →
how far you are → the way in*.

**i18n.** New namespaces `Components.WatchProgressBar`, `Components.LessonWatchProgress`
and `Components.ModuleWatchProgress` in `en`, `es` and `pt`. The percentage itself is
formatted with `format.number(fraction, { style: "percent" })`, not string
concatenation, so a locale that writes `40 %` gets it.

### D8 — Colour is never the only signal

The bar carries `role="progressbar"` with its values and a localized accessible name;
the completed state carries the existing check plus its localized name. A learner who
cannot distinguish the gold fill from the track still gets `40%` as text beside it, and
a screen-reader user gets the same number announced.

## Risks / Trade-offs

- **Scrubbing backwards appears to lose progress.** The bar shows the stored position,
  so rewinding to re-listen shrinks it. → Completion is never lost (D6, and the
  `lesson-progress` rule), so the check mark — the signal that matters — is stable.
  A high-water mark would fix the bar but is a new persisted field, an explicit
  non-goal.
- **A learner who skips to the end gets a check mark.** Seeking to 95% marks the lesson
  complete without watching it. → Accepted deliberately: this is a self-paced course
  with a manual "Mark as complete" button that already lets anyone claim completion in
  one click. Watch-time enforcement is a different product.
- **`lessonRuntimes` grows the course-overview payload.** → Bounded in practice
  (D5); one number and one id per lesson against a page that already ships sixty poster
  URLs. Revisit only if a course reaches thousands of lessons.
- **Two client islands per row across a 214-lesson module.** Every row now mounts a
  completion mark *and* a progress bar. → Both subscribe to module-level stores rather
  than reading storage per instance, so the cost is a subscription and a map lookup per
  row, not an I/O call. The storage scan happens once, on the first subscribe.
- **The finish threshold overlaps the resume band.** A position in
  `[min(d-15, 0.95d), d-10)` reads as complete *and* still offers a resume.
  → Coherent by design (D2); called out here so a future reader does not "fix" one of
  the two constants into agreement with the other.
- **`ended` on a lesson with no duration.** A lesson whose metadata lacks a duration
  could never cross a threshold. → The `duration` fallback to the provider (D6) covers
  it; a lesson with neither is simply never auto-completed, and the manual button
  still works.

## Migration Plan

None. No stored shape changes, no key is added or renamed, and no backfill runs.
Existing positions and completions are read exactly as they are written today; the
change is additive at the read side. Rollback is reverting the code — storage is
untouched by it.

`ModuleSummary` is an internal type consumed by one view; adding a field breaks no
persisted data and no external contract.

## Testing strategy

Red first, per task. Layers, and the file each mirrors:

**Vitest unit (pure logic)**

- `src/lib/watch-progress/watch-progress.test.ts` — both predicates across the
  boundary table: mid-lesson, exactly at the threshold, one second below, past the
  duration, negative, `null`, `NaN`, zero duration, sub-15-second clip. Mirrors
  `src/lib/playback-resume-thresholds/playback-resume-thresholds.test.ts`, including
  its use of the exported constants rather than repeated literals.
- `src/hooks/use-saved-playback-positions/use-saved-playback-positions.test.ts` —
  snapshot contents, identity stability across reads, `storage`-event refresh, the
  same-tab refresh, the empty server snapshot, and a `localStorage` that throws.
  Mirrors the storage-guard tests in
  `src/adapters/persistence/browser-local-storage/browser-local-storage-progress-tracker/`.
- `src/hooks/use-lesson-watch-state/use-lesson-watch-state.test.ts` and
  `src/hooks/use-module-watch-progress/use-module-watch-progress.test.ts` — the shared
  completion rule: marked only, watched only, both, neither, no duration, empty module.
  Driven through `renderHook` from `@testing-library/react`.
- `src/hooks/use-complete-when-watched/use-complete-when-watched.test.ts` — the gate
  (no write before playback), write-once across repeated progress events, `ended`, the
  duration fallback, and no write when the threshold is never crossed. Mirrors
  `src/hooks/use-persist-playback-position/use-persist-playback-position.test.ts`,
  including its fake player object rather than a real provider.

**Vitest unit (domain)**

- `src/domain/use-cases/find-course-for-view/find-course-for-view.test.ts` — extend for
  `lessonRuntimes`: all lessons present past the leading cap, sequence order, zero for
  a reading lesson, empty for an empty module, and the existing single-`listByCourse`
  assertion still holding.

**Vitest component + RTL**

- `src/components/watch-progress-bar/watch-progress-bar.test.tsx` — ARIA values, the
  fill width, the visible label, and clamping of an out-of-range value.
- `src/components/lesson-watch-progress/lesson-watch-progress.test.tsx` and
  `src/components/module-watch-progress/module-watch-progress.test.tsx` — the *policy*:
  renders nothing at zero, renders a partial bar, renders full when complete, renders
  the completed state for a finished module, renders nothing for an empty module.
  Storage is seeded through `localStorage` in the test, as the completion tests do.
- `src/components/lesson-completion-mark/lesson-completion-mark.test.tsx` — **new**;
  this component has stories but no test today. Covers marked-only, finished-only, and
  neither.
- `src/components/module-overview/module-overview.test.tsx` and
  `src/components/module-showcase-card/module-showcase-card.test.tsx` (or the
  `course-overview` test that covers it) — the indicator is present in the right place,
  the row/card keeps its existing content and its single control, and nothing renders
  for an untouched lesson or module.

**Playwright e2e**

- `e2e/watch-progress.spec.ts`, mirroring `e2e/lesson-playback-resume.spec.ts` (which
  already seeds `localStorage` and drives a lesson): seed a position past the finish
  threshold for one lesson, load the module overview, assert the row shows a full bar
  and the completion mark, then load the course overview and assert that module's meter
  counts it. One flow, one browser path — the per-state matrix belongs in the component
  tests, not here.

Run with `PLAYWRIGHT_BASE_URL` against a dev server on a free port; `pnpm verify`
covers typecheck, format, lint and Vitest but not Playwright.

## Open Questions

None blocking. Two settled by the user before this document: reaching the end marks the
lesson complete under the existing check (rather than a second "watched" glyph), and
the module meter counts completed lessons rather than watched seconds.

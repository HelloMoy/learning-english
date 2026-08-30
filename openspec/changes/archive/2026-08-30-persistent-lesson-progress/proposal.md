## Why

A learner browsing a 107-lesson course cannot tell which lessons they have already
taken. Every row in the module overview and every row in the outline sidebar looks
identical whether the lesson was finished last week or never opened. On a course this
size, "where was I?" is the primary navigation question, and the UI answers it nowhere.

The gap is not a missing widget. It is that completion is never read and never kept:

- **Nothing reads it.** `ProgressTracker.isComplete` has zero production callers. The
  method is implemented and stubbed in tests, but no component has ever asked whether a
  lesson is complete.
- **Nothing keeps it.** The only adapter is `InMemoryProgressTracker`, server-side and
  ephemeral by design — the spec states outright that "completed state is lost when the
  in-memory adapter is reconstructed".
- **Even the button forgets.** `MarkAsCompleteButton` starts at `useState(false)` on
  every mount and never reads back. Mark a lesson, reload, and the button says
  "incomplete" again.

So the visible symptom — no completion indicator — sits on top of a real gap: there is
nowhere for "this lesson is done" to live.

The project already solved this exact shape for video playback: a browser-local-storage
adapter behind an unchanged port, per-device, no auth required. This change follows that
precedent rather than inventing a second approach.

## What Changes

- A `BrowserLocalStorageProgressTracker` adapter implements the existing
  `ProgressTracker` port against `localStorage`, mirroring
  `BrowserLocalStoragePlaybackPositionRepository` — same namespacing discipline, same
  SSR no-op guard, same injectable seam for tests.
- **BREAKING (spec):** completion stops being ephemeral. It survives reloads and server
  restarts on the device where it was recorded.
- Completion is per-device, not per-user. Without auth there is no user to key it to, and
  the change does not pretend otherwise.
- The outline sidebar marks completed lessons.
- The module overview's episode rows mark completed lessons.
- `MarkAsCompleteButton` reads its state on mount instead of assuming "incomplete", and
  its write reaches the same store the indicators read.
- The `ProgressTracker` port itself does **not** change. `markComplete` / `isComplete`
  already express everything needed.

## Capabilities

### New Capabilities

- `lesson-progress`: durable per-device completion — the browser adapter's storage
  contract, the client-side composition root that reads it, how the indicator resolves
  after hydration, and the rule that marking is idempotent and reversible only by the
  learner.

### Modified Capabilities

- `course-platform-domain`: the "`markLessonComplete` is ephemeral in v1" requirement
  asserts completed state is lost when the adapter is reconstructed, and that the
  contract is "per-call, not persisted". Both stop being true for the browser adapter.
  The requirement changes to say persistence depends on which adapter is bound, with the
  in-memory one remaining the server-side default.
- `cinema-lesson-view`: the outline requirement describes module expansion and the
  current-lesson marker but says nothing about completion. It gains the completed-lesson
  indicator.
- `cinema-module-overview`: episode rows show an eyebrow, title, duration and "Open".
  They gain a completion indicator.

## Impact

**New code**

- `src/adapters/persistence/browser-local-storage/browser-local-storage-progress-tracker/`
  — the adapter, its test, following the folder-per-entity rule.
- A client hook under `src/hooks/` — the browser composition root, the only place naming
  the concrete adapter, exactly as `use-playback-position` does today.

**Changed code**

- `src/components/lesson-view/lesson-list/lesson-list.tsx` — lesson rows gain the mark.
- `src/components/module-overview/module-overview.tsx` — episode rows gain the mark. This
  file is a **Server Component**, so the mark needs a client boundary; the outline is
  already inside `lesson-view.tsx`'s `"use client"` subtree and does not.
- `src/components/lesson-view/mark-as-complete-button/mark-as-complete-button.tsx` —
  reads on mount, writes through the browser store.
- `src/messages/{en,es,pt}.json` — copy for the indicator's accessible name.

**Not affected**

- The `ProgressTracker` port contract.
- `markLessonComplete`, `InMemoryProgressTracker`, and the server-side dependency graph,
  which stay as the SSR/test default.
- Playback position, which remains a separate concern — a saved position still does not
  imply completion.

## Non-goals

- **Auth or cross-device sync.** Completion lives on one browser. Migrating it to a user
  account is the follow-up this change is deliberately shaped to allow, not part of it.
- **Auto-completion from watch percentage.** Marking stays an explicit act. The existing
  spec keeps `completed` and `lastPosition` independent, and this change does not
  revisit that.
- **Course- or module-level progress**: "7 of 13 done", percentage bars, a resume-course
  CTA. Only the per-lesson mark.
- **An "unmark" affordance**, unless it falls out of the existing button's behaviour.
- **Migrating the server-side tracker** to durable storage, or removing it.
- Touching the home page or course overview surfaces.

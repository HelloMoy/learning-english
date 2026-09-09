## Why

A learner returning to a 107-lesson course cannot see how far they got. The module
overview lists every video identically — the row for a video watched to the last
second looks exactly like the row for one never opened — and the course overview's
showcase cards say how much content a module holds but nothing about how much of it
is behind the learner. The only progress signal that exists today, the gold check
mark, appears solely when the learner remembers to press **Mark as complete**; the
saved playback position that already records where they stopped is never shown
anywhere outside the resume overlay.

The data to answer "where was I?" is already persisted per device. This change spends
it on the three surfaces where a learner scans for their place: the module overview,
the course overview's cards, and the lesson view's outline.

## What Changes

- Each video row in the module overview gains a **watch progress bar** showing what
  fraction of that video has been watched, derived from the saved playback position
  and the lesson's duration. A row with nothing watched shows no bar.
- Reaching the end of a video — the last 15 seconds, or 95% of the duration,
  whichever comes first — **marks the lesson complete automatically**, through the
  same `ProgressTracker` port and the same gold check the manual button writes.
  There is one notion of "done", not two. The manual **Mark as complete** button
  stays, as a shortcut for lessons the learner does not need to finish watching.
  **BREAKING (spec-level)**: the `playback-position` capability currently declares
  auto-marking out of scope; that requirement is replaced.
- A completed video's row renders its bar full and carries the completion mark, so
  "finished" is legible at a glance as well as announced.
- The **Course outline** — the lesson view's sidebar and its mobile drawer — gains the
  same bar under each lesson row, so a learner scanning where to go next sees how far
  they got without leaving the lesson they are on. The outline already carries the
  completion mark; this adds the partial state it could not express.
- Each module showcase card on the course overview gains a **module progress meter**
  reading *N / M videos* with a bar, counting completed lessons against the module's
  lesson count. A module with nothing completed shows no meter.
- `findCourseForView`'s per-module summary reports **every** lesson id in the module,
  not only the leading six, so the card can count completions against the real set.
- A new client composition root exposes a synchronous, subscribable snapshot of all
  saved playback positions, mirroring what `useLessonCompletion` already does for
  completion. The existing per-lesson async `usePlaybackPosition` stays as the
  player's write path.

## Capabilities

### New Capabilities

- `watch-progress`: the derived "how much of this lesson has been watched" concept —
  the client snapshot of all saved positions, the pure watched-fraction and
  finished-watching predicates, the rule that finishing a video completes the lesson,
  and the two progress indicators (per-video bar, per-module meter) including their
  pre-hydration behaviour and the rule that the per-video bar is a passive indicator
  wherever a row is itself a link.

### Modified Capabilities

- `playback-position`: the requirement stating that a saved position never affects
  completion is replaced — crossing the finish threshold now marks the lesson
  complete. Positions below the threshold still leave completion untouched, and
  marking complete still never alters a saved position.
- `lesson-progress`: completion may now be produced by finishing a video as well as
  by the manual button; the storage contract, the per-device scope and the
  "no false pre-hydration state" rule are unchanged and gain the new indicators.
- `cinema-module-overview`: video rows gain the watch progress bar alongside the
  existing completion indicator, without displacing the eyebrow, title, duration or
  "Open" action.
- `cinema-lesson-view`: outline rows gain the watch progress bar beneath the lesson
  title, without displacing the current-lesson marker or the completion mark, and
  without adding a tab stop.
- `cinema-course-overview`: showcase cards gain the module progress meter in the left
  panel, below the count line.
- `course-platform-domain`: `findCourseForView`'s module summary additionally reports
  the ids of all lessons in the module, still with no extra repository call.

## Non-goals

- **No cross-device sync.** Progress stays in `localStorage`, per browser profile, as
  completion and position already do. Auth and a server-backed adapter are a separate
  change.
- **No progress on the home page, the continue-watching rail or the breadcrumb.** Only
  the three surfaces the learner scans for their place: the module overview, the course
  overview's cards, and the lesson view's outline.
- **No course-level progress bar.** Aggregating modules into a course figure is a
  follow-up once the per-module meter has proven itself.
- **No un-completing.** Neither scrubbing backwards nor rewatching clears a
  completion, and no "mark as not complete" affordance is introduced.
- **No new persisted field.** Watched fraction and finished-watching are *derived*
  from the position and duration already stored; nothing new is written to storage
  beyond the completion key the existing tracker owns.
- **No change to the resume overlay**, its thresholds, or the write cadence.

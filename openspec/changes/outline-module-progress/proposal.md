## Why

The course outline says where the learner is, but not how far they have got. A
learner has to open each lesson (domain `Module`) and count the completion marks
on its videos to learn whether it is finished, and the only course-wide reading
is a thin edge meter on the mobile row with no number on it. On a 107-video
course, "how much is left, and which lessons are done?" is the question the
outline is best placed to answer, and today it doesn't.

The design was chosen from eight variants on the Claude Design canvas
<https://claude.ai/artifact/KReptKTpAyJTzYnA29CZp2> (board "★ Recomendada").

## What Changes

- Each lesson row in the outline (a domain `Module` disclosure) gains a leading
  **completion ring** filled to the share of its videos the learner has
  completed, and a line under the title stating the reading: `4 / 6 videos · 67%`
  in progress, `Lesson completed` when finished (the ring becomes a solid gold
  disc with a check), and `6 videos` when untouched or before hydration.
- The outline gains a **course summary** under its heading: a bar filled to the
  course's completed share, the percentage, and the line
  `35 of 107 videos · 4 of 10 lessons completed`. It renders in both the desktop
  sidebar and the expanded mobile drawer.
- On the mobile compact row, the list-icon tile becomes a **completion ring**
  that shows the course percentage once there is a reading (the list icon stays
  inside the ring until then). The ring takes over the edge meter's
  `progressbar` semantics, and **the edge meter is removed**.
- Every reading counts through the shared `countsAsComplete` rule and appears
  only after hydration; before it, rings and bars render their track alone and
  no reading is claimed.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `cinema-lesson-view`: the outline states per-lesson (module) progress and a
  course summary; the mobile compact row's tile becomes a completion ring and
  its edge meter is retired, so the requirements "The course outline is a
  compact row on small viewports" and "The mobile row reports course completion
  only once it can be known" change, and a new requirement covers the outline's
  progress readings.

## Non-goals

- The video rows inside an expanded lesson are unchanged — their completion
  marks and watch bars already exist (`The outline marks lessons the learner has
  already completed`).
- No "up next" card, time-left estimate, segmented lesson map or folding of
  completed lessons (variants V4, V7, V8 of the canvas).
- No new persisted state and no change to how completion is recorded.
- No change to the shared `ProgressRing` component used by the course overview.

## Impact

- `src/components/lesson-view/outline/`, `module-list/`, `outline-drawer/` and a
  new `src/components/lesson-view/` ring component, with tests and stories.
- `src/messages/{en,es,pt}.json` — new keys under `Components.Outline`.
- `e2e/lesson-outline-drawer.spec.ts` may need its meter wording updated; no
  route, API or dependency change.

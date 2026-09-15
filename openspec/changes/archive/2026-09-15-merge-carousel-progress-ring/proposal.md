## Why

PR #56 (learner onboarding and My learning) cannot merge: while it was open, `main` took PR #55
(course overview carousel), and both branches added a component at `src/components/progress-ring`
with different APIs. The carousel's lesson progress panel depends on `main`'s ring, and this branch's
learner card and My learning cards depend on their own, so the merge needs one ring that both use.

## What Changes

- Adopt `main`'s shared `ProgressRing` unchanged — size in pixels, `fraction` or `segments`, and the
  centred label as `children` — with its tests and stories.
- Move this branch's two callers onto it: the learner card's progress tooltip (a 44px ring with the
  locale-formatted percentage) and the My learning lesson cards (44px rings, 72px on the lead card).
- Retire this branch's `share`/`label` ring along with its tests and stories.
- Keep `ContinueWatching` and `CourseLevelCard` deleted: nothing imports them, and #55 only reworded
  their comments.
- Keep this branch's doc comment on `LessonProgressSlice`; `main`'s side of that conflict describes an
  unrelated preview constant.
- The only visible difference is that the rings on the learner card and the lesson cards are drawn
  like the carousel's: a border-coloured track and a gold fill with a soft glow.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `my-learning`: the lesson cards' rings are the same progress ring the course overview draws.

## Impact

- **Components:** `progress-ring` (take `main`'s), `learner-card`, `course-progress-list`; their tests
  and stories.
- **Deleted, kept deleted:** `continue-watching`, `course-level-card`.
- **Domain:** a doc comment in `find-course-catalog.ts`; no code change.
- **Process:** resolves the merge of `origin/main` into `feat/bilingual-editorial-home` so PR #56
  merges.

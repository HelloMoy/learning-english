## Why

On the course overview, a lesson (module) holding exactly one video skips its module overview and
drops the learner straight into the video, while a lesson holding several opens its overview. The
same tile therefore behaves two ways depending on a count the learner cannot see before clicking —
most visible in the Atlas of American Sounds, where many lessons hold a single video. A one-video
lesson should behave exactly like an n-video lesson.

## What Changes

- A course overview lesson tile always opens that lesson's module overview, whatever the number of
  videos it holds.
- The module overview finale's **Start Lesson NN →** button, which the spec ties to "the same
  destination the course overview's tile opens", follows suit: it always opens the next lesson's
  module overview.
- The single-video shortcut (`moduleEntryPath`) is removed; callers use `moduleOverviewPath`.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `cinema-course-overview`: "Every lesson is a progress-ring tile that opens its lesson" — a tile
  opens the module overview regardless of how many videos the lesson holds; the "one-video lesson
  opens its video" scenario is inverted.
- `cinema-module-overview`: "The route ends at the module's prize" — Start Lesson NN → opens the next
  lesson's module overview, including when that lesson holds a single video.

## Non-goals

- No redirect or change on the module overview page itself: a one-video module overview keeps
  rendering its route, progress panel and prize as today.
- No change to links that deliberately target a video: Start course, Continue where you left off,
  resume/continue tiles, the lesson view's next/previous and outline.
- No change to the lesson ring tile's appearance, copy or progress reading.

## Impact

- `src/i18n/lesson-routes.ts` (+ test): `moduleEntryPath` removed.
- `src/components/lesson-ring-tile/lesson-ring-tile.tsx` (+ test).
- `src/components/module-overview/module-overview.tsx` (+ test), `src/components/module-prize/module-prize.tsx` (JSDoc reference).
- e2e: a course overview check that a one-video lesson's tile lands on its module overview.

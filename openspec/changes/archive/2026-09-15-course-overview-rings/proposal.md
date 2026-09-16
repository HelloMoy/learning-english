## Why

The course overview hides the course behind a carousel: a learner has to page through posters
one by one to see what the course holds, and the progress panel that answers "where am I?"
sits below the fold on both a 1440×900 desktop and a 390×844 phone. The page also repeats the
module's video list, which the module overview already owns. Of thirteen clickable prototypes
reviewed with the product owner, the "Anillos" (rings) direction was chosen: the course's
progress and every lesson visible at once, with one way to continue.

## What Changes

- **BREAKING (UI)**: the poster carousel (arrows, dots, swipe, keyboard selection) is removed
  from the course overview.
- **BREAKING (UI)**: the progress panel under the carousel (ring, "Pick up …", Up next) is
  removed.
- The page opens with two tiles side by side (stacked on a phone):
  - a **continue tile** showing the artwork, position and title of the video the learner
    continues with, and one primary action labelled **Start course**, **Continue where you
    left off** or **Watch again** depending on the learner's progress;
  - a **course progress tile** with the course title, a large ring filled to the share of
    watched videos, its percentage, the watched count and the time left.
- Below them, **one tile per lesson (module)** in `sequence` order: the lesson's artwork band
  with its outlined ordinal, a large progress ring with the lesson's percentage, a status
  (Completed / In progress / Not started), the title, and the watched count with the time left.
  The lesson in progress is edged in gold. A tile opens the module overview — or the video,
  when the lesson holds exactly one. Tiles never list a lesson's videos.
- On a phone each lesson tile becomes a row led by its ring.
- Progress is read on this device after hydration; the server render shows the tiles with
  unfilled rings and no state-specific copy.
- The loading shell is reshaped to the new layout.
- Copy for the new tiles is added in `en`, `es`, `pt`; copy used only by the carousel and the
  panel is removed.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `cinema-course-overview`: the hero requirement becomes the continue tile plus course
  progress tile; the carousel and progress-panel requirements are removed; a new requirement
  describes the lesson ring tiles.

## Non-goals

- Changing the module overview, the lesson page or the home.
- Changing how completion is decided (`countsAsComplete`) or how progress and the
  continue-watching record are stored.
- Syncing progress across devices.
- Showing any per-video list on the course overview.
- A light-theme-specific design beyond what the existing tokens already provide.

## Impact

- `src/components/course-overview/` — rewritten around the new tiles.
- New client components for the continue tile, the course progress tile and the lesson ring
  tile; a pure resolver for the continue target under `src/lib/`.
- Removed: `src/components/course-carousel/`, `src/components/lesson-progress-panel/`,
  `src/components/module-poster/` (only the carousel uses it), with their stories and tests.
- `src/app/[locale]/courses/[courseSlug]/loading.tsx` and its test.
- `src/messages/{en,es,pt}.json` (`CourseCatalog.courseOverview`).
- `e2e/course-overview.spec.ts`, `e2e/watch-progress.spec.ts` (both assert on the carousel or
  the panel).
- Reuses `useCompletedLessons`, `useSavedPlaybackPositions`, `useContinueWatching`,
  `moduleProgress` / `selectInitialModuleIndex`, `ProgressRing`-style SVG markup and the
  existing tokens. No domain, port or adapter changes.

## Why

The module overview is a flat list of identical rows. A learner who comes back to a
17- or 25-video module has to scan every row for a small check mark to find where they
stopped, nothing tells them how much of the module is left, and the next video looks
exactly like every other one. The "E · Ruta" direction chosen in the design canvas turns
the page into a route: finished videos recede, the next video is featured with one
primary action, and the module's progress is stated plainly.

## What Changes

- The module overview's video list becomes a **route**: a vertical rail with one step
  per lesson, in sequence order. Each step shows its state on the rail — finished,
  current, or upcoming.
  - **Finished** steps are compact: `Video N · M min` and the title, muted, with a
    "Watch again" action.
  - The **current** step — where the learner was last: the last opened video of this
    module (from the continue-watching record) if it is unfinished, otherwise the next
    unfinished video after it; with no record in this module, the same rule from the
    furthest video with progress — is
    expanded into a featured card: poster, "You are here · Video N" eyebrow, title,
    watch progress with minutes left, and one primary action ("Continue" when partly
    watched, "Start" when not started).
  - **Upcoming** steps keep their thumbnail, `Video N · M min`, title and the existing
    "Watch video" action.
- A **module progress panel** states the percentage finished (as a ring), `N of M
  videos`, and the watch time left in the module. It sits in a sticky side column on
  wide viewports and above the route on phones. A fully finished module states that it
  is finished and features no step.
- The header adds the module's total runtime next to its video count.
- Until the browser has read the learner's progress, the route renders every step as
  upcoming and the panel renders no figures, so the first frame never asserts progress
  that may be false.
- The route is designed for the dark theme; the light theme inherits the same tokens
  without dedicated tuning.
- **BREAKING (UI):** the row-per-lesson list with a completion check mark is replaced;
  `module-overview.tsx`, its tests and stories are rewritten.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `cinema-module-overview`: the video list becomes a route with finished / current /
  upcoming steps; a module progress panel and the header runtime are added; the
  completion indicator requirement changes from a per-row check mark to the step's
  state, and the client-rendered boundary moves from two row islands to the route and
  panel.

## Non-goals

- No sections or groups inside a module (e.g. "Short vowels", "Diphthongs"). Modules
  have no such structure and the route stays flat for every module.
- No count of PDF guides or other resources: the domain `Lesson` does not carry
  resources on this route, and adding them is a separate change.
- No change to how completion or playback position are stored or decided
  (`lesson-progress`, `watch-progress`, `playback-position` stay as they are).
- No light-theme-specific design work.
- No change to the course overview, the lesson page or the home.

## Impact

- `src/components/module-overview/**` — component, tests and stories rewritten; new
  colocated pieces for the route step and the progress panel.
- `src/hooks/**` — a hook deriving the module's route state (per-lesson state, current
  lesson, finished count, time left) from the existing completion and playback-position
  stores.
- `src/lib/**` — pure functions for route state and runtime formatting inputs.
- `src/messages/{en,es,pt}.json` — new keys under `CourseCatalog.moduleOverview`.
- `e2e/` — module overview flows that assert on the old rows are updated.

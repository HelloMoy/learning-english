## Why

The shelf layout shipped by `course-overview-marquee` (B · Marquesina) was reviewed on the
real page and rejected in favour of two later design explorations: **J3 · Carrusel** — the
course's lessons as cinema posters in a carousel — and, beneath it, **K3 · Anillo** — a
progress panel that invites the learner to *continue* the selected lesson when they have
started it, or to *start* it when they have not. The row of video thumbnails under the
carousel is explicitly not wanted.

## What Changes

- **BREAKING (spec)** The course hero becomes the J3 hero: a "Now showing · N lessons"
  eyebrow, the course title, one meta line (videos · total runtime) and **Start course**.
  The backdrop poster and the description paragraph are removed from the hero.
- **BREAKING (spec)** The module shelves are replaced by a **poster carousel**: one
  portrait poster per module (a collage of its first lessons' artwork, an outlined ordinal,
  its title and its videos · runtime). One poster is selected and sits in the centre,
  larger and gold-edged; its neighbours recede. Arrows, dots, keyboard arrows and swipe move
  the selection. Clicking a neighbour selects it; clicking the selected poster opens the
  module — or, for a module holding a single video, that video.
- **New:** a **lesson progress panel** under the carousel, for the selected module, in one
  of three states read from the learner's progress on this device:
  - **Not started** — a ring split into one segment per video with the first lit,
    "N videos ready", **Start this lesson** (opens the module's first video), and the first
    videos listed as "Up next".
  - **In progress** — a ring filled to the share of videos completed ("3 of 25 videos"),
    "Pick up <video>" naming the first unfinished video, how long is left in it and in the
    module, **Continue** (opens that video) and **Open lesson**, and the videos that follow
    it as "Up next".
  - **Completed** — a full ring, "All N videos watched", **Watch again** (first video) and
    **Open lesson**.
- On load the carousel selects the module the learner is in the middle of, if any.
- The module summary the page reads carries **every** lesson of each module — id, sequence,
  title, runtime and poster — replacing the capped `leadingLessons` preview and the
  separate `lessonRuntimes` list, because the panel must name any video in the module.
- **Removed:** `ModuleShelf`, `VideoCard`, the hero backdrop, the "View all" and "+N more"
  affordances. The superseded `course-overview-marquee` change is withdrawn (never merged).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `cinema-course-overview`: the hero is simplified; module showcase cards are replaced by a
  poster carousel with a single selected module; a progress panel for the selected module
  is added; the whole-card click requirement is replaced by the carousel's selection and
  open behaviour.
- `course-platform-domain`: a module summary lists every lesson with id, sequence, title,
  runtime and poster instead of a capped preview plus a runtime list.

## Non-goals

- The module overview, lesson page and home page are unchanged.
- Progress stays device-local (`localStorage`); no server-side progress, no accounts.
- No autoplay, auto-advancing carousel, or parallax/3D animation beyond scale and fade.
- No per-lesson "sounds you'll practice" tags — that needs authored content that does not
  exist; the panel lists real video titles instead.
- The light theme gets no bespoke artwork; it uses the existing tokens.

## Impact

- `src/domain/use-cases/find-course-for-view/` — `ModuleSummary.lessons` replaces
  `leadingLessons` and `lessonRuntimes`; `LEADING_LESSONS_CAP` is removed.
- `src/lib/` — a pure function deciding a module's panel state and resume video.
- `src/components/` — new `CourseCarousel` (client), `LessonProgressPanel` (client),
  `ProgressRing`; rebuilt `CourseOverview`; `ModuleShelf` and `VideoCard` deleted;
  `ModuleWatchProgress` callers updated.
- `src/messages/{en,es,pt}.json` — carousel and panel copy; shelf keys removed.
- `src/app/[locale]/courses/[courseSlug]/loading.tsx` — skeleton traces hero, carousel, panel.
- `e2e/course-overview.spec.ts`, `e2e/one-click-navigation.spec.ts` — rewritten for the
  carousel and panel; `openspec/changes/course-overview-marquee/` — deleted.

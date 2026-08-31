## Why

The home route renders `entries[0]` of the catalog as a single hero plus a featured-course rail, so it reads as a site about one course. The catalog is about to hold several courses at different levels (Basic, Advanced, and more later), and the current layout has no place to put the second one — the featured rail gives one course a whole column and says nothing about the rest.

The wiring underneath has the same shape: `getCoursePlatformDeps()` picks *either* the A1 seed *or* the filesystem-backed content seed, so the catalog can never return more than one course no matter what the UI does.

## What Changes

- The home presents the catalog as an ordered **ladder of levels** under an explicit `Available courses` heading: a numbered track (`01 → 02 → …`) and one card per course carrying its ordinal, title, description, leading modules, counts, and a call to action. Courses beyond the first stop being invisible.
- The home gains a **`Continue watching`** section above the ladder that resumes the last lesson the learner opened, with its course/module breadcrumb, its saved playback position, and a `Resume` action. It renders only when there is something to continue.
- The course the learner is part-way through is marked on its ladder card, and that card's call to action becomes `Continue course` instead of `Start course`.
- **BREAKING** (dev-facing): `USE_COURSE_CONTENT_SEED=1` now **adds** the filesystem-backed course to the catalog alongside the A1 seed instead of replacing it. Unset still means "A1 seed only", so the default boot is unchanged.
- `Course` gains a `sequence` field so the ladder's order is data, not array position, and `listAvailable()` returns courses in that order.
- `findCourseCatalog` entries gain the course's leading modules so a card can show what is inside without a second round trip.
- The featured-course rail (`FeaturedCourse`) leaves the home. `PosterCard`, `GoldBadge`, `Eyebrow` and `PlayButton` stay and are reused by the new components.

## Capabilities

### New Capabilities

- `continue-watching`: remembering the last lesson location the learner opened and offering it back on the home, resolved through the domain and combined with the existing saved playback position.

### Modified Capabilities

- `cinema-home`: the home stops rendering a single featured course and renders an ordered ladder of every catalog course plus a continue-watching section.
- `course-platform-domain`: `Course` gains `sequence`; `CourseRepository.listAvailable()` orders by it; `findCourseCatalog` entries carry leading modules; a `ContinueWatchingRepository` port joins the domain.
- `course-content-storage`: `USE_COURSE_CONTENT_SEED` switches from "replace the seed" to "add the filesystem-backed course to the catalog".

## Non-goals

- **Per-course aggregate progress.** Cards show catalog counts and a coarse "in progress / not started" mark derived from the continue-watching record. Counting how many videos of a course are finished needs a progress query that does not exist yet, and is not part of this change.
- **A third course, or any "coming soon" placeholder.** The catalog ships with the two courses that exist. The ladder is built to take an Nth course, but none is invented here.
- **Naming levels ("Basic", "Advanced") as course metadata.** The ordinal comes from `Course.sequence` and renders as a localized `Level {number}`; the level word already lives in the course title. No `level` field is added to the entity.
- **Cross-device sync.** The continue-watching record lives in `localStorage`, per device, like completion and playback position already do. Auth and server-side persistence stay out.
- **Changing the course overview, module overview, or lesson pages**, beyond the one client component the lesson page needs in order to record where the learner is.
- **Replacing the `myList` / "+ My List" placeholder button.** It leaves the home with the hero it belonged to; no list feature is introduced.

## Impact

- **Domain**: `src/domain/entities/course/course.ts` (new `sequence`), `src/domain/ports/continue-watching-repository/**` (new), `src/domain/entities/continue-watching-location/**` (new), `src/domain/use-cases/find-course-catalog/**` (leading modules, ordering), `src/domain/use-cases/find-continue-watching/**` (new).
- **Adapters**: `use-case-dependencies.ts` (both seeds at once), new `CompositeLessonRepository` / `CompositeResourceRepository`, new `BrowserLocalStorageContinueWatchingRepository`, `InMemoryCourseRepository` (ordering), both seed files (`sequence`).
- **UI**: `src/app/[locale]/page.tsx`, new `course-ladder/`, `course-level-card/`, `continue-watching/` components, new `use-continue-watching` hook, a `remember-continue-watching` client island on the lesson page, retirement of `FeaturedCourse` from the home. New server action under `src/app/[locale]/actions.ts`.
- **i18n**: new keys under `HomePage` and `Components.*` in `en.json`, `es.json`, `pt.json`.
- **Tests**: unit (entities, use cases, adapters), component (RTL) for every new component, e2e for the home ladder and the continue-watching round trip.
- **Docs**: `openspec/specs/` deltas for the three modified capabilities and the new one.

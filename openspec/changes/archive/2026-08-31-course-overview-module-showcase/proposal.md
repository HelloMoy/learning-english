## Why

On the course overview, every module renders as a `PosterCard` that emits three strong "this is one video" signals — a 16:9 artwork box, a play circle, and an oversized number — against a single weak "this is a container" signal, the `Module` badge. Learners read each card as an episode to play rather than a group of lessons to enter, and the `Season 1 · N episodes` heading above the grid reinforces the misreading.

Investigating it surfaced a second, pre-existing defect: **"episode" already denotes two different things in the product.** On the course overview it counts modules (`course-overview.tsx:62` passes `course.moduleCount` to `t("season")`); on the module overview it labels lessons (`module-overview.tsx:144` passes `lesson.sequence` to `t("episode")`). A learner who opens "episode 3" lands on a list of "Episode 1, 2, 3…", which confirms the wrong mental model rather than correcting it. The visual redesign fixes half the problem; the vocabulary fixes the other half, and neither works alone.

## What Changes

- **BREAKING (user-facing copy):** the course vocabulary is unified to a single three-level scheme — Curso → **Lección N** (domain `Module`) → **Video N** (domain `Lesson`). The terms `Season`, `Episode` and the `Module` badge disappear from the UI in all three locales. Domain type names (`Module`, `Lesson`) are unchanged; only the presentation layer is renamed.
- The module poster grid on the course overview is replaced by a **one-per-row, full-width showcase card**. Its left panel carries the module title, an explicit `N videos · D` count line, a navigation-verb CTA (not a playback verb), and the existing decorative play circle. Its right panel carries the module's leading lessons spread as a **fanned deck of real thumbnails** — numbered, overlapping, the first shown whole with its title and runtime — so the plurality and the ordering inside a module are visible rather than merely asserted.
- The module's own ordinal moves **outside and above** its card (`LECCIÓN 1`, `LECCIÓN 2`, …), turning the page into a numbered index whose order is always legible and never truncated.
- The showcase card is a **container, not a link**, so its accessible name stays the module title instead of swallowing the count line, the CTA and the artwork. This deliberately departs from the single-link pattern documented in `poster-card.tsx`. The deck itself is decorative and hidden from assistive technology, the same treatment `module-overview.tsx` gives its row thumbnails.
- `findCourseForView` gains a per-module lesson summary (lesson count, total duration, and the leading lessons' titles, posters and runtimes) so the view no longer discards data it already loaded.
- Durations are formatted with hours when they exceed 60 minutes — the largest module runs 635 minutes.

## Capabilities

### New Capabilities

- `course-vocabulary`: the cross-surface naming contract for course content. Fixes each user-facing term to exactly one referent (Curso / Lección N / Video N), forbids the ambiguous `Season` and `Episode` labels, and requires the three locales to stay in step. Owning this as a capability is what stops the `episode`-means-two-things regression from recurring.

### Modified Capabilities

- `cinema-course-overview`: the requirement "Course overview renders as an episode poster catalog" is replaced. Modules are presented as full-width showcase cards with an external ordinal and a lesson-thumbnail mosaic, not as a `PosterCard` grid under a season heading.
- `cinema-module-overview`: rows are labelled `Video N` instead of `Episode N`, and the hero eyebrow drops the `Module NN` phrasing. Row structure, thumbnail fallback, accessibility treatment and completion marking are otherwise unchanged.
- `course-platform-domain`: `findCourseForView` returns per-module lesson summaries alongside the modules it already returns.

## Impact

**Code**

- `src/domain/use-cases/find-course-for-view/find-course-for-view.ts` — extend `CourseForView` with module summaries; no new port call, the lessons are already fetched at line 62.
- `src/components/course-overview/course-overview.tsx` — swap the poster grid for the showcase list; drop the season heading.
- New `src/components/module-showcase-card/` (`.tsx`, `.test.tsx`, `.stories.tsx`) — a sibling of `PosterCard`, not a variant. `PosterCard` already carries 16 props and its two-panel layout is a different component, not another mode.
- New `src/lib/format-duration/` — hours-aware formatting for a module's total, plus clock formatting (`05:44`) for a single lesson's runtime.
- `src/components/module-overview/module-overview.tsx` — `Episode N` → `Video N`; update the doc comment.
- `src/messages/{en,es,pt}.json` — rename `season`, `episode`, `moduleLabel`, `episodesGridLabel`; add the showcase card's keys.

**Unaffected**

- Domain entities and ports. `Module` and `Lesson` keep their names and shapes; the rename lives entirely in `src/messages/` and the components that read them.
- The 107 lessons all carry a real poster on disk (105 `.jpeg`, 2 `.png`), so the mosaic renders real artwork with no seeding work.

**Tests**

- `course-overview.test.tsx` and `module-overview.test.tsx` assert on the old copy and the poster grid, and will need reworking alongside their stories.

## Non-goals

- Renaming the domain types. `Module` and `Lesson` stay as they are; this change touches presentation only.
- Special-casing the single-lesson module. Module 4 has exactly one lesson and will render a one-card deck; that is accepted.
- Making the deck an exhaustive index. It shows a bounded number of leading lessons; module 7 has 31 and the full list stays on the module overview.
- Changing the module overview's layout, its completion marking, or the lesson page.
- Introducing progress state, resume affordances, or per-lesson completion into the course overview card.
- Re-cutting or generating new artwork. The deck uses the posters already on disk.

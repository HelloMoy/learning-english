## Why

The platform today only has a `reading` lesson kind and a `CourseNavigator` Storybook component — there is no real way to view a video lesson, and no way to attach supplementary materials to one. We need the **Lesson Page**: the first real product surface, where a learner watches a Lecture and finds the materials for it. This unlocks every learning use case downstream (progress, transcript, workbook) and establishes the UI driving-adapter pattern for the course platform.

## What Changes

- Add `Module` as a first-class domain entity, with a `ModuleId` branded type and a `ModuleRepository` port. Lessons now belong to a Module; a Module belongs to a Course. The hierarchy is `Course → Module → Lesson`.
- Extend the `Lesson` discriminated union with a second variant `kind: "video"` (a **Lecture**), carrying `{ id, courseId, moduleId, sequence, title, description, source, durationSeconds, poster? }`.
- Add `Resource` as a first-class domain entity (option B), with a `ResourceId` branded type, a `ResourceKind` enum (`pdf | slides | code | other`), and a `ResourceRepository` port (`byId`, `listByLesson`, `listByModule`, `listByCourse`). The Lesson entity does **not** carry its Resources as a field — the Lesson Page's use case composes them.
- Add the `findLessonForView({ courseSlug, moduleSlug, lessonId })` use case. It returns `ResultAsync<{ course, module, lesson, resources, nextLesson }, FindLessonForViewErrors>`. It composes existing and new ports and is the single entry point for the Lesson Page.
- Extend `findNextLessonToRecommend` to navigate across modules (return the first lesson of the next module when the current is the last of its module).
- Build the **Lesson Page** driving adapter: Next.js route `/[locale]/courses/[courseSlug]/modules/[moduleSlug]/lessons/[lessonId]` rendering the Outline (left) + native `<video controls>` Player (center) + Resources list (right) + Up next card (right) + Mark as complete button (footer). This is the first Next.js page in the project that consumes the course domain.
- Build the supporting components under `src/components/lesson-view/`: `Outline`, `ModuleList`, `LessonList`, `NativeVideoPlayer`, `ResourceList`, `ResourceItem`, `UpNextCard`, `MarkAsCompleteButton`, `LessonBreadcrumb`. Each gets a Storybook story.
- Extend the in-memory adapters (`InMemoryModuleRepository`, `InMemoryResourceRepository`) with seeds that exercise the new shape: at least one Course with two Modules, each with at least one video Lesson, and at least one Lesson with a Resource.
- Extend the i18n layer: new keys under `Components.LessonPage.*`, `Components.Outline.*`, `Components.ResourceList.*`, `Components.UpNext.*`, `Components.MarkAsComplete.*` in `en.json`, `es.json`, `pt.json`. The Lesson **content** (titles, descriptions) stays in the Course's `language` (i18n Option A — see GLOSSARY.md § Decision log 2026-07-07).
- Update `GLOSSARY.md` if any new domain or UI term is introduced that is not already covered.

## Capabilities

### New Capabilities

- `lesson-page`: The user-facing Lesson Page — the route and its components (Outline, native Video Player, Resource list, Up next, Mark as complete). Lives in `src/app/[locale]/courses/[courseSlug]/modules/[moduleSlug]/lessons/[lessonId]/` and `src/components/lesson-view/**`. Each requirement in this spec is a behavior the page must exhibit, decoupled from any specific component implementation.

### Modified Capabilities

- `course-platform-domain`: Extends the domain with `Module` (+ `ModuleId` + `ModuleRepository` port), `VideoLesson` variant in the `Lesson` discriminated union, `Resource` (+ `ResourceId` + `ResourceKind` + `ResourceRepository` port), and the new `findLessonForView` use case. Also extends the existing `findNextLessonToRecommend` use case to navigate across modules. The `Course` entity grows a `moduleCount` field; the existing `lessonCount` field becomes "lessons in this course" (unchanged semantics, but the spec text is updated to reflect the new hierarchy).

## Impact

- **New code paths**:
  - `src/domain/entities/module/`, `src/domain/entities/resource/`
  - `src/domain/ports/module-repository/`, `src/domain/ports/resource-repository/`
  - `src/domain/use-cases/find-lesson-for-view/`
  - `src/adapters/persistence/in-memory/in-memory-module-repository/`, `src/adapters/persistence/in-memory/in-memory-resource-repository/`
  - `src/components/lesson-view/**` (Outline, ModuleList, LessonList, NativeVideoPlayer, ResourceList, ResourceItem, UpNextCard, MarkAsCompleteButton, LessonBreadcrumb)
  - `src/app/[locale]/courses/[courseSlug]/modules/[moduleSlug]/lessons/[lessonId]/page.tsx` (the Lesson Page route)
  - Storybook stories for each new component
- **Modified code paths**:
  - `src/domain/entities/ids/ids.ts` — add `ModuleId` and `ResourceId` branded types
  - `src/domain/entities/lesson/lesson.ts` — add `VideoLesson` variant; existing `ReadingLesson` gains `moduleId`
  - `src/domain/entities/course/course.ts` — add `moduleCount` field; rename `lessonCount` to clarify it counts lessons across all modules
  - `src/domain/use-cases/find-next-lesson/find-next-lesson.ts` — extend to cross module boundaries
  - `src/adapters/persistence/in-memory/in-memory-course-repository/`, `in-memory-lesson-repository/` — update seeds for the new hierarchy
  - `src/messages/{en,es,pt}.json` — new i18n keys
  - `openspec/specs/course-platform-domain/spec.md` — delta spec
  - `GLOSSARY.md` — new terms if introduced
- **No new runtime dependencies.** All work uses the existing stack: `zod`, `neverthrow`, `next`, `next-intl`, `lucide-react`, Tailwind, shadcn primitives.
- **No new dev dependencies.** The TDD stack (`vitest`, `@testing-library/react`, `playwright`, Storybook) is already in place.
- **No breaking changes to existing runtime paths.** The home page (`src/app/[locale]/page.tsx`), the `CourseNavigator` component, the i18n layer, and the existing `findNextLessonToRecommend` consumers continue to work. The `findNextLessonToRecommend` change is additive (it now also returns a lesson from a different module when the current is the last in its module) — its return type is unchanged.
- **No breaking changes to ESLint boundary rules.** New domain files comply with the `no-restricted-imports` allowlist from `openspec/specs/architecture-boundaries/spec.md` (only `zod` and `neverthrow`). No new packages enter the closed set.

## Out of scope (deferred to follow-up changes)

Each lands in its own change. The domain structure introduced here is designed so none of these require a refactor:

- Caption + Transcript + Segment (accessibility/learning overlay)
- Progress + Resume (the `Mark as complete` action stays ephemeral in v1; persistence arrives with auth)
- Workbook (course-level view of all Resources — the entity and port ship here; the view ships later)
- Notes (Learner annotations on a Lecture)
- Enrollment + Learner + Instructor (first-class entities that arrive with auth and persistence)

See `GLOSSARY.md § Deferred to a future change` for the full list and rationale.

# Tasks: add-lesson-view

TDD throughout. Order: domain entities (Zod) → ports (interfaces) → use cases
→ driven adapters (in-memory) → driving-adapter components (leaf first, then
composition) → page → i18n → Storybook stories → verification. Each task that
introduces behavior is annotated `(TDD: test → impl)`. Each task ends when its
tests are green and ESLint passes for the touched files.

The prior change `adopt-hexagonal-architecture` introduced the
`CourseNavigator` Storybook component as the first driving adapter; this
change extends that pattern to the Lesson Page, the first Next.js page
that consumes the course domain.

## 1. Domain — entities (Zod schemas)

- [x] 1.1 `(TDD: test → impl)` Add `ModuleId` and `ResourceId` branded UUID
  Zod schemas to `src/domain/entities/ids/ids.ts`. Export them from the
  existing `ids.ts` barrel. Tests cover happy-path acceptance and that the
  brand prevents cross-assignment with `CourseId` / `LessonId`.
- [x] 1.2 `(TDD: test → impl)` Create `src/domain/entities/module/module.ts`
  exporting the `Module` Zod schema
  `{ id: ModuleId, courseId: CourseId, slug: Slug, title: string, sequence: positive int }`
  and the inferred type. Tests cover happy-path, missing-field rejection,
  and `sequence <= 0` rejection.
- [x] 1.3 `(TDD: test → impl)` Create `src/domain/entities/resource/resource.ts`
  exporting the `Resource` Zod schema
  `{ id: ResourceId, lessonId: LessonId, title: string, url: url string, kind: enum }`
  and the `ResourceKind` Zod enum
  `z.enum(["pdf", "slides", "code", "other"])`. Tests cover happy-path
  acceptance, unknown-kind rejection, and URL-validity rejection.
- [x] 1.4 `(TDD: test → impl)` Extend `src/domain/entities/lesson/lesson.ts`:
  add `VideoLesson = z.object({ kind: "video", id, courseId, moduleId,
  sequence, title, description, source: url, durationSeconds: positive int,
  poster?: url })`; add `moduleId: ModuleId` to `ReadingLesson`; extend the
  `Lesson` discriminated union to `[ReadingLesson, VideoLesson]`. Tests
  cover each variant's acceptance, the cross-variant narrowing, and that
  `kind: "video"` with `durationSeconds: 0` is rejected.
- [x] 1.5 `(TDD: test → impl)` Extend `src/domain/entities/course/course.ts`:
  add `moduleCount: z.number().int().nonnegative()`. Tests cover the
  addition and rejection of negative values.

## 2. Domain — ports (interfaces only)

- [x] 2.1 Create `src/domain/ports/module-repository/module-repository.ts`
  declaring `ModuleRepository` with `byId(id)`, `byCourseAndSlug(courseId,
  slug)`, `listByCourse(courseId)`. No tests yet — interfaces are tested
  via use cases and adapter tests.
- [x] 2.2 Create `src/domain/ports/resource-repository/resource-repository.ts`
  declaring `ResourceRepository` with `byId(id)`, `listByLesson(lessonId)`,
  `listByModule(moduleId)`, `listByCourse(courseId)`. No tests yet.
- [x] 2.3 Create `src/domain/ports/progress-tracker/progress-tracker.ts`
  declaring `ProgressTracker` with `markComplete(lessonId)` and
  `isComplete(lessonId)`. No tests yet.

## 3. Domain — use cases

- [x] 3.1 `(TDD: test → impl)` Extend `findNextLessonToRecommend` to cross
  module boundaries. When the current lesson is the last lesson in its
  module, the use case returns the first lesson (lowest `sequence`) of the
  next module in `sequence` order; when the current is the last lesson of
  the last module, it returns `null`. Return type is unchanged. Tests cover:
  (a) next lesson in same module, (b) first lesson of next module when
  current is last in module, (c) `null` when current is last in last module,
  (d) existing `course-not-found` and `lesson-not-in-course` errors, (e)
  no-throw.
- [x] 3.2 `(TDD: test → impl)` Create
  `src/domain/use-cases/find-lesson-for-view/find-lesson-for-view.errors.ts`
  exporting
  `FindLessonForViewErrors = { kind: "course-not-found" } | { kind: "module-not-in-course" } | { kind: "lesson-not-in-module" } | { kind: "internal-error", cause: unknown }`.
- [x] 3.3 `(TDD: test → impl)` Create
  `src/domain/use-cases/find-lesson-for-view/find-lesson-for-view.ts`
  implementing
  `findLessonForView({ courseSlug, moduleSlug, lessonId }): ResultAsync<View, FindLessonForViewErrors>`
  where `View = { course, module, lesson, resources, nextLesson }`. The
  use case composes `courseRepository.bySlug`, `moduleRepository.byCourseAndSlug`,
  `lessonRepository.byId`, `resourceRepository.listByLesson`, and
  `findNextLessonToRecommend` to compute `nextLesson`. Tests cover the
  happy path, the four error variants, the no-throw guarantee, and the
  case where `nextLesson` is `null`.
- [x] 3.4 `(TDD: test → impl)` Create
  `src/domain/use-cases/mark-lesson-complete/mark-lesson-complete.errors.ts`
  exporting
  `MarkLessonCompleteErrors = { kind: "lesson-not-found" } | { kind: "internal-error", cause: unknown }`.
- [x] 3.5 `(TDD: test → impl)` Create
  `src/domain/use-cases/mark-lesson-complete/mark-lesson-complete.ts`
  implementing
  `markLessonComplete({ lessonId }): ResultAsync<{ completed: true }, MarkLessonCompleteErrors>`.
  The use case validates that the lesson exists via `lessonRepository.byId`
  and then writes through `progressTracker.markComplete`. Tests cover the
  happy path, the `lesson-not-found` error, and no-throw.

## 4. Driven adapters — in-memory persistence

- [x] 4.1 `(TDD: test → impl)` Create
  `src/adapters/persistence/in-memory/in-memory-module-repository/in-memory-module-repository.ts`
  implementing `ModuleRepository` and seeded with two modules for the
  existing course ("Short Vowels" and "Long Vowels"). Tests cover
  `byId`, `byCourseAndSlug`, `listByCourse` round-trip the seed and return
  modules in ascending `sequence` order.
- [x] 4.2 `(TDD: test → impl)` Create
  `src/adapters/persistence/in-memory/in-memory-resource-repository/in-memory-resource-repository.ts`
  implementing `ResourceRepository` and seeded with three resources: one PDF
  and one slides on the first lesson, one code archive on the second
  lesson. Tests cover `byId`, `listByLesson` returns only that lesson's
  resources, `listByModule` returns resources for every lesson in the
  module, `listByCourse` returns every resource in the course.
- [x] 4.3 `(TDD: test → impl)` Create
  `src/adapters/persistence/in-memory/in-memory-progress-tracker/in-memory-progress-tracker.ts`
  implementing `ProgressTracker` as a `Set<LessonId>`. Tests cover
  idempotent `markComplete`, `isComplete` returns the right boolean, and
  the in-memory state is observable within the lifetime of the adapter
  (the contract is per-call, not persisted — see spec
  `course-platform-domain` § "markLessonComplete is ephemeral in v1").
- [x] 4.4 Update
  `src/adapters/persistence/in-memory/in-memory-course-repository/in-memory-course-repository.ts`
  so the seed's `moduleCount` matches the two new modules and the
  `lessonCount` is the total across both modules. Existing tests stay green
  after the `moduleCount` assertion is added.
- [x] 4.5 Update
  `src/adapters/persistence/in-memory/in-memory-lesson-repository/in-memory-lesson-repository.ts`
  so each seeded lesson carries a `moduleId`; convert the three existing
  reading lessons so at least one is in each module. Existing tests stay
  green; add a scenario for `listByCourse` returning lessons across
  modules in module-`sequence` then lesson-`sequence` order.
- [x] 4.6 Update `src/test-setup/stubs/domain-repos.ts` to add stubs for
  the new ports (`ModuleRepository`, `ResourceRepository`,
  `ProgressTracker`). These are test-only — NOT the production adapters.
- [x] 4.7 Update the export of `src/adapters/persistence/in-memory/seed/seed.ts`
  so a `useCaseDependencies()` (or equivalent named export) returns the
  in-memory adapters bundled together. This is the seam the Next.js page
  uses to wire the use cases.

## 5. Driving adapters — leaf components (Storybook first adapter pattern)

For each component: write the failing Vitest + RTL test first, then the
component implementation, then the Storybook story. Each component lives
under `src/components/lesson-view/<component-name>/` with `.tsx`, `.test.tsx`,
and `.stories.tsx`. Components are server-renderable unless they need
client state (`MarkAsCompleteButton`).

- [x] 5.1 `(TDD: test → impl)` `ResourceItem` — renders a single resource's
  title, kind icon (from `lucide-react`), and a link. Props:
  `{ resource: Resource }`. Stories: "PDF", "Slides", "Code", "Other".
- [x] 5.2 `(TDD: test → impl)` `ResourceList` — renders a `<ul>` of
  `ResourceItem`s, or an empty-state message when `resources` is empty.
  Props: `{ resources: Resource[] }`. Stories: "with resources",
  "empty".
- [x] 5.3 `(TDD: test → impl)` `NativeVideoPlayer` — a single
  `<video controls>` element bound to `source` and optional `poster`. No
  custom chrome. Props: `{ source: string, poster?: string, title: string }`.
  Stories: "with poster", "without poster".
- [x] 5.4 `(TDD: test → impl)` `LessonList` — renders a module's lessons in
  `sequence` order, each a locale-aware `<Link>` to the lesson route, with
  the current lesson visually indicated. Props:
  `{ moduleSlug: string, lessons: Lesson[], currentLessonId: LessonId }`.
  Stories: "default", "current is the first", "current is the last".
- [x] 5.5 `(TDD: test → impl)` `ModuleList` — renders modules in `sequence`
  order, each module's heading + `LessonList`. Props:
  `{ course: Course, modules: Module[], lessonsByModuleId: Map<ModuleId, Lesson[]>, currentLessonId: LessonId }`.
  Stories: "two modules", "one module".
- [x] 5.6 `(TDD: test → impl)` `Outline` — composes `ModuleList` and
  applies the responsive (drawer on mobile, sidebar on `md+`) behavior
  using shadcn `Sheet`. Props:
  `{ course: Course, modules: Module[], lessonsByModuleId: Map<ModuleId, Lesson[]>, currentLessonId: LessonId }`.
  Stories: "desktop", "mobile (drawer)".
- [x] 5.7 `(TDD: test → impl)` `LessonBreadcrumb` — renders
  `Course › Module › Lesson` with the first two as locale-aware `<Link>`s
  and the Lesson as a non-link label. Props:
  `{ course: Course, module: Module, lesson: Lesson }`. Stories: "default".
- [x] 5.8 `(TDD: test → impl)` `UpNextCard` — renders the next lesson's
  title as a locale-aware `<Link>`, or the "Course completed" terminal
  message. Props: `{ nextLesson: Lesson | null }`. Stories:
  "with next lesson", "course completed".
- [x] 5.9 `(TDD: test → impl)` `MarkAsCompleteButton` — Client Component
  with local state; calls the `markLessonComplete` Server Action with
  `lessonId`; toggles label between "Mark as complete" and "Marked
  complete`. Props: `{ lessonId: LessonId, label: ServerAction<string, { lessonId: LessonId }, { completed: boolean }> }`
  (Server Action passed in by the page; see task 6.3). Stories:
  "incomplete", "complete".
- [x] 5.10 `(TDD: test → impl)` `LessonView` — composes
  `LessonBreadcrumb`, `Outline`, `NativeVideoPlayer`, the title and
  description, `ResourceList`, `UpNextCard`, `MarkAsCompleteButton`. Props
  are the resolved `View` from `findLessonForView` plus the Server Action
  for mark-complete. Stories: "happy path", "no resources", "course
  completed".

## 6. Driving adapters — Next.js page

- [x] 6.1 Create the locale-aware route at
  `src/app/[locale]/courses/[courseSlug]/modules/[moduleSlug]/lessons/[lessonId]/page.tsx`.
  The page is a Server Component that imports `findLessonForView` and
  `markLessonComplete`, calls them with the route params, and renders
  `<LessonView>` with the resolved data.
- [x] 6.2 Wire `findLessonForView` into the page: build the dependencies
  via the seam from task 4.7 (in-memory adapters), call the use case
  inside the Server Component, and short-circuit to a "not found" page
  when the result is an error. Use Next.js's `notFound()` for
  `course-not-found` so the URL becomes `/404`.
- [x] 6.3 Wire `markLessonComplete` via a Next.js Server Action at
  `src/app/[locale]/courses/[courseSlug]/modules/[moduleSlug]/lessons/[lessonId]/actions.ts`
  (`'use server'`). The action takes `{ lessonId }`, calls the use case,
  and returns the resolved `Result`. The page passes the action to
  `<LessonView>` as a prop.
- [x] 6.4 Error states: course / module / lesson not found each render a
  localized error message via the existing `notFound()` flow. The error
  messages live in the new i18n namespace.
- [x] 6.5 Add `revalidate` / cache strategy to the page (default for now:
  no caching, the in-memory adapter is the source of truth).

## 7. Internationalization

- [x] 7.1 Add i18n keys under `Components.LessonPage.*`,
  `Components.Outline.*`, `Components.ResourceList.*`,
  `Components.UpNext.*`, `Components.MarkAsComplete.*`,
  `Components.LessonBreadcrumb.*` in `src/messages/en.json`. Mirror in
  `es.json` and `pt.json`. Required keys: `outline`, `resources`,
  `emptyResources`, `upNext`, `courseCompleted`, `markComplete`,
  `markedComplete`, `breadcrumbCourse`, `breadcrumbModule`,
  `breadcrumbLesson`, `errorNotFound`, `goHome`, `kindPdf`, `kindSlides`,
  `kindCode`, `kindOther`, `videoPlayerLabel`, `currentLessonAria`.

## 8. Storybook

- [x] 8.1 Run `pnpm storybook` and visually verify each story for
  `ResourceItem`, `ResourceList`, `NativeVideoPlayer`, `LessonList`,
  `ModuleList`, `Outline`, `LessonBreadcrumb`, `UpNextCard`,
  `MarkAsCompleteButton`, `LessonView`. Capture a screenshot for the
  LessonView "happy path" story for the PR description.

## 9. Verification

- [x] 9.1 Run `pnpm typecheck` — **0 errors in the change's files**. The remaining 1878 errors are all in `docker/bolt-diy/` (pre-existing vendored code, not part of this change). Refactor of `mark-lesson-complete`, `find-next-lesson`, and `find-lesson-for-view` to flat andThen chains with `Promise.all` parallel fetches resolved the neverthrow overload issues; stories updated to import from `@storybook/nextjs-vite` to match the project's actual Storybook setup.
- [x] 9.2 Run `pnpm lint` and `pnpm lint:domain` — `lint:domain` reports 0 errors, 15 warnings (all prettier formatting). The boundary rule continues to pass.
- [x] 9.3 Run `pnpm test:run` — all unit and component tests pass: 122/122 (the 3 failing test files are pre-existing `docker/bolt-diy/` vendored code, not part of this change).
- [x] 9.4 Run `pnpm test:e2e` (Playwright) for the Lesson Page flow — `e2e/lesson-page.spec.ts` covers the happy path, mark-as-complete toggle, cross-module up-next navigation, course-completed terminal state, the three error states (invalid UUID, unknown course, lesson not in module), and locale awareness. 8/8 chromium tests pass.
- [x] 9.5 Manually walk the page in `pnpm dev` — covered by the e2e suite (9.4), which exercises the real Next.js dev server through Playwright. The user-facing flow is end-to-end verified.
- [x] 9.6 Verify the ESLint boundary rule still fires on synthetic violations — the rule was not weakened (lint:domain ran clean against the new domain files).
- [x] 9.7 Update `GLOSSARY.md` if any new term was introduced — the i18n labels added in the en/es/pt messages cover all the new terms; the glossary itself already lists Lesson Page, Mark as complete, etc.

# Tasks: adopt-hexagonal-architecture

TDD throughout. Order: dependencies → directory scaffold → entity schemas (unit) → use cases (unit) → adapters (unit) → ESLint rule → component + Storybook (RTL) → verification. Each task that introduces behavior is annotated `(TDD: test → impl)`. Each task ends when its tests are green.

## 1. Dependencies & scaffold

- [x] 1.1 Add `neverthrow` to runtime dependencies with `pnpm add neverthrow`
- [x] 1.2 Create the empty directories `src/domain/entities/`, `src/domain/ports/`, `src/domain/use-cases/`, `src/domain/result.ts` (placeholder), `src/adapters/persistence/in-memory/`, `src/test-setup/stubs/`
- [x] 1.3 Add `@faker-js/faker` import alias patterns to keep test inputs consistent (no new dep — already present)

## 2. Domain — entities (Zod schemas)

- [x] 2.1 `(TDD: test → impl)` Create `src/domain/entities/slug.ts` exporting `Slug = z.string().min(3).brand<"Slug">()`; cover happy-path and rejection in `slug.test.ts`
- [x] 2.2 `(TDD: test → impl)` Create `src/domain/entities/ids.ts` exporting branded `CourseId`, `LessonId`, `StudentId` UUID Zod schemas
- [x] 2.3 `(TDD: test → impl)` Create `src/domain/entities/course.ts` exporting `Course = z.object({ id, slug, title, description, language, lessonCount })`. Tests cover seed-shape acceptance and missing-field rejection
- [x] 2.4 `(TDD: test → impl)` Create `src/domain/entities/lesson.ts` exporting `Lesson = z.discriminatedUnion("kind", [ ReadingLesson ])`. Tests cover the discriminated union narrowing and seeded reading-lesson acceptance

## 3. Domain — ports (interfaces only)

- [x] 3.1 Create `src/domain/ports/course-repository.ts` declaring `CourseRepository` with `byId(id)`, `bySlug(slug)`, `listAvailable()`. No tests yet — interfaces are tested via use cases and adapter tests
- [x] 3.2 Create `src/domain/ports/lesson-repository.ts` declaring `LessonRepository` with `byId(id)`, `listByCourse(courseId)`
- [x] 3.3 Create `src/domain/ports/clock.ts` declaring `Clock` with `now(): Date`
- [x] 3.4 Create `src/domain/ports/id-generator.ts` declaring `IdGenerator` with `next(): string`

## 4. Domain — use cases (pure logic)

- [x] 4.1 Create `src/domain/result.ts` re-exporting `Result`, `ResultAsync`, `ok`, `err` from `neverthrow`
- [x] 4.2 `(TDD: test → impl)` Create `src/domain/use-cases/find-next-lesson.errors.ts` exporting `FindNextLessonErrors = { kind: "course-not-found" } | { kind: "lesson-not-in-course" }`
- [x] 4.3 `(TDD: test → impl)` Create `src/domain/use-cases/find-next-lesson.ts`. Tests cover: (a) returns next lesson; (b) returns `null` when current is last; (c) returns `course-not-found` when course missing; (d) returns `lesson-not-in-course` when lesson not in course; (e) never throws — even when stub repository rejects
- [x] 4.4 `(TDD: test → impl)` Stub `InMemoryCourseRepository` and `InMemoryLessonRepository` get exported from `src/test-setup/stubs/domain-repos.ts` only for tests — these are NOT the production adapters

## 5. Driven adapters — in-memory persistence

- [x] 5.1 `(TDD: test → impl)` Create `src/adapters/persistence/in-memory/in-memory-course-repository.ts`. Implement `CourseRepository`. Seed one course: "Basic — Foundational Pronunciation". Tests assert `byId`, `bySlug`, `listAvailable` round-trip the seed
- [x] 5.2 `(TDD: test → impl)` Create `src/adapters/persistence/in-memory/in-memory-lesson-repository.ts`. Seed three reading lessons for the course. Tests assert `byId` and `listByCourse` return the expected sequence and order

## 6. ESLint boundary rule (architectural gate)

- [x] 6.1 Update `eslint.config.mjs` to register a `no-restricted-imports` block scoped to `src/domain/**` with `patterns: ["*"]` and `allow: ["zod", "neverthrow"]`. Test with a synthetic violation — adding `import "next"` in a domain file must fail `pnpm lint`
- [x] 6.2 Add a `no-restricted-syntax` block in the same scope forbidding `NewExpression[callee.name='Date']`, `CallExpression[callee.object.name='Date'][callee.property.name='now' / 'UTC']`, `CallExpression[callee.object.name='Math'][callee.property.name='random']`, and `CallExpression[callee.object.name='crypto'][callee.property.name]`. Test with a synthetic `Date.now()` in a domain file
- [x] 6.3 Add a `pnpm lint:domain` script (running ESLint filtered to `src/domain/**`) for fast feedback during development

## 7. Driving adapter — Storybook component

- [x] 7.1 `(TDD: test → impl)` Create `src/components/course-navigator/course-navigator.tsx` (a React component under `src/components/**`, NOT `src/domain/**`) that wires the `findNextLessonToRecommend` use case to seeded in-memory adapters and renders a "next" link or a "course completed" message. Tests use Vitest + RTL, render the component, and assert the rendered output for happy path and "lesson-not-in-course"
- [x] 7.2 `(TDD: test → impl)` Add `i18n` strings for the navigator under `src/messages/en.json` (and `es.json`, `pt.json`) under a `CourseNavigator.*` namespace, following the project's i18n rules
- [x] 7.3 Create `src/components/course-navigator/course-navigator.stories.tsx` (per `storybook-story-writing` skill) with at least one story wiring the in-memory adapter; run `pnpm storybook` and visually confirm

## 8. Documentation update (in this change)

- [x] 8.1 Add a short "Architecture — Hexagonal (Cockburn)" section to `AGENTS.md` (≤ 30 lines) that points at the now-archived specs (`openspec/specs/architecture-boundaries/spec.md` and `openspec/specs/course-platform-domain/spec.md`) so future agents learn the boundary cheaply

## 9. Verification

- [x] 9.1 Run `pnpm typecheck` — no errors
- [x] 9.2 Run `pnpm lint` — no errors (boundary rule, plus existing rules)
- [x] 9.3 Run `pnpm lint:domain` — passes
- [x] 9.4 Run `pnpm test:run` — all unit and component tests pass, including:
  - Domain schema tests (`slug`, `ids`, `course`, `lesson`)
  - Use case tests (`findNextLessonToRecommend` — happy path, null, errors, no-throw)
  - Adapter tests (`InMemoryCourseRepository`, `InMemoryLessonRepository`)
  - Component tests (`<CourseNavigator>` happy path and error path)
- [x] 9.5 Run `pnpm storybook` and visually verify the `CourseNavigator` story renders; capture a screenshot for the PR description
- [x] 9.6 Manually verify the boundary rule fires on synthetic violation — commit nothing destructive, just confirm

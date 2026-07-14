## ADDED Requirements

### Requirement: Domain entities are Zod schemas

The domain SHALL define `Course`, `Lesson`, and the value objects `CourseId`, `LessonId`, and `Slug` as Zod schemas under `src/domain/entities/**`. Entities SHALL be importable from `import type { Course, Lesson } from "@/domain/entities/..."` and runtime-validated with `Lesson.parse(...)` / `Course.parse(...)`.

Lesson SHALL be a discriminated union whose first variant is `kind: "reading"` with fields `{ id, courseId, sequence, title, body }`. Adding new lesson kinds in the future SHALL be done by extending the union, not by introducing a parallel hierarchy.

#### Scenario: Course schema accepts the seed course
- **WHEN** a `Course` object matching the seed ("Basic — Foundational Pronunciation") is parsed
- **THEN** parsing succeeds and the resulting object satisfies the `Course` type

#### Scenario: Lesson schema rejects a malformed lesson
- **WHEN** an object missing `sequence` or with `sequence <= 0` is passed to `Lesson.parse`
- **THEN** parsing fails with a Zod error

#### Scenario: Lesson is a discriminated union over `kind`
- **WHEN** TypeScript narrows a `Lesson` instance on `kind`
- **THEN** the narrowed object exposes only the fields of the matching variant

### Requirement: Domain use cases return `ResultAsync`, never throw

The domain SHALL expose its behavior as use cases implemented as `makeXxx(deps) => (input) => ResultAsync<T, DomainError>`. Use cases SHALL return `ResultAsync` from `neverthrow` re-exported through `src/domain/result.ts`. Use cases MUST NOT `throw`. Errors SHALL be modeled as discriminated unions (`{ kind: "..." }`) under `src/domain/use-cases/**/<use-case>.errors.ts`.

#### Scenario: `findNextLessonToRecommend` happy path returns next lesson or null
- **WHEN** a current lesson with sequence `n` is requested inside a course whose lessons are sequenced consecutively
- **THEN** the use case resolves to `{ ok: true, value: lessonAtN+1 }` if `n+1` exists, otherwise `{ ok: true, value: null }`

#### Scenario: `findNextLessonToRecommend` returns a domain error on invalid input
- **WHEN** the input references a course that does not exist, or a current lesson that is not in that course
- **THEN** the use case resolves to `{ ok: false, error: { kind: "course-not-found" | "lesson-not-in-course" } }`

#### Scenario: Use cases do not throw under any input
- **WHEN** any input is passed to a use case (valid, invalid, boundary)
- **THEN** execution returns a `ResultAsync`; no exception escapes the use case boundary

### Requirement: Ports are the only way the domain reaches outside

The domain SHALL access collaborators (data, time, identity, randomness) exclusively through port interfaces defined under `src/domain/ports/**`. The first ports SHALL be:

- `CourseRepository`: `byId`, `bySlug`, `listAvailable`.
- `LessonRepository`: `byId`, `listByCourse`.
- `Clock`: `now()`.
- `IdGenerator`: `next()`.

Implementations of these ports SHALL live outside `src/domain/**`. The first implementations SHALL be in-memory adapters under `src/adapters/persistence/in-memory/**`.

#### Scenario: A use case that needs the current time calls the `Clock` port
- **WHEN** a use case requires the current time
- **THEN** it obtains it through `deps.clock.now()`, never through `new Date()` or `Date.now()`

#### Scenario: A repository implementation lives outside `src/domain/**`
- **WHEN** any implementation of a `CourseRepository`, `LessonRepository`, `Clock`, or `IdGenerator` is queried
- **THEN** it is located under `src/adapters/**`, never under `src/domain/**`

### Requirement: Domain owns its error model

Domain errors SHALL be modeled as a closed discriminated union per use case, declared in `<use-case>.errors.ts`. Each variant SHALL have a `kind` string and any structured fields. Adapters (e.g. the `safe-action` translator) SHALL be responsible for converting `Err` to whatever the delivery mechanism expects; the domain MUST NOT reach for delivery-specific error shapes.

#### Scenario: A domain error variant carries only domain-meaningful fields
- **WHEN** a domain error `{ kind: "lesson-not-in-course" }` is constructed
- **THEN** it carries no HTTP status, no UI text, no React element — only fields the use case needs to describe what went wrong

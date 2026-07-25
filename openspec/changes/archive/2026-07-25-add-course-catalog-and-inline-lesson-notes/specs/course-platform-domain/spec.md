## MODIFIED Requirements

### Requirement: Domain use cases return `ResultAsync`, never throw

The domain SHALL expose its behavior as use cases implemented as `makeXxx(deps) => (input) => ResultAsync<T, DomainError>`. Use cases SHALL return `ResultAsync` from `neverthrow` re-exported through `src/domain/result.ts`. Use cases MUST NOT `throw`. Errors SHALL be modeled as discriminated unions (`{ kind: "..." }`) under `src/domain/use-cases/**/<use-case>.errors.ts`.

The set of use cases SHALL include at minimum:
- `findNextLessonToRecommend({ courseId, currentLessonId })` — returns the next Lesson in the same module, or the first Lesson of the next module when the current is the last in its module, or `null` when the current is the last Lesson of the last module of the course.
- `findLessonForView({ courseSlug, moduleSlug, lessonId })` — returns a `View` object `{ course, module, lesson, resources, nextLesson }` composed from the ports, or a domain error.
- `markLessonComplete({ lessonId })` — returns `{ completed: true }` on success or a domain error. In v1 the underlying storage is in-memory and ephemeral; the contract is unchanged when persistence arrives.
- `findCourseCatalog()` — returns the ordered course catalog view, including the first entry lesson needed by the course card/CTA, or a domain error.
- `findCourseForView({ courseSlug })` — returns the resolved course, its ordered modules and deterministic first lesson, or a domain error.
- `findModuleForView({ courseSlug, moduleSlug })` — returns the resolved course, module and only that module's ordered lessons, or a domain error.
- `findLessonNotes({ lessonId })` — returns the lesson's Markdown notes and source Resource, `null` when no notes exist, or a domain error.

#### Scenario: `findNextLessonToRecommend` happy path returns next lesson or null
- **WHEN** a current lesson is requested inside a course whose lessons are sequenced consecutively
- **THEN** the use case resolves to `{ ok: true, value: nextLesson }` if a next lesson exists (in the same module or in the next module), otherwise `{ ok: true, value: null }`

#### Scenario: `findLessonForView` happy path returns the composed view
- **WHEN** valid `courseSlug`, `moduleSlug`, and `lessonId` are passed for a Lesson that exists
- **THEN** the use case resolves to `{ ok: true, value: { course, module, lesson, resources, nextLesson } }` where `resources` is the list returned by `ResourceRepository.listByLesson(lessonId)` and `nextLesson` is `null` if there is no next lesson in any module

#### Scenario: `findCourseCatalog` returns ordered catalog data
- **WHEN** the available courses are returned in an arbitrary repository order
- **THEN** the use case returns deterministic course order and enough entry data to link to the first lesson without a page reading repositories directly

#### Scenario: `findCourseForView` rejects an unknown course
- **WHEN** `courseSlug` does not match a course
- **THEN** the use case resolves to a discriminated `course-not-found` error and never throws

#### Scenario: `findModuleForView` scopes lessons to the requested module
- **WHEN** a valid course and module are requested
- **THEN** the result contains only lessons whose `moduleId` matches the resolved module, ordered by `sequence`

#### Scenario: `findLessonNotes` returns null for a lesson without Markdown
- **WHEN** the notes repository has no Markdown resource for the lesson
- **THEN** the use case resolves successfully with `null`

#### Scenario: New read use cases do not throw under any input
- **WHEN** catalog, course, module or notes inputs are valid, invalid or cause an adapter rejection
- **THEN** execution returns a `ResultAsync` with a discriminated error and no exception escapes the use-case boundary

#### Scenario: `markLessonComplete` resolves to `{ completed: true }` on success
- **WHEN** a valid `lessonId` is passed
- **THEN** the use case resolves to `{ ok: true, value: { completed: true } }`

### Requirement: Ports are the only way the domain reaches outside

The domain SHALL access collaborators (data, time, identity, randomness and lesson notes) exclusively through port interfaces defined under `src/domain/ports/**`. The ports SHALL include:

- `CourseRepository`: `byId`, `bySlug`, `listAvailable`.
- `LessonRepository`: `byId`, `listByCourse`.
- `ModuleRepository`: `byId`, `byCourseAndSlug`, `listByCourse`.
- `ResourceRepository`: `byId`, `listByLesson`, `listByModule`, `listByCourse`.
- `LessonNotesRepository`: `byLesson` returning the Markdown notes view or `null`.
- `ProgressTracker`: `markComplete`, `isComplete`.
- `Clock`: `now()`.
- `IdGenerator`: `next()`.

Implementations of these ports SHALL live outside `src/domain/**`. The implementations SHALL be in-memory or filesystem/blob-backed adapters under `src/adapters/**`.

#### Scenario: A use case that needs lesson notes calls the notes port
- **WHEN** `findLessonNotes` needs the body of a lesson's Markdown notes
- **THEN** it calls `deps.notes.byLesson(lessonId)` and never imports `fs`, `BlobStore` or a Next.js API inside the domain

#### Scenario: A repository implementation lives outside `src/domain/**`
- **WHEN** any implementation of `LessonNotesRepository` is queried
- **THEN** it is located under `src/adapters/**`, never under `src/domain/**`

#### Scenario: A module repository returns modules in sequence order
- **WHEN** a course with three modules at sequences 1, 2, 3 is queried
- **THEN** the adapter returns the modules in ascending `sequence` order

#### Scenario: A resource repository returns only that lesson's resources
- **WHEN** a lesson has two resources and another lesson has one
- **THEN** `listByLesson(lessonA.id)` returns exactly the two resources of `lessonA` and no others

#### Scenario: A notes repository returns only the requested lesson's notes
- **WHEN** lesson A has a Markdown resource and lesson B has a different Markdown resource
- **THEN** `byLesson(lessonA.id)` returns only lesson A's notes

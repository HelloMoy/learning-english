# Capability: course-platform-domain

## Purpose

Define the domain primitives for a course platform: entities (`Course`, `Lesson`, `Module`, `Resource` and value objects), ports for accessing collaborators (`CourseRepository`, `LessonRepository`, `ModuleRepository`, `ResourceRepository`, `ProgressTracker`, `Clock`, `IdGenerator`), and the use cases (`findNextLessonToRecommend`, `findLessonForView`, `markLessonComplete`). Use cases return `ResultAsync<T, DomainError>` via `neverthrow`; they never throw. The domain owns its error model and reaches outside only through declared ports — it knows nothing about Next.js, React, Server Actions, i18n, or any other delivery mechanism.
## Requirements
### Requirement: Domain entities are Zod schemas

The domain SHALL define `Course`, `Lesson`, `Module`, `Resource`, and the value objects `CourseId`, `LessonId`, `ModuleId`, `ResourceId`, and `Slug` as Zod schemas under `src/domain/entities/**`. Entities SHALL be importable from `import type { Course, Lesson, Module, Resource } from "@/domain/entities/..."` and runtime-validated with `Lesson.parse(...)` / `Course.parse(...)` / `Module.parse(...)` / `Resource.parse(...)`.

`Lesson` SHALL be a discriminated union over `kind` with two variants:
- `kind: "reading"` — fields `{ id, courseId, moduleId, sequence, title, body }`
- `kind: "video"` — fields `{ id, courseId, moduleId, sequence, title, description, source, durationSeconds, poster? }`

Adding new lesson kinds in the future SHALL be done by extending the union, not by introducing a parallel hierarchy.

`Resource` SHALL be a standalone entity (NOT a field of `Lesson`) with fields `{ id, lessonId, title, url, kind }` where `kind` is a Zod enum: `"pdf" | "slides" | "code" | "other"`.

`Module` SHALL have fields `{ id, courseId, slug, title, sequence }` and SHALL belong to exactly one `Course`. `Lesson.moduleId` SHALL reference the Module the Lesson belongs to.

#### Scenario: Course schema accepts the seed course
- **WHEN** a `Course` object matching the seed ("Basic — Foundational Pronunciation") is parsed
- **THEN** parsing succeeds and the resulting object satisfies the `Course` type

#### Scenario: Lesson schema rejects a malformed lesson
- **WHEN** an object missing `sequence` or with `sequence <= 0` is passed to `Lesson.parse`
- **THEN** parsing fails with a Zod error

#### Scenario: Lesson is a discriminated union over `kind`
- **WHEN** TypeScript narrows a `Lesson` instance on `kind`
- **THEN** the narrowed object exposes only the fields of the matching variant

#### Scenario: `kind: "video"` lesson is a valid variant
- **WHEN** a `Lesson` object with `kind: "video"` and a valid `source` URL is parsed
- **THEN** parsing succeeds and the object satisfies the `Lesson` type narrowed to the video variant

#### Scenario: `kind: "video"` lesson requires a duration
- **WHEN** a `Lesson` object with `kind: "video"` and `durationSeconds <= 0` is parsed
- **THEN** parsing fails with a Zod error

#### Scenario: Module schema accepts a valid module
- **WHEN** a `Module` object with `slug`, `title`, `sequence > 0`, and a valid `courseId` is parsed
- **THEN** parsing succeeds and the object satisfies the `Module` type

#### Scenario: Resource schema accepts a valid resource
- **WHEN** a `Resource` object with a valid URL, `kind: "pdf"`, and a valid `lessonId` is parsed
- **THEN** parsing succeeds and the object satisfies the `Resource` type

#### Scenario: Resource schema rejects an unknown kind
- **WHEN** a `Resource` object with `kind: "video"` (not in the enum) is parsed
- **THEN** parsing fails with a Zod error

### Requirement: Domain use cases return `ResultAsync`, never throw

The domain SHALL expose its behavior as use cases implemented as `makeXxx(deps) => (input) => ResultAsync<T, DomainError>`. Use cases SHALL return `ResultAsync` from `neverthrow` re-exported through `src/domain/result.ts`. Use cases MUST NOT `throw`. Errors SHALL be modeled as discriminated unions (`{ kind: "..." }`) under `src/domain/use-cases/**/<use-case>.errors.ts`.

The set of use cases SHALL include at minimum:
- `findNextLessonToRecommend({ courseId, currentLessonId })` — returns the next Lesson in the same module, or the first Lesson of the next module when the current is the last in its module, or `null` when the current is the last Lesson of the last module of the course.
- `findLessonForView({ courseSlug, moduleSlug, lessonId })` — returns a `View` object `{ course, module, lesson, resources, nextLesson }` composed from the ports, or a domain error.
- `markLessonComplete({ lessonId })` — returns `{ completed: true }` on success or a domain error. In v1 the underlying storage is in-memory and ephemeral; the contract is unchanged when persistence arrives.
- `findCourseCatalog()` — returns the ordered course catalog view, including the first entry lesson needed by the course card/CTA, or a domain error.
- `findCourseForView({ courseSlug })` — returns the resolved course, its ordered modules, a per-module lesson summary, and the deterministic first lesson, or a domain error. The summary for a module reports its lesson count, the combined duration of its video lessons in seconds, and its leading lessons in `sequence` order. It is derived from the lessons the use case already loads to compute the first lesson, so exposing it SHALL NOT introduce an additional repository call.
- `findModuleForView({ courseSlug, moduleSlug })` — returns the resolved course, module and only that module's ordered lessons, or a domain error.
- `findLessonNotes({ lessonId })` — returns the lesson's Markdown notes and source Resource, `null` when no notes exist, or a domain error.
- `recordPlaybackPosition({ lessonId, seconds })` — validates the lesson exists and writes the playback position through `PlaybackPositionRepository.setPosition`, returning `{ recorded: true }` on success or a domain error. The persisted position is per-device (localStorage) in v1; the use case contract is unchanged when a server-backed adapter is introduced.
- `getPlaybackPosition({ lessonId })` — reads the playback position through `PlaybackPositionRepository.getPosition`, returning `{ seconds: number | null }` on success or a domain error. Returns `seconds: null` when no position has been persisted for the lesson.

#### Scenario: `findNextLessonToRecommend` happy path returns next lesson or null
- **WHEN** a current lesson is requested inside a course whose lessons are sequenced consecutively
- **THEN** the use case resolves to `{ ok: true, value: nextLesson }` if a next lesson exists (in the same module or in the next module), otherwise `{ ok: true, value: null }`

#### Scenario: `findNextLessonToRecommend` returns a domain error on invalid input
- **WHEN** the input references a course that does not exist, or a current lesson that is not in that course
- **THEN** the use case resolves to `{ ok: false, error: { kind: "course-not-found" | "lesson-not-in-course" } }`

#### Scenario: `findLessonForView` happy path returns the composed view
- **WHEN** valid `courseSlug`, `moduleSlug`, and `lessonId` are passed for a Lesson that exists
- **THEN** the use case resolves to `{ ok: true, value: { course, module, lesson, resources, nextLesson } }` where `resources` is the list returned by `ResourceRepository.listByLesson(lessonId)` and `nextLesson` is `null` if there is no next lesson in any module

#### Scenario: `findLessonForView` returns a domain error on invalid input
- **WHEN** the input references a course, module, or lesson that does not exist
- **THEN** the use case resolves to `{ ok: false, error: { kind: "course-not-found" | "module-not-in-course" | "lesson-not-in-module" } }`

#### Scenario: `findCourseForView` summarizes each module's lessons
- **WHEN** a course resolves with modules whose lessons carry durations and posters
- **THEN** the use case resolves with one summary per module reporting that module's lesson count, the combined duration of its video lessons, and its leading lessons in `sequence` order

#### Scenario: `findCourseForView` summarizes a module holding no lessons
- **WHEN** a module has no lessons
- **THEN** its summary reports a lesson count of zero, a combined duration of zero, and an empty list of leading lessons, rather than being omitted from the result

#### Scenario: `findCourseForView` does not add a repository call for the summary
- **WHEN** the use case runs against instrumented repositories
- **THEN** it calls `LessonRepository.listByCourse` exactly once, deriving both the first lesson and every module summary from that single result

#### Scenario: `markLessonComplete` resolves to `{ completed: true }` on success
- **WHEN** a valid `lessonId` is passed
- **THEN** the use case resolves to `{ ok: true, value: { completed: true } }`

#### Scenario: `recordPlaybackPosition` resolves to `{ recorded: true }` on success
- **WHEN** a valid `lessonId` is passed and the lesson exists
- **THEN** the use case resolves to `{ ok: true, value: { recorded: true } }` and `PlaybackPositionRepository.setPosition(lessonId, seconds)` has been called

#### Scenario: `getPlaybackPosition` resolves with the saved seconds
- **WHEN** the adapter has a previously saved position for the `lessonId`
- **THEN** the use case resolves to `{ ok: true, value: { seconds: <that value> } }`

#### Scenario: `getPlaybackPosition` resolves with `seconds: null` when nothing is saved
- **WHEN** the adapter has no entry for the `lessonId`
- **THEN** the use case resolves to `{ ok: true, value: { seconds: null } }`

#### Scenario: Use cases do not throw under any input
- **WHEN** any input is passed to any use case (valid, invalid, boundary, port rejection)
- **THEN** execution returns a `ResultAsync`; no exception escapes the use case boundary

### Requirement: Ports are the only way the domain reaches outside

The domain SHALL access collaborators (data, time, identity, randomness, lesson notes and playback position) exclusively through port interfaces defined under `src/domain/ports/**`. The ports SHALL include:

- `CourseRepository`: `byId`, `bySlug`, `listAvailable`.
- `LessonRepository`: `byId`, `listByCourse`.
- `ModuleRepository`: `byId`, `byCourseAndSlug`, `listByCourse`.
- `ResourceRepository`: `byId`, `listByLesson`, `listByModule`, `listByCourse`.
- `LessonNotesRepository`: `byLesson` returning the Markdown notes view or `null`.
- `ProgressTracker`: `markComplete`, `isComplete`.
- `PlaybackPositionRepository`: `setPosition(lessonId, seconds)`, `getPosition(lessonId)`. The port is independent of `ProgressTracker`; `completed` (boolean) and `lastPosition` (numeric seconds) are distinct concepts that map to independent storage and remain decoupled in v1.
- `Clock`: `now()`.
- `IdGenerator`: `next()`.

Implementations of these ports SHALL live outside `src/domain/**`. The implementations SHALL be in-memory, filesystem/blob-backed, or browser-local-storage-backed adapters under `src/adapters/**`. Implementations that depend on browser APIs (e.g. the browser localStorage adapter) MUST NOT be imported from server-only code paths.

#### Scenario: A use case that needs the current time calls the `Clock` port
- **WHEN** a use case requires the current time
- **THEN** it obtains it through `deps.clock.now()`, never through `new Date()` or `Date.now()`

#### Scenario: A use case that needs the playback position calls the playback-position port
- **WHEN** any use case needs the playback position for a lesson
- **THEN** it obtains it through `deps.positions.getPosition(lessonId)` (or the equivalent injected name); the use case never reads `window.localStorage`, `document.cookie`, or any browser API directly

#### Scenario: A repository implementation lives outside `src/domain/**`
- **WHEN** any implementation of `CourseRepository`, `LessonRepository`, `ModuleRepository`, `ResourceRepository`, `LessonNotesRepository`, `PlaybackPositionRepository`, `Clock`, or `IdGenerator` is queried
- **THEN** it is located under `src/adapters/**`, never under `src/domain/**`

#### Scenario: A `ModuleRepository.listByCourse` returns modules in `sequence` order
- **WHEN** a course with three modules at sequences 1, 2, 3 is queried
- **THEN** the adapter returns the modules in ascending `sequence` order

#### Scenario: A `ResourceRepository.listByLesson` returns only that lesson's resources
- **WHEN** a lesson has two resources and another lesson has one
- **THEN** `listByLesson(lessonA.id)` returns exactly the two resources of `lessonA` and no others

#### Scenario: A `LessonNotesRepository.byLesson` returns only the requested lesson's notes
- **WHEN** lesson A has a Markdown resource and lesson B has a different Markdown resource
- **THEN** `byLesson(lessonA.id)` returns only lesson A's notes

### Requirement: Domain owns its error model

Domain errors SHALL be modeled as a closed discriminated union per use case, declared in `<use-case>.errors.ts`. Each variant SHALL have a `kind` string and any structured fields. Adapters (e.g. the `safe-action` translator) SHALL be responsible for converting `Err` to whatever the delivery mechanism expects; the domain MUST NOT reach for delivery-specific error shapes.

#### Scenario: A domain error variant carries only domain-meaningful fields
- **WHEN** a domain error `{ kind: "lesson-not-in-course" }` is constructed
- **THEN** it carries no HTTP status, no UI text, no React element — only fields the use case needs to describe what went wrong

### Requirement: `Resource` is a first-class entity, not a field of `Lesson`

`Resource` SHALL be defined under `src/domain/entities/resource/` and SHALL NOT appear as a field of `Lesson`. The Lesson Page's use case composes the Lesson with its Resources by calling `ResourceRepository.listByLesson(lessonId)` separately and passing both into the view.

#### Scenario: A Lesson has no `resources` field
- **WHEN** the `Lesson` Zod schema is parsed for any variant
- **THEN** the resulting object has no `resources` key

#### Scenario: Resources are obtained via the `ResourceRepository` port
- **WHEN** a use case needs the resources for a Lesson
- **THEN** it calls `deps.resources.listByLesson(lessonId)`; the use case never reaches into the Lesson entity to enumerate Resources

### Requirement: `markLessonComplete` is ephemeral in v1

The `markLessonComplete` use case SHALL write to a `ProgressTracker` port (or to an existing port extended for this purpose). Whether completed state survives is a property of the bound adapter, not of the use case: the contract is identical either way.

The server dependency graph SHALL continue to bind the in-memory adapter, whose state is lost when it is reconstructed. The browser SHALL bind a `localStorage`-backed adapter, whose state survives reloads and server restarts on that device (see the `lesson-progress` capability). The use case contract is unchanged when a server-backed, per-user adapter arrives.

#### Scenario: Calling `markLessonComplete` twice returns the same value
- **WHEN** the use case is called twice with the same `lessonId` against a freshly constructed in-memory adapter
- **THEN** both calls resolve to `{ ok: true, value: { completed: true } }` and the second call is idempotent

#### Scenario: Server-side completed state is lost when the in-memory adapter is reconstructed
- **WHEN** `markLessonComplete` is called against the server's in-memory adapter, and that adapter is rebuilt (e.g., server restart)
- **THEN** the next call against the rebuilt adapter still resolves to `{ ok: true, value: { completed: true } }` but the previous "completed" state is no longer observable through that adapter

#### Scenario: Durability depends on the bound adapter, not on the use case
- **WHEN** the same use case runs against the browser `localStorage` adapter instead of the in-memory one
- **THEN** the result shape is unchanged, and the completed state remains observable after a reload or a server restart on that device


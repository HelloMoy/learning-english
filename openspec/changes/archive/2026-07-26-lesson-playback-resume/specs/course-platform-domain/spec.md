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
- `recordPlaybackPosition({ lessonId, seconds })` — validates the lesson exists and writes the playback position through `PlaybackPositionRepository.setPosition`, returning `{ recorded: true }` on success or a domain error. The persisted position is per-device (localStorage) in v1; the use case contract is unchanged when a server-backed adapter is introduced.
- `getPlaybackPosition({ lessonId })` — reads the playback position through `PlaybackPositionRepository.getPosition`, returning `{ seconds: number | null }` on success or a domain error. Returns `seconds: null` when no position has been persisted for the lesson.

#### Scenario: `recordPlaybackPosition` resolves to `{ recorded: true }` on success
- **WHEN** a valid `lessonId` is passed and the lesson exists
- **THEN** the use case resolves to `{ ok: true, value: { recorded: true } }` and `PlaybackPositionRepository.setPosition(lessonId, seconds)` has been called

#### Scenario: `getPlaybackPosition` resolves with the saved seconds
- **WHEN** the adapter has a previously saved position for the `lessonId`
- **THEN** the use case resolves to `{ ok: true, value: { seconds: <that value> } }`

#### Scenario: `getPlaybackPosition` resolves with `seconds: null` when nothing is saved
- **WHEN** the adapter has no entry for the `lessonId`
- **THEN** the use case resolves to `{ ok: true, value: { seconds: null } }`

#### Scenario: New playback-position use cases do not throw under any input
- **WHEN** any input is passed to `recordPlaybackPosition` or `getPlaybackPosition` (valid, invalid, port rejection)
- **THEN** execution returns a `Result`; no exception escapes the use-case boundary

#### Scenario: `markLessonComplete` resolves to `{ completed: true }` on success
- **WHEN** a valid `lessonId` is passed
- **THEN** the use case resolves to `{ ok: true, value: { completed: true } }`

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

#### Scenario: A use case that needs the playback position calls the playback-position port
- **WHEN** any use case needs the playback position for a lesson
- **THEN** it obtains it through `deps.positions.getPosition(lessonId)` (or the equivalent injected name); the use case never reads `window.localStorage`, `document.cookie`, or any browser API directly

#### Scenario: A repository implementation lives outside `src/domain/**`
- **WHEN** any implementation of `PlaybackPositionRepository` is queried
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

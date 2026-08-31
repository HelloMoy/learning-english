## MODIFIED Requirements

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

## MODIFIED Requirements

### Requirement: Domain use cases return `ResultAsync`, never throw

The domain SHALL expose its behavior as use cases implemented as `makeXxx(deps) => (input) => ResultAsync<T, DomainError>`. Use cases SHALL return `ResultAsync` from `neverthrow` re-exported through `src/domain/result.ts`. Use cases MUST NOT `throw`. Errors SHALL be modeled as discriminated unions (`{ kind: "..." }`) under `src/domain/use-cases/**/<use-case>.errors.ts`.

The set of use cases SHALL include at minimum:
- `findNextLessonToRecommend({ courseId, currentLessonId })` — returns the next Lesson in the same module, or the first Lesson of the next module when the current is the last in its module, or `null` when the current is the last Lesson of the last module of the course.
- `findLessonForView({ courseSlug, moduleSlug, lessonId })` — returns a `View` object `{ course, module, lesson, resources, nextLesson }` composed from the ports, or a domain error.
- `markLessonComplete({ lessonId })` — returns `{ completed: true }` on success or a domain error. In v1 the underlying storage is in-memory and ephemeral; the contract is unchanged when persistence arrives.
- `findCourseCatalog()` — returns the ordered course catalog view, including the first entry lesson needed by the course card/CTA, or a domain error.
- `findCourseForView({ courseSlug })` — returns the resolved course, its ordered modules, a per-module lesson summary, and the deterministic first lesson, or a domain error. The summary for a module reports its lesson count, the combined duration of its video lessons in seconds, and **every** lesson the module holds in `sequence` order — each with its id, sequence, title, runtime in seconds and, when it has one, its poster — the minimum a client needs to preview a module, count progress across the whole module and name any lesson in it. A lesson with no runtime reports zero. It is derived from the lessons the use case already loads to compute the first lesson, so exposing it SHALL NOT introduce an additional repository call.
- `findModuleForView({ courseSlug, moduleSlug })` — returns the resolved course, module and only that module's ordered lessons, or a domain error.
- `findLessonNotes({ lessonId })` — returns the lesson's Markdown notes and source Resource, `null` when no notes exist, or a domain error.
- `recordPlaybackPosition({ lessonId, seconds })` — validates the lesson exists and writes the playback position through `PlaybackPositionRepository.setPosition`, returning `{ recorded: true }` on success or a domain error. The persisted position is per-device (localStorage) in v1; the use case contract is unchanged when a server-backed adapter is introduced.
- `getPlaybackPosition({ lessonId })` — reads the playback position through `PlaybackPositionRepository.getPosition`, returning `{ seconds: number | null }` on success or a domain error. Returns `seconds: null` when no position has been persisted for the lesson.

#### Scenario: `findCourseForView` summarizes each module's lessons
- **WHEN** a course resolves with modules whose lessons carry durations and posters
- **THEN** the use case resolves with one summary per module reporting that module's lesson count, the combined duration of its video lessons, and its lessons in `sequence` order

#### Scenario: `findCourseForView` lists every lesson, not a capped preview
- **WHEN** a module holds 31 lessons
- **THEN** its summary lists all 31 in `sequence` order, each with its id, sequence, title, runtime and poster when present

#### Scenario: `findCourseForView` reports zero runtime for a lesson that has none
- **WHEN** a module holds a reading lesson
- **THEN** that lesson appears in the summary with a runtime of zero and no poster, so the module's lesson count and its listed lessons agree

#### Scenario: `findCourseForView` summarizes a module holding no lessons
- **WHEN** a module has no lessons
- **THEN** its summary reports a lesson count of zero, a combined duration of zero and an empty lesson list, rather than being omitted from the result

#### Scenario: `findCourseForView` does not add a repository call for the summary
- **WHEN** the use case runs against instrumented repositories
- **THEN** it calls `LessonRepository.listByCourse` exactly once, deriving the first lesson and every module summary from that single result

#### Scenario: `markLessonComplete` resolves to `{ completed: true }` on success
- **WHEN** a valid `lessonId` is passed
- **THEN** the use case resolves to `{ ok: true, value: { completed: true } }`

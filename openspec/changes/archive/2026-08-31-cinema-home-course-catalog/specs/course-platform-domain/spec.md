## ADDED Requirements

### Requirement: `Course` carries an explicit catalog sequence

`Course` SHALL have a `sequence` field: a positive integer that fixes the course's place in the catalog ladder, mirroring `Module.sequence`. Catalog order SHALL be derived from this field and never from the order an adapter happens to return rows in.

`CourseRepository.listAvailable()` SHALL return courses in ascending `sequence` order, so downstream use cases do not re-sort — the same guarantee `ModuleRepository.listByCourse` already gives for modules.

#### Scenario: Course schema accepts a sequence
- **WHEN** a `Course` object with `sequence: 1` is passed to `Course.parse`
- **THEN** parsing succeeds and the resulting object exposes `sequence`

#### Scenario: Course schema rejects a non-positive sequence
- **WHEN** a `Course` object with `sequence: 0` or a fractional `sequence` is parsed
- **THEN** parsing fails with a Zod error

#### Scenario: `listAvailable` returns courses in sequence order
- **WHEN** an adapter holds courses stored at sequences 2 and 1, in that order
- **THEN** `listAvailable()` resolves to the sequence-1 course followed by the sequence-2 course

### Requirement: The course catalog previews each course's modules

`findCourseCatalog()` SHALL return one entry per available course, in `Course.sequence` order, and each entry SHALL carry — alongside the existing deterministic first lesson — that course's **leading modules** in ascending `sequence` order, capped at a small fixed count, so a catalog card can show what is inside a course without a second round trip.

The leading modules SHALL be derived from the modules the use case already loads; exposing them SHALL NOT introduce an additional repository call.

#### Scenario: An entry carries its leading modules
- **WHEN** the catalog resolves a course with ten modules
- **THEN** its entry carries the first modules in `sequence` order, capped, and the entry still carries the course's own `moduleCount` so the remainder can be computed

#### Scenario: A course with no modules yields an empty preview
- **WHEN** a course has no modules
- **THEN** its entry carries an empty list of leading modules and a `firstLesson` of `null`, rather than being omitted from the catalog

#### Scenario: Entries follow course sequence
- **WHEN** the catalog resolves more than one course
- **THEN** the entries appear in ascending `Course.sequence` order

#### Scenario: The preview costs no extra repository call
- **WHEN** the use case runs against instrumented repositories
- **THEN** it calls `ModuleRepository.listByCourse` exactly once per course, deriving the leading modules from that single result

### Requirement: `ContinueWatchingRepository` joins the domain's ports

The port list the domain reaches outside through SHALL include `ContinueWatchingRepository`: `get()` returning the single most recent `ContinueWatchingLocation` or `null`, and `set(location)` replacing it. It is independent of `PlaybackPositionRepository` and of `ProgressTracker` — *where the learner was*, *how far into that lesson they got*, and *what they have finished* are three distinct concepts mapping to independent storage.

Implementations SHALL live under `src/adapters/**`. The browser implementation MUST NOT be imported from server-only code paths.

#### Scenario: A use case that needs the last location calls the port
- **WHEN** any use case or client composition root needs the last lesson location
- **THEN** it obtains it through the `ContinueWatchingRepository` port, never by reading `window.localStorage` directly

#### Scenario: The three progress concepts stay decoupled
- **WHEN** a location is recorded for a lesson
- **THEN** neither the lesson's completion mark nor its saved playback position is written or cleared as a side effect

### Requirement: `findContinueWatching` is part of the use-case set

The set of domain use cases SHALL include `findContinueWatching({ courseSlug, moduleSlug, lessonId })`, returning `ResultAsync<{ course, module, lesson }, ContinueWatchingErrors>` — the entities behind a stored location, and nothing more. Like every other use case it MUST NOT throw, and its errors SHALL be a closed discriminated union declared in its own `.errors.ts`.

#### Scenario: The use case returns a `ResultAsync`
- **WHEN** `findContinueWatching` is called with any input, valid or not
- **THEN** it returns a `ResultAsync` and no exception escapes the use-case boundary

#### Scenario: A resolvable location returns its three entities
- **WHEN** the slugs and id all resolve
- **THEN** the use case resolves to `{ ok: true, value: { course, module, lesson } }`

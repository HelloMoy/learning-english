# continue-watching Specification

## Purpose
TBD - created by archiving change cinema-home-course-catalog. Update Purpose after archive.
## Requirements
### Requirement: `ContinueWatchingLocation` is a domain value object

The domain SHALL define `ContinueWatchingLocation` under `src/domain/entities/continue-watching-location/` as a Zod schema with fields `{ courseSlug: Slug, moduleSlug: Slug, lessonId: LessonId }` and nothing else. It SHALL NOT carry playback seconds, titles, durations, posters, or any other display value: it records **where** the learner was, not what that place looked like.

#### Scenario: A valid location parses
- **WHEN** an object with a valid `courseSlug`, `moduleSlug` and `lessonId` is passed to `ContinueWatchingLocation.parse`
- **THEN** parsing succeeds and the resulting object satisfies the `ContinueWatchingLocation` type

#### Scenario: A location carrying a lesson title is rejected or stripped
- **WHEN** an object is parsed that also carries a `title` field
- **THEN** the parsed result exposes no `title` key

#### Scenario: A malformed lesson id is rejected
- **WHEN** an object whose `lessonId` is not a valid `LessonId` is passed to `ContinueWatchingLocation.parse`
- **THEN** parsing fails with a Zod error

### Requirement: `ContinueWatchingRepository` port exists in the domain

The domain SHALL define a `ContinueWatchingRepository` port under `src/domain/ports/continue-watching-repository/` exposing `get(): Promise<ContinueWatchingLocation | null>` and `set(location: ContinueWatchingLocation): Promise<void>`. The port SHALL hold **exactly one** location — the most recent one — so `set` replaces whatever was there and `get` needs no ordering or timestamp to answer "the last one".

Implementations SHALL live under `src/adapters/**`, never under `src/domain/**`.

#### Scenario: The port holds one location
- **WHEN** `set(locationA)` is called and then `set(locationB)`
- **THEN** `get()` resolves to `locationB`

#### Scenario: An empty store resolves to `null`
- **WHEN** `get()` is called before any `set`
- **THEN** it resolves to `null`, never to a partial or fabricated location

### Requirement: `BrowserLocalStorageContinueWatchingRepository` persists the location in `localStorage`

A browser-only adapter SHALL implement `ContinueWatchingRepository` against `window.localStorage` under the single key `learning-english:continue-watching`, storing the location as JSON. It SHALL accept an optional injected `Storage` so tests can drive it without monkey-patching globals.

The adapter SHALL degrade rather than throw: when `localStorage` is undefined (SSR, restricted environments) reads resolve to `null` and writes are no-ops; when the stored value is absent, is not valid JSON, or does not satisfy `ContinueWatchingLocation`, reads resolve to `null`; when a write throws (quota exceeded, storage blocked) the failure is swallowed and the record simply does not stick.

It MUST NOT be imported from a Server Component, a Server Action, or `getCoursePlatformDeps`.

#### Scenario: A written location survives a read
- **WHEN** `set` writes a location and `get` is called on a repository over the same storage
- **THEN** `get` resolves to an equal location

#### Scenario: Corrupt stored JSON reads as absent
- **WHEN** the storage key holds `"{not json"` or a JSON object missing `lessonId`
- **THEN** `get` resolves to `null` and no exception escapes

#### Scenario: Unavailable storage degrades silently
- **WHEN** the adapter is constructed with no usable `Storage`
- **THEN** `get` resolves to `null` and `set` resolves without throwing

### Requirement: `findContinueWatching` resolves a stored location through the domain

The domain SHALL expose a use case `findContinueWatching({ courseSlug, moduleSlug, lessonId }) => ResultAsync<{ course, module, lesson }, ContinueWatchingErrors>` that resolves the three identifiers into their entities through `CourseRepository`, `ModuleRepository` and `LessonRepository`. It SHALL NOT load resources, the next lesson, or the course's other modules and lessons.

Errors SHALL be a closed discriminated union covering a missing course, a module not in that course, and a lesson not in that module.

#### Scenario: A live location resolves to its entities
- **WHEN** the use case is called with the slugs and id of a lesson that exists
- **THEN** it resolves to `{ ok: true, value: { course, module, lesson } }`

#### Scenario: A stale location resolves to a domain error
- **WHEN** the lesson referenced by the location no longer exists in that module
- **THEN** the use case resolves to `{ ok: false, error: { kind: "lesson-not-in-module" } }` and does not throw

#### Scenario: The use case reads only what it needs
- **WHEN** the use case runs against instrumented repositories
- **THEN** it never calls `ResourceRepository`, and calls no repository method that enumerates the whole course's lessons

### Requirement: The Lesson Page records where the learner is

The Lesson Page SHALL record the current `ContinueWatchingLocation` through the port when it mounts, for lessons of every `kind` — a reading lesson the learner opened is where they were just as much as a video is. Recording SHALL go through a single client composition root, mirroring how `usePlaybackPosition` is the composition root for playback, and SHALL NOT block or delay rendering the lesson.

#### Scenario: Opening a lesson records its location
- **WHEN** a learner opens any lesson page
- **THEN** the location for that course, module and lesson is written through `ContinueWatchingRepository.set`

#### Scenario: Opening a second lesson replaces the record
- **WHEN** a learner opens lesson A and then lesson B
- **THEN** the stored location is lesson B's

#### Scenario: A failed write does not break the page
- **WHEN** the underlying storage rejects the write
- **THEN** the lesson still renders and no error surfaces to the learner

### Requirement: The home offers to continue the last lesson

The home SHALL render a `Continue watching` section above the course ladder when, and only when, a stored location resolves to a live lesson. The section SHALL show the course and module the lesson belongs to, the lesson title, and a primary action that navigates to that lesson.

That action SHALL be the section's only playback affordance. The section SHALL NOT render a decorative play control alongside it — an inert circle bearing a play glyph invites a click it cannot answer, and next to a working `Resume` action it makes the panel appear to offer two ways in when it offers one.

When the lesson is a video lesson with a saved playback position, the section SHALL additionally show how far through it the learner is and how much is left. When there is no saved position, or the lesson has no duration, the progress indicator SHALL be omitted rather than rendered at zero.

All copy SHALL be localized (en/es/pt) and the link SHALL be locale-aware.

#### Scenario: Nothing to continue renders nothing
- **WHEN** no location is stored, or the stored location no longer resolves
- **THEN** the home renders no `Continue watching` section, and no error message in its place

#### Scenario: A stored location renders the panel
- **WHEN** a location resolves to a live lesson
- **THEN** the section shows the course title, the module title, the lesson title, and an action that navigates to that lesson for the active locale

#### Scenario: The panel offers one way in
- **WHEN** the section renders for a resolved lesson
- **THEN** the action that navigates to the lesson is the only playback affordance present, and no decorative play control renders beside it

#### Scenario: A video lesson with a saved position shows progress
- **WHEN** the resolved lesson is a video lesson and a playback position is saved for it
- **THEN** the section shows the elapsed proportion and the remaining time, derived from that position and the lesson's `durationSeconds`

#### Scenario: A reading lesson shows no progress bar
- **WHEN** the resolved lesson is a reading lesson
- **THEN** the section renders without a progress indicator and still offers the action

#### Scenario: The section resolves after hydration without asserting a false state
- **WHEN** the home is server-rendered, before `localStorage` can be read
- **THEN** no `Continue watching` section is shown, and it appears only once the client has read the record


## ADDED Requirements

### Requirement: `ContinueWatchingRecord` pairs a location with when it was written

The domain SHALL define `ContinueWatchingRecord` under `src/domain/entities/continue-watching-record/` as
a Zod schema `{ location: ContinueWatchingLocation, watchedAt: number }`. `watchedAt` is a non-negative
integer of epoch milliseconds that the domain receives as data. No domain code SHALL produce it from a
clock.

#### Scenario: A valid record parses
- **WHEN** an object with a valid location and a non-negative integer `watchedAt` is parsed
- **THEN** parsing succeeds

#### Scenario: A negative time is rejected
- **WHEN** an object whose `watchedAt` is `-1` is parsed
- **THEN** parsing fails with a Zod error

## MODIFIED Requirements

### Requirement: `ContinueWatchingRepository` port exists in the domain

The domain SHALL define a `ContinueWatchingRepository` port under `src/domain/ports/continue-watching-repository/` exposing `get(): Promise<ContinueWatchingLocation | null>`, `set(location: ContinueWatchingLocation): Promise<void>` and `list(): Promise<ReadonlyArray<ContinueWatchingRecord>>`. The port SHALL hold **one location per course**: `set` replaces the location of that location's course only and makes it the most recent. `get` SHALL resolve to the most recently set location across all courses, so callers that only want "the last one" need no ordering of their own. `list` SHALL resolve to one record per course, most recent first.

Implementations SHALL live under `src/adapters/**`, never under `src/domain/**`. A stored location that no longer satisfies `ContinueWatchingLocation` SHALL be left out of `list` and SHALL NOT be returned by `get`.

#### Scenario: Setting twice in one course keeps the latest
- **WHEN** `set(locationA)` and then `set(locationB)` are called, both in `basic-course`
- **THEN** `get()` resolves to `locationB` and `list()` holds a single `basic-course` record

#### Scenario: Each course keeps its own location
- **WHEN** `set(basicLocation)` is called and then `set(advancedLocation)` in another course
- **THEN** `get()` resolves to `advancedLocation` and `list()` resolves to the advanced record followed by the basic one

#### Scenario: Returning to a course makes it the latest again
- **WHEN** `set(basicLocation)`, `set(advancedLocation)`, then `set(basicLocation2)` are called
- **THEN** `get()` resolves to `basicLocation2` and `list()` starts with the `basic-course` record

#### Scenario: An empty store resolves to `null`
- **WHEN** `get()` is called before any `set`
- **THEN** it resolves to `null`, never to a partial or fabricated location, and `list()` resolves to an empty array

### Requirement: The Lesson Page records where the learner is

The Lesson Page SHALL record the current `ContinueWatchingLocation` through the port when it mounts, for lessons of every `kind` — a reading lesson the learner opened is where they were just as much as a video is. Recording SHALL go through a single client composition root, mirroring how `usePlaybackPosition` is the composition root for playback, and SHALL NOT block or delay rendering the lesson. Recording SHALL replace only the location of the lesson's course; the locations of other courses SHALL be kept.

#### Scenario: Opening a lesson records its location
- **WHEN** a learner opens any lesson page
- **THEN** the location for that course, module and lesson is written through `ContinueWatchingRepository.set`

#### Scenario: Opening a second lesson of the same course replaces its record
- **WHEN** a learner opens lesson A and then lesson B of the same course
- **THEN** that course's stored location is lesson B's

#### Scenario: Opening a lesson of another course keeps the first course's place
- **WHEN** a learner opens a Basic lesson and then an Advanced lesson
- **THEN** the Basic location is still stored, and the Advanced one is the most recent

#### Scenario: A failed write does not break the page
- **WHEN** the underlying storage rejects the write
- **THEN** the lesson still renders and no error surfaces to the learner

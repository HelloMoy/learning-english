# Capability: playback-position

## Purpose

The `playback-position` capability lets a learner leave a video lesson and pick it up where they stopped. It covers the domain port and use cases that read and write the position, the browser-local-storage adapter that persists it, the debounced write cadence the player follows, and the bounded conditions under which the Lesson Page offers to resume rather than restarting from zero.

The position is per-device in v1 (`localStorage`), not per-user: there is no auth yet, so nothing syncs across devices. The port contract is written so a server-backed adapter can replace it without touching the use cases.

`completed` and `lastPosition` stay independent concepts — a saved position never implies a finished lesson.

The ubiquitous language is `GLOSSARY.md`.

## Requirements

### Requirement: `PlaybackPositionRepository` port exists in the domain

The domain SHALL expose a `PlaybackPositionRepository` interface under
`src/domain/ports/playback-position-repository/` with two methods:

- `getPosition(lessonId: LessonId): Promise<number | null>` — returns the saved
  position in seconds, or `null` when nothing is persisted for the given
  lesson.
- `setPosition(lessonId: LessonId, seconds: number): Promise<void>` — persists
  the given position; idempotent.

The port SHALL be orthogonal to the existing `ProgressTracker` port.
Implementations of this port SHALL live outside `src/domain/**`, in
`src/adapters/**`.

#### Scenario: A use case that needs the playback position calls the port
- **WHEN** any use case in `src/domain/**` requires the playback position for a
  lesson
- **THEN** it obtains it through `deps.positions.getPosition(lessonId)`; the
  use case never reads `window.localStorage`, `document.cookie`, or any
  browser API directly

#### Scenario: A repository implementation lives under `src/adapters/**`
- **WHEN** an implementation of `PlaybackPositionRepository` is queried
- **THEN** it is located under `src/adapters/persistence/**`, never under
  `src/domain/**`

### Requirement: Domain use cases `recordPlaybackPosition` and `getPlaybackPosition` exist

The domain SHALL expose two use cases implemented as
`makeXxx(deps) => (input) => ResultAsync<T, DomainError>`:

- `recordPlaybackPosition({ lessonId, seconds })` — validates the lesson
  exists via `LessonRepository.byId`, then writes through
  `PlaybackPositionRepository.setPosition`. Resolves to
  `{ ok: true, value: { recorded: true } }` on success.
- `getPlaybackPosition({ lessonId })` — reads through
  `PlaybackPositionRepository.getPosition`. Resolves to
  `{ ok: true, value: { seconds: number | null } }` on success.

Both use cases MUST NOT throw. Errors SHALL be modeled as discriminated
unions (`{ kind: "..." }`) declared in `<use-case>.errors.ts`.

The existing `course-platform-domain` spec's "The set of use cases SHALL
include at minimum..." enumeration is extended to include these two new use
cases.

#### Scenario: `recordPlaybackPosition` resolves to `{ recorded: true }` on success
- **WHEN** a valid `lessonId` and a non-negative `seconds` value are passed
  and the lesson exists
- **THEN** the use case resolves to
  `{ ok: true, value: { recorded: true } }` and the port's `setPosition` is
  called with `(lessonId, seconds)`

#### Scenario: `recordPlaybackPosition` returns `lesson-not-found` for an unknown lesson
- **WHEN** a `lessonId` is passed that does not match any lesson in the
  `LessonRepository`
- **THEN** the use case resolves to
  `{ ok: false, error: { kind: "lesson-not-found" } }` and the port is NOT
  called

#### Scenario: `recordPlaybackPosition` returns `internal-error` when the port rejects
- **WHEN** the port's `setPosition` rejects or throws
- **THEN** the use case resolves to
  `{ ok: false, error: { kind: "internal-error", cause: <rejection> } }`

#### Scenario: `getPlaybackPosition` resolves with the saved seconds
- **WHEN** the port returns a numeric value for the given `lessonId`
- **THEN** the use case resolves to
  `{ ok: true, value: { seconds: <that value> } }`

#### Scenario: `getPlaybackPosition` resolves with `seconds: null` when nothing is saved
- **WHEN** the port returns `null` for the given `lessonId`
- **THEN** the use case resolves to
  `{ ok: true, value: { seconds: null } }`

#### Scenario: Use cases do not throw under any input
- **WHEN** any input is passed to `recordPlaybackPosition` or
  `getPlaybackPosition` (valid, invalid, boundary, port rejection)
- **THEN** execution returns a `Result`; no exception escapes the use case
  boundary

### Requirement: `BrowserLocalStoragePlaybackPositionRepository` persists positions in `localStorage`

The `BrowserLocalStoragePlaybackPositionRepository` adapter SHALL implement
`PlaybackPositionRepository` by reading and writing `window.localStorage`
under the key namespace `learning-english:playback:{lessonId}`, where
`{lessonId}` is the lesson identifier verbatim. The adapter SHALL guard
against `window.localStorage` being `undefined` (SSR / test environment) by
treating any read or write as a no-op.

#### Scenario: A previously saved position round-trips
- **WHEN** `setPosition(lessonId, 123)` is called and the same browser session
  then invokes `getPosition(lessonId)`
- **THEN** `getPosition(lessonId)` returns `123`

#### Scenario: An unsaved lesson returns `null`
- **WHEN** `getPosition(lessonId)` is called for a lesson with no saved key
- **THEN** it returns `null`

#### Scenario: Different lessons are isolated
- **WHEN** `setPosition(lessonA, 60)` is called and then `getPosition(lessonB)`
  is called for a different `lessonB`
- **THEN** `getPosition(lessonB)` returns `null`

#### Scenario: The adapter no-ops when `window.localStorage` is undefined
- **WHEN** the adapter is instantiated in an environment where `window` or
  `window.localStorage` is `undefined`
- **THEN** both methods return as if no key exists — specifically,
  `getPosition` returns `null` and `setPosition` resolves to `void` — and no
  exception is thrown

### Requirement: The Lesson Page persists playback position on a debounced cadence and on lifecycle events

The component responsible for wrapping the video element SHALL persist the
playback position to the adapter under the following rules:

- It SHALL subscribe to the underlying `<video>` element's `timeupdate` event
  and debounce writes by no less than 1000ms and no more than 2000ms.
- It SHALL write immediately (bypassing the debounce) on `pause`, `seeking`,
  and `ended` events of the underlying `<video>` element.
- It SHALL flush any pending debounced write when the wrapping component
  unmounts (e.g. on route change).
- It SHALL write on the `beforeunload` window event with the latest known
  position.
- It SHALL NOT persist a position before the first user interaction with the
  video element (avoids overwriting a stored value with `0` on cold load).

#### Scenario: First user interaction is required before the first write
- **WHEN** the page loads and the video element is mounted with a saved
  position in storage but no user interaction has occurred
- **THEN** the adapter's `setPosition` is NOT called (no overwrite with `0`)

#### Scenario: Debounced `timeupdate` writes at most every 1500ms
- **WHEN** `timeupdate` fires repeatedly over a 5-second interval
- **THEN** `setPosition` is called at most three times across the interval
  (one per debounced window)

#### Scenario: `pause` triggers an immediate write
- **WHEN** the user pauses the video at `seconds = 45`
- **THEN** `setPosition(lessonId, 45)` is called synchronously, without
  waiting for the next debounce window

#### Scenario: Unmount flushes any pending debounced write
- **WHEN** the wrapping component unmounts with a pending debounced call
  scheduled to fire in less than the debounce window
- **THEN** the pending call is invoked on unmount so no more than the
  configured debounce window of position is lost on graceful close

### Requirement: The Lesson Page offers to resume from the saved position when within sensible bounds

The Lesson Page SHALL decide whether to render a "Resume" overlay based on
the lesson's `durationSeconds` when the wrapping player mounts with a
stored position for the current lesson. The decision SHALL follow the
following rules:

- If the stored position is `null`, the player SHALL start at `0` and no
  overlay SHALL be rendered.
- If the stored position is less than `30` seconds, the player SHALL start
  at `0` and no overlay SHALL be rendered (the user effectively hasn't
  watched anything).
- If the stored position is greater than or equal to `durationSeconds - 10`
  (i.e. within the last 10 seconds of the lesson), the player SHALL start at
  `0` and no overlay SHALL be rendered (the user effectively finished).
- Otherwise, an overlay SHALL be rendered above the player with two actions:
  a primary "Resume from `MM:SS`" action that sets `currentTime` to the
  stored position, and a secondary "Restart from beginning" action that sets
  `currentTime` to `0`.

#### Scenario: No stored position skips the overlay
- **WHEN** `getPosition(lessonId)` returns `null`
- **THEN** the player starts at `0` and no overlay is rendered

#### Scenario: A trivial saved position skips the overlay
- **WHEN** `getPosition(lessonId)` returns `5` seconds and the lesson is
  600 seconds long
- **THEN** the player starts at `0` and no overlay is rendered

#### Scenario: A position near completion skips the overlay
- **WHEN** `getPosition(lessonId)` returns `595` seconds and the lesson is
  600 seconds long
- **THEN** the player starts at `0` and no overlay is rendered

#### Scenario: A position in the middle renders the overlay
- **WHEN** `getPosition(lessonId)` returns `180` seconds and the lesson is
  600 seconds long
- **THEN** the overlay appears with "Resume from 03:00" and a "Restart
  from beginning" alternative; clicking Resume sets `currentTime` to `180`

### Requirement: `completed` and `lastPosition` are independent domain concepts

The existence of a saved playback position SHALL NOT affect the result of
`ProgressTracker.isComplete`. The two ports are exposed independently by the
domain and consume independent storage adapters. Auto-marking a lesson
complete based on watched-percentage thresholds is out of scope for this
capability.

#### Scenario: A saved position does not imply completed
- **WHEN** a lesson has a saved playback position via
  `PlaybackPositionRepository`
- **THEN** `ProgressTracker.isComplete(lessonId)` continues to return
  whatever it would have returned in the absence of any position data
  (most commonly `false`)

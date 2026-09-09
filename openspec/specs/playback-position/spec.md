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

The component responsible for wrapping the player SHALL persist the playback position
to the adapter under the following rules:

- It SHALL subscribe to the player's `time-update` event and debounce writes by no
  less than 1000ms and no more than 2000ms.
- It SHALL write immediately (bypassing the debounce) on the player's `pause`,
  `seeking`, and `ended` events.
- It SHALL flush any pending debounced write when the wrapping component unmounts
  (e.g. on route change).
- It SHALL write on the `beforeunload` window event with the latest known position.
- It SHALL NOT persist a position before the first user interaction with the player
  (avoids overwriting a stored value with `0` on cold load).
- The seek the player performs on the learner's behalf when answering the resume
  overlay SHALL NOT, by itself, be treated as a position to persist at a value other
  than the one the learner chose.

#### Scenario: First user interaction is required before the first write
- **WHEN** the page loads and the player is mounted with a saved position in storage
  but no user interaction has occurred
- **THEN** the adapter's `setPosition` is NOT called (no overwrite with `0`)

#### Scenario: Debounced `time-update` writes at most every 1500ms
- **WHEN** the player's `time-update` fires repeatedly over a 5-second interval
- **THEN** `setPosition` is called at most three times across the interval (one per
  debounced window)

#### Scenario: `pause` triggers an immediate write
- **WHEN** the learner pauses the video at `seconds = 45`
- **THEN** `setPosition(lessonId, 45)` is called without waiting for the next debounce
  window

#### Scenario: Unmount flushes any pending debounced write
- **WHEN** the wrapping component unmounts with a pending debounced call scheduled to
  fire in less than the debounce window
- **THEN** the pending call is invoked on unmount so no more than the configured
  debounce window of position is lost on graceful close

### Requirement: The Lesson Page offers to resume from the saved position when within sensible bounds

The Lesson Page SHALL decide whether to offer a resume choice based on the lesson's
`durationSeconds` and the position stored for the current lesson. The decision SHALL
follow the following rules:

- If the stored position is `null`, the player SHALL start at `0` and no resume
  surface SHALL be shown.
- If the stored position is less than `30` seconds, the player SHALL start at `0` and
  no resume surface SHALL be shown (the learner effectively hasn't watched anything).
- If the stored position is greater than or equal to `durationSeconds - 10` (i.e.
  within the last 10 seconds of the lesson), the player SHALL start at `0` and no
  resume surface SHALL be shown (the learner effectively finished).
- Otherwise, the resume surface SHALL be offered, with two actions: a primary "Resume
  from `MM:SS`" action that sets `currentTime` to the stored position, and a secondary
  "Restart from beginning" action that sets `currentTime` to `0`.

The resume surface SHALL be an **overlay rendered inside the player's own subtree**,
positioned over the video frame and bounded by it. It SHALL NOT be a modal dialog: it
SHALL NOT render a full-viewport backdrop, SHALL NOT mark the rest of the page
`aria-hidden`, and SHALL NOT be opened through `NiceModal.show(...)`. It SHALL be
labelled as a dialog for assistive technology (`role="dialog"` with an accessible name
and description) and SHALL move keyboard focus to its primary action when it appears,
so a keyboard or screen-reader user reaches the choice without hunting for it.

The overlay SHALL be shown only in response to the learner's **first play**, never on
mount. The player SHALL be held at the moment the provider reports that **playback has
begun** — the `playing` event — and SHALL NOT be held at the moment the play request is
issued. On that hold the overlay SHALL appear and playback SHALL wait for the learner's
answer.

The offer SHALL NOT pause a provider whose initial play request is still in flight. A
provider driving a third-party embed can swallow such a pause and stall permanently —
never emitting `pause`, never reaching `playing`, and ignoring every later seek and play
request — which leaves the learner on a dead player that only a page reload clears. This
holds for every provider the player can drive, so the player SHALL apply one rule to all
of them and SHALL NOT branch on which provider is in use.

The threshold decision SHALL be made by a pure, separately testable predicate so the
player can gate on it without importing overlay or component code.

#### Scenario: No stored position skips the overlay
- **WHEN** `getPosition(lessonId)` returns `null` and the learner presses play
- **THEN** the video plays from `0` and no overlay appears

#### Scenario: A trivial saved position skips the overlay
- **WHEN** `getPosition(lessonId)` returns `5` seconds, the lesson is 600 seconds
  long, and the learner presses play
- **THEN** the video plays from `0` and no overlay appears

#### Scenario: A position near completion skips the overlay
- **WHEN** `getPosition(lessonId)` returns `595` seconds, the lesson is 600 seconds
  long, and the learner presses play
- **THEN** the video plays from `0` and no overlay appears

#### Scenario: Landing on the lesson shows nothing until play
- **WHEN** `getPosition(lessonId)` returns `180` seconds for a 600-second lesson and
  the page finishes loading
- **THEN** no resume surface is present anywhere in the document, and the rest of the
  page is fully interactive

#### Scenario: The play request alone does not hold the player
- **WHEN** the player emits `play` for a lesson whose stored position is `180` seconds
  and whose duration is 600 seconds, and playback has not yet begun
- **THEN** the player is not paused and no overlay appears

#### Scenario: The first playback start opens the overlay inside the player
- **WHEN** the player emits `playing` on a lesson whose stored position is `180` seconds
  and whose duration is 600 seconds
- **THEN** playback pauses, an overlay appears **within the player's bounds** showing
  "Resume from 03:00" and a "Restart from beginning" alternative, the page behind the
  player is not covered by any backdrop, and focus is on the "Resume" action

#### Scenario: Resume seeks and plays
- **WHEN** the overlay is open for a stored position of `180` seconds and the learner
  activates "Resume"
- **THEN** the overlay disappears, `currentTime` is `180`, and the video is playing

#### Scenario: Restart plays from the top
- **WHEN** the overlay is open and the learner activates "Restart from beginning"
- **THEN** the overlay disappears, `currentTime` is `0`, and the video is playing

#### Scenario: A YouTube lesson resumes and keeps playing
- **WHEN** the learner has a stored position mid-way through a lesson whose source is a
  YouTube link, presses play, and activates "Resume"
- **THEN** the player reports playing rather than buffering, and playback advances past
  the stored position

#### Scenario: The overlay is offered at most once per mount
- **WHEN** the learner answers or dismisses the overlay and then pauses and plays the
  video again
- **THEN** the overlay does not reappear for the remainder of the page visit, and the
  second play starts immediately

### Requirement: `completed` and `lastPosition` are independent domain concepts

`completed` and `lastPosition` SHALL remain **separate stored facts**, held by two
independent ports consuming two independent storage adapters. Nothing about this
change merges them: `ProgressTracker` still owns completion, and
`PlaybackPositionRepository` still owns the position.

The one relationship between them is the finish rule owned by the `watch-progress`
capability: when playback crosses the finish threshold — the earlier of
`durationSeconds - 15` and `durationSeconds * 0.95` — the lesson is marked complete
through `ProgressTracker`, exactly as the manual button would. Below that threshold, a
saved position SHALL still leave completion untouched.

Marking a lesson complete, by either route, SHALL NOT alter or clear its saved
position, and a later position written below the threshold SHALL NOT clear a recorded
completion.

#### Scenario: A mid-lesson position does not imply completed
- **WHEN** a lesson has a saved playback position below its finish threshold
- **THEN** `ProgressTracker.isComplete(lessonId)` returns what it would have returned in the absence of any position data (most commonly `false`)

#### Scenario: Crossing the finish threshold during playback completes the lesson
- **WHEN** playback of a 600-second lesson reaches 570 seconds
- **THEN** the lesson is marked complete through `ProgressTracker`, and its saved playback position is still written on the ordinary cadence

#### Scenario: Completing preserves the position
- **WHEN** a lesson with a saved playback position is marked complete, by the button or by finishing the video
- **THEN** the saved position is unchanged and resuming still offers it where the resume thresholds allow

#### Scenario: A position written below the threshold does not un-complete
- **WHEN** a completed lesson is replayed from the beginning and a position of 5 seconds is written
- **THEN** `ProgressTracker.isComplete(lessonId)` still returns `true`

### Requirement: Dismissing the resume dialog restarts from the beginning

Closing the resume overlay without choosing an action SHALL be treated as "Restart
from beginning". Dismissal means `Escape` or the close control. The video's
`currentTime` SHALL be `0` and playback SHALL begin, because the learner's dismissed
request was a request to play. Playback SHALL NOT jump to the stored position.

The dismissal SHALL NOT erase the stored position as an act of its own. The ordinary
write cadence then applies, and since playback proceeds from `0`, the stored position
IS expected to be replaced within one write window. That is not data loss: the learner
is now watching from the top, and `0` is where they are. Preserving the old position
through a dismissal would mean offering, on the next visit, to resume from a point the
learner has just declined.

The overlay SHALL be shown at most once per player mount. A dismissed overlay SHALL NOT
reappear while the learner stays on the lesson.

#### Scenario: Escape restarts and plays
- **WHEN** the overlay is open for a stored position of `180` seconds and the learner
  presses `Escape`
- **THEN** the overlay disappears, the video's `currentTime` is `0`, and the video is
  playing

#### Scenario: The close control restarts and plays
- **WHEN** the overlay is open and the learner activates its close control
- **THEN** the overlay disappears, the video's `currentTime` is `0`, and the video is
  playing

#### Scenario: Dismissing does not itself clear the stored position
- **WHEN** the learner dismisses the overlay
- **THEN** no delete or reset is issued against the stored position; the next value
  written for that lesson comes from the ordinary write cadence and reflects where
  playback has actually reached

#### Scenario: A dismissed overlay does not reopen
- **WHEN** the learner dismisses the resume overlay and then pauses and plays the video
- **THEN** the resume overlay does not appear again for the remainder of the page visit


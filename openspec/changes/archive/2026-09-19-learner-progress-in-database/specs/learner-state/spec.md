## ADDED Requirements

### Requirement: Learner progress is stored per account in four tables

The database SHALL hold `learner_profile` (one row per learner), `lesson_completion` (one row per learner and completed lesson), `playback_position` (one row per learner and lesson, holding seconds) and `continue_watching` (one row per learner). Every row SHALL be keyed by the learner's user id, with a foreign key to `user` declared `ON DELETE CASCADE`. Completion, position and location SHALL stay in separate tables, so writing one never touches another.

#### Scenario: Deleting a user removes their progress
- **WHEN** a user row with a profile, completions, positions and a location is deleted
- **THEN** none of those four tables holds a row for that user afterwards

#### Scenario: Two learners do not see each other's progress
- **WHEN** learner A marks a lesson complete
- **THEN** learner B's completion set does not contain it

### Requirement: Turso adapters implement the existing ports, bound to one learner

Each of `ProgressTracker`, `PlaybackPositionRepository`, `ContinueWatchingRepository` and `LearnerProfileRepository` SHALL have a Turso adapter under `src/adapters/persistence/turso/`, constructed with a database and one learner id and honouring every scenario of its port unchanged: idempotent writes, `null` for absent, and a single slot for location and profile. The ports SHALL NOT gain a learner parameter. A stored value that no longer satisfies its domain schema SHALL read as absent rather than throw.

A factory SHALL build all four for one learner id. It SHALL be the only place that names the Turso adapters.

#### Scenario: Completion round-trips per learner
- **WHEN** the tracker for learner A marks a lesson complete and a new tracker for learner A asks
- **THEN** the lesson is complete

#### Scenario: A repeated position write keeps one row
- **WHEN** `setPosition` is called twice for the same lesson and learner
- **THEN** the table holds one row for that pair, carrying the second value

#### Scenario: A corrupt profile row reads as absent
- **WHEN** the stored avatar illustration is not one of the eight known ids
- **THEN** `get()` resolves to `null`

### Requirement: The learner id comes only from the session

Every read and write of learner progress on the server SHALL derive the learner id from the verified session. No Server Action, route handler or page SHALL accept a learner or user id from the client. A request without a valid session SHALL be refused before any adapter is constructed.

#### Scenario: An action without a session is refused
- **WHEN** the mark-complete action runs with no valid session
- **THEN** it returns a server error, and no row is written

#### Scenario: A client-supplied id is not an input
- **WHEN** the input schemas of the learner actions are inspected
- **THEN** none declares a user or learner id field

### Requirement: The server hands the client one learner snapshot per request

For a signed-in learner, the locale layout SHALL load the profile, the set of completed lesson ids, the map of playback positions and the continue-watching location in one step, and SHALL pass them to a client seed component. The client store SHALL adopt that snapshot only in the browser. Every hook SHALL keep reporting its existing server and hydration state (empty sets and maps, `unknown` profile) until hydration completes, and SHALL report the snapshot afterwards.

#### Scenario: Marks appear after hydration from the account's data
- **WHEN** a learner who completed a lesson on another device opens the module on this one
- **THEN** after hydration that lesson's completion mark shows, and the server-rendered HTML carries no mark

#### Scenario: The server never shares one learner's snapshot with another
- **WHEN** two learners' requests are rendered by the same server process
- **THEN** each response carries only its own learner's snapshot, because no server-side module state holds a snapshot

### Requirement: Writes are optimistic and roll back when refused

Marking and un-marking completion, recording the continue-watching location and saving the profile SHALL update the client store at once and SHALL then call an authenticated Server Action. When the action returns `validationErrors` or `serverError`, or the request fails, the store SHALL be restored to its previous value, and every mounted reader SHALL see the restore.

A playback position SHALL also update the store at once, but a refused position write SHALL NOT be rolled back: positions are coalesced, and the next write carries a newer position anyway.

#### Scenario: A mark shows immediately
- **WHEN** the learner activates Mark as complete
- **THEN** the completion mark appears before the action has answered

#### Scenario: A refused mark is withdrawn
- **WHEN** the mark-complete action answers with a server error
- **THEN** the completion mark disappears again and the lesson reads as incomplete

### Requirement: Playback writes to the server are coalesced and flushed on exit

The client SHALL update the store on every position the player hands it. During continuous playback it SHALL write to the server at most once every 10 seconds per lesson. A `pause`, `seeking`, `ended`, unmount or `pagehide` SHALL flush the latest position at once. The `pagehide` flush SHALL use `navigator.sendBeacon` to `POST /api/learner/playback-position`, a route handler that verifies the session, validates the body against `PlaybackPosition` and writes through the same adapter.

#### Scenario: Ten seconds of playback write once
- **WHEN** the player reports positions every 1.5 seconds for 10 seconds
- **THEN** the server receives at most one position write for that lesson in that window

#### Scenario: Closing the tab keeps the latest position
- **WHEN** the learner closes the tab 4 seconds after the last server write
- **THEN** a beacon carrying the latest position is sent, and reopening the lesson offers to resume from it

#### Scenario: A beacon without a session is refused
- **WHEN** the route handler receives a body without a valid session cookie
- **THEN** it answers `401` and writes nothing

### Requirement: "This device" in learner specs means the signed-in learner

Wherever an existing capability describes the learner's completion, playback positions, continue-watching location or profile as held "on this device", "on a device" or "in storage", it SHALL be read as held for the signed-in learner's account, and the scenarios SHALL hold across every device the learner signs in on. Device-local state that is not learner progress (the theme, the seek step, the pending-prize announcement) SHALL stay in the browser.

#### Scenario: A profile follows the learner
- **WHEN** a learner creates their card on a phone and signs in on a laptop
- **THEN** the laptop shows the same card, and course routes do not send them to the onboarding

#### Scenario: The seek step stays with the browser
- **WHEN** the learner changes the seek step on the phone
- **THEN** the laptop keeps its own seek step

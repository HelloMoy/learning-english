# Capability: lesson-progress

## Purpose

The `lesson-progress` capability records which lessons a learner has already taken, so a 107-lesson course can answer "where was I?". It covers the browser-local-storage adapter behind the existing `ProgressTracker` port, the client-side composition root that reads it, how the indicator resolves after hydration without asserting a false state, and the rule that completion and playback position stay independent concepts.

Completion is per-device in v1 (`localStorage`), not per-user: there is no auth yet, so nothing syncs across devices. The port contract is written so a server-backed adapter can replace it without touching consumers.

The ubiquitous language is `GLOSSARY.md`.
## Requirements
### Requirement: Completion survives reloads on the device that recorded it

A lesson marked complete SHALL still be reported complete after a page reload, after a navigation to another route and back, after a server restart, and on any other device or browser where the same learner signs in.

Completion SHALL be per account, not per device: it belongs to the signed-in learner and is stored in the database.

#### Scenario: A mark survives a reload
- **WHEN** a learner marks a lesson complete and then reloads the page
- **THEN** the lesson is still reported complete

#### Scenario: A mark survives a server restart
- **WHEN** a learner marks a lesson complete and the server is restarted
- **THEN** the lesson is still reported complete, because the state lives in the database and not in the server's memory

#### Scenario: A mark follows the learner to another device
- **WHEN** a learner marks a lesson complete in one browser and signs in to another
- **THEN** the second browser reports the lesson complete after hydration

### Requirement: The client reads completion through a single composition root

The browser SHALL read completion through one client-side composition root, the only client module permitted to call the completion Server Actions, mirroring the role `usePlaybackPosition` plays for playback and the learner-repositories factory plays on the server. Components SHALL NOT read `window.localStorage` for completion, and SHALL NOT call the completion actions directly.

The composition root SHALL be the only place that writes completion too, both the mark and the un-mark, so no component reaches an action to clear a mark either.

The composition root SHALL expose a single shared snapshot, so that every surface showing completion agrees at any moment and a lesson marked on one surface is immediately reflected on another rendered at the same time.

#### Scenario: Components never touch storage directly
- **WHEN** any component needs to know whether a lesson is complete
- **THEN** it obtains that through the composition root; it never reads `window.localStorage`, `document.cookie`, or any browser storage API directly

#### Scenario: Surfaces agree with one another
- **WHEN** a lesson is marked complete while both the outline and a completion indicator for that lesson are rendered
- **THEN** both reflect the new state without requiring a reload

#### Scenario: Surfaces agree when a mark is removed
- **WHEN** a lesson is un-marked while those same surfaces are rendered
- **THEN** both stop showing it as complete without requiring a reload, through the same shared snapshot

### Requirement: The completion indicator resolves after hydration without asserting a false state

Because completion lives in the browser, the server SHALL render no completion marks
and no watch-progress indicators, and the first client render SHALL match that server
output so hydration does not mismatch. Marks and progress indicators SHALL appear once
the client has read storage.

The indicator SHALL express only the completed state. It SHALL NOT render an explicit
"not completed" marker, so that the pre-hydration frame omits information rather than
asserting something untrue about the learner's progress. The same rule governs the
watch-progress bar and the module progress meter: an unwatched lesson and an untouched
module render no indicator at all rather than one drawn at zero.

#### Scenario: Server and first client render agree
- **WHEN** a page containing completion or progress indicators is server-rendered and hydrated
- **THEN** no hydration mismatch is produced, because both render the same absence of indicators

#### Scenario: Marks appear after the client reads storage
- **WHEN** hydration completes and storage reports a lesson complete
- **THEN** that lesson's mark appears

#### Scenario: An incomplete lesson is shown by omission
- **WHEN** a lesson has not been completed
- **THEN** its row carries no completion mark, and no marker asserting "not completed" is rendered

#### Scenario: An unwatched lesson shows no empty bar
- **WHEN** a lesson has no stored playback position and is not complete
- **THEN** its row renders no progress bar, rather than a bar drawn at zero

### Requirement: Completion and playback position remain independent

A saved playback position below the lesson's finish threshold SHALL NOT mark the
lesson complete, and marking a lesson complete SHALL NOT alter or clear its saved
playback position.

Completion has two producers, both writing the same key through the same
`ProgressTracker` port: the manual **Mark as complete** button, and playback crossing
the finish threshold defined by the `watch-progress` capability. There is one stored
notion of "done"; the finish rule is a second way of reaching it, not a second state.

A recorded completion SHALL NOT be cleared by any later playback: seeking backwards or
rewatching a completed lesson leaves it complete. The learner's own deliberate un-mark
is the only thing that clears it, and it SHALL NOT alter or clear the lesson's saved
playback position either — the two concepts stay independent in both directions.

Because the finish threshold is a second producer of completion, a lesson that was
un-marked and is then watched past that threshold SHALL be recorded complete again.
That is the existing rule applying unchanged, not a special case.

#### Scenario: Watching part of a lesson does not complete it
- **WHEN** a lesson has a saved playback position below its finish threshold and was never marked
- **THEN** it is reported as not complete

#### Scenario: Watching to the end completes it
- **WHEN** playback of a lesson crosses its finish threshold
- **THEN** the lesson is reported complete, through the same storage key the manual button writes

#### Scenario: Completing preserves the position
- **WHEN** a lesson with a saved playback position is marked complete
- **THEN** the saved position is unchanged and resuming still offers it

#### Scenario: Rewatching does not un-complete
- **WHEN** a completed lesson is replayed from the beginning
- **THEN** it is still reported complete

#### Scenario: Un-marking preserves the position
- **WHEN** a completed lesson with a saved playback position is un-marked
- **THEN** the saved position is unchanged and resuming still offers it

#### Scenario: Watching an un-marked lesson to the end completes it again
- **WHEN** a lesson is un-marked and playback then crosses its finish threshold
- **THEN** the lesson is reported complete again, through the same storage key


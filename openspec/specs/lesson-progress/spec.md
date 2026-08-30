# Capability: lesson-progress

## Purpose

The `lesson-progress` capability records which lessons a learner has already taken, so a 107-lesson course can answer "where was I?". It covers the browser-local-storage adapter behind the existing `ProgressTracker` port, the client-side composition root that reads it, how the indicator resolves after hydration without asserting a false state, and the rule that completion and playback position stay independent concepts.

Completion is per-device in v1 (`localStorage`), not per-user: there is no auth yet, so nothing syncs across devices. The port contract is written so a server-backed adapter can replace it without touching consumers.

The ubiquitous language is `GLOSSARY.md`.

## Requirements

### Requirement: `BrowserLocalStorageProgressTracker` persists completion in `localStorage`

The `BrowserLocalStorageProgressTracker` adapter SHALL implement the existing `ProgressTracker` port by reading and writing `window.localStorage` under the key namespace `learning-english:completed:{lessonId}`, where `{lessonId}` is the lesson identifier verbatim. The presence of the key SHALL mean the lesson is complete and its absence SHALL mean it is not; there SHALL be no third state.

The adapter SHALL guard against `window.localStorage` being `undefined` (SSR, tests, restricted environments) by treating any read as "not complete" and any write as a no-op, without throwing. A write that the browser rejects (quota exceeded, storage blocked) SHALL NOT propagate an exception to the caller.

The adapter SHALL be browser-only and MUST NOT be imported from Server Components, Server Actions, or the server dependency graph, which continues to bind `InMemoryProgressTracker`.

#### Scenario: A completed lesson round-trips
- **WHEN** `markComplete(lessonId)` is called and the same browser session then calls `isComplete(lessonId)`
- **THEN** `isComplete(lessonId)` resolves to `true`

#### Scenario: An unmarked lesson reads as incomplete
- **WHEN** `isComplete(lessonId)` is called for a lesson that was never marked
- **THEN** it resolves to `false`

#### Scenario: Marking is idempotent
- **WHEN** `markComplete(lessonId)` is called twice for the same lesson
- **THEN** the second call succeeds and `isComplete(lessonId)` still resolves to `true`

#### Scenario: Lessons are isolated
- **WHEN** `markComplete(lessonA)` is called and then `isComplete(lessonB)` is called for a different lesson
- **THEN** `isComplete(lessonB)` resolves to `false`

#### Scenario: The adapter no-ops when `localStorage` is unavailable
- **WHEN** the adapter is constructed in an environment where `window` or `window.localStorage` is `undefined`
- **THEN** `isComplete` resolves to `false` and `markComplete` resolves without throwing

#### Scenario: A rejected write does not break the caller
- **WHEN** the underlying `Storage.setItem` throws (for example, quota exceeded or storage blocked)
- **THEN** `markComplete` resolves without propagating the exception

### Requirement: Completion survives reloads on the device that recorded it

A lesson marked complete SHALL still be reported complete after a page reload, after a navigation to another route and back, and after a server restart, on the same browser profile.

Completion SHALL be per-device, not per-user: the application has no authentication, so completion recorded in one browser SHALL NOT be expected to appear in another browser or on another device.

#### Scenario: A mark survives a reload
- **WHEN** a learner marks a lesson complete and then reloads the page
- **THEN** the lesson is still reported complete

#### Scenario: A mark survives a server restart
- **WHEN** a learner marks a lesson complete and the server is restarted
- **THEN** the lesson is still reported complete, because the state lives in the browser and not in the server's memory

### Requirement: The client reads completion through a single composition root

The browser SHALL read completion through one client-side composition root — the only place permitted to name the concrete browser adapter — mirroring the role `usePlaybackPosition` plays for playback and `getCoursePlatformDeps` plays on the server. Components SHALL NOT read `window.localStorage` directly.

The composition root SHALL expose a single shared snapshot, so that every surface showing completion agrees at any moment and a lesson marked on one surface is immediately reflected on another rendered at the same time.

#### Scenario: Components never touch storage directly
- **WHEN** any component needs to know whether a lesson is complete
- **THEN** it obtains that through the composition root; it never reads `window.localStorage`, `document.cookie`, or any browser storage API directly

#### Scenario: Surfaces agree with one another
- **WHEN** a lesson is marked complete while both the outline and a completion indicator for that lesson are rendered
- **THEN** both reflect the new state without requiring a reload

### Requirement: The completion indicator resolves after hydration without asserting a false state

Because completion lives in the browser, the server SHALL render no completion marks, and the first client render SHALL match that server output so hydration does not mismatch. Marks SHALL appear once the client has read storage.

The indicator SHALL express only the completed state. It SHALL NOT render an explicit "not completed" marker, so that the pre-hydration frame omits information rather than asserting something untrue about the learner's progress.

#### Scenario: Server and first client render agree
- **WHEN** a page containing completion indicators is server-rendered and hydrated
- **THEN** no hydration mismatch is produced, because both render the same absence of marks

#### Scenario: Marks appear after the client reads storage
- **WHEN** hydration completes and storage reports a lesson complete
- **THEN** that lesson's mark appears

#### Scenario: An incomplete lesson is shown by omission
- **WHEN** a lesson has not been completed
- **THEN** its row carries no completion mark, and no marker asserting "not completed" is rendered

### Requirement: Completion and playback position remain independent

A saved playback position SHALL NOT mark a lesson complete, and marking a lesson complete SHALL NOT alter or clear its saved playback position.

#### Scenario: Watching does not complete
- **WHEN** a lesson has a saved playback position but was never marked complete
- **THEN** it is reported as not complete

#### Scenario: Completing preserves the position
- **WHEN** a lesson with a saved playback position is marked complete
- **THEN** the saved position is unchanged and resuming still offers it

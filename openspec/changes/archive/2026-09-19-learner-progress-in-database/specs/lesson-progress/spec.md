## REMOVED Requirements

### Requirement: `BrowserLocalStorageProgressTracker` persists completion in `localStorage`
**Reason**: Completion moves to the signed-in learner's rows in the database.
**Migration**: The Turso `ProgressTracker` adapter (capability `learner-state`) honours the same port scenarios: round-trip, idempotent mark and un-mark, and isolation between lessons. Existing `learning-english:completed:*` keys are ignored and not imported.

## MODIFIED Requirements

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

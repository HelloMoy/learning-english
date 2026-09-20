## MODIFIED Requirements

### Requirement: A client composition root exposes every saved playback position as one snapshot

The browser SHALL read all saved playback positions through a single client-side
composition root, the only client module besides the per-lesson playback hook permitted to
write positions, mirroring the role the completion composition root plays for
`lesson-progress`.

The root SHALL expose a **synchronous, subscribable snapshot** keyed by lesson id, so
a list of rows can render every lesson's progress in one pass rather than awaiting one
promise per row. The snapshot SHALL come from the learner store seeded by the server.
Components SHALL NOT read `window.localStorage` for positions.

The snapshot SHALL be shared across every subscriber and SHALL be stable by identity
between reads, so a consumer may return it from `useSyncExternalStore` without
looping. Writing a position through the player's write path SHALL notify subscribers.

Before hydration, and for a learner with no saved position, the snapshot SHALL be empty
rather than throwing.

#### Scenario: A list reads every position without a promise per row
- **WHEN** a view renders 31 lesson rows that each need a watched fraction
- **THEN** it obtains all positions from one snapshot read, and issues no per-row asynchronous call

#### Scenario: Components never touch storage directly
- **WHEN** any component needs a lesson's playback position
- **THEN** it obtains it through the composition root; it never reads `window.localStorage` or any browser storage API directly

#### Scenario: Surfaces agree with one another
- **WHEN** a position is written while more than one surface showing progress is mounted
- **THEN** every mounted surface reflects the new value without a reload

#### Scenario: The server render has an empty snapshot
- **WHEN** a view showing progress renders on the server
- **THEN** the snapshot is empty and no exception escapes to the caller

### Requirement: Progress state stays per device and adds no persisted field

Watch progress SHALL be derived entirely from data the `playback-position` and
`lesson-progress` capabilities already persist. It SHALL NOT introduce a persisted field
of its own; the only write it adds is the completion the existing `ProgressTracker`
already owns.

Progress SHALL be per account, as position and completion are: it follows the learner to
every device they sign in on.

#### Scenario: No new persisted field appears
- **WHEN** a learner watches a lesson to the end
- **THEN** the only rows written are that learner's playback position and completion for that lesson

#### Scenario: Progress crosses devices
- **WHEN** a learner watches lessons in one browser and opens the course signed in on another
- **THEN** the second browser shows the same progress after hydration

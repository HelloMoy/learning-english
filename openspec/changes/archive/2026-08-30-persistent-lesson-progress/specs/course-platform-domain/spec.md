## MODIFIED Requirements

### Requirement: `markLessonComplete` is ephemeral in v1

The `markLessonComplete` use case SHALL write to a `ProgressTracker` port (or to an existing port extended for this purpose). Whether completed state survives is a property of the bound adapter, not of the use case: the contract is identical either way.

The server dependency graph SHALL continue to bind the in-memory adapter, whose state is lost when it is reconstructed. The browser SHALL bind a `localStorage`-backed adapter, whose state survives reloads and server restarts on that device (see the `lesson-progress` capability). The use case contract is unchanged when a server-backed, per-user adapter arrives.

#### Scenario: Calling `markLessonComplete` twice returns the same value
- **WHEN** the use case is called twice with the same `lessonId` against a freshly constructed in-memory adapter
- **THEN** both calls resolve to `{ ok: true, value: { completed: true } }` and the second call is idempotent

#### Scenario: Server-side completed state is lost when the in-memory adapter is reconstructed
- **WHEN** `markLessonComplete` is called against the server's in-memory adapter, and that adapter is rebuilt (e.g., server restart)
- **THEN** the next call against the rebuilt adapter still resolves to `{ ok: true, value: { completed: true } }` but the previous "completed" state is no longer observable through that adapter

#### Scenario: Durability depends on the bound adapter, not on the use case
- **WHEN** the same use case runs against the browser `localStorage` adapter instead of the in-memory one
- **THEN** the result shape is unchanged, and the completed state remains observable after a reload or a server restart on that device

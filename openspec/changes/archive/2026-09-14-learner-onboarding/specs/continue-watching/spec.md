## REMOVED Requirements

### Requirement: The home offers to continue the last lesson
**Reason**: The home is always the landing; offering to continue moves to the learner's own page.
**Migration**: See `my-learning` — "My learning resumes the last lesson or starts the first", which keeps the same rules: one playback affordance, a bar only for a video with a saved position, and a placeholder only while a stored record resolves.

## ADDED Requirements

### Requirement: My learning offers to continue the last lesson

My learning SHALL offer to continue the last lesson when, and only when, a stored location resolves to a
live lesson. The resume panel's primary action SHALL be its only playback affordance for the lesson; no
decorative play control SHALL render beside it.

When the lesson is a video lesson with a saved playback position, the panel SHALL show how far through it
the learner is; otherwise the indicator SHALL be omitted rather than rendered at zero.

Resolving a stored location requires a server round-trip. During that window the panel area SHALL be
reserved with a placeholder of the panel's shape when, and only when, the client's read of the stored
location returned one; without a stored location nothing SHALL be reserved and the start panel SHALL render.
When the round-trip answers that the record no longer resolves, the start panel SHALL render.

#### Scenario: A stored record reserves the panel while it resolves
- **WHEN** My learning has read a stored location and the round-trip has not answered
- **THEN** the panel area shows a placeholder naming no lesson and showing no progress

#### Scenario: A reading lesson shows no progress bar
- **WHEN** the resolved lesson is a reading lesson
- **THEN** the resume panel renders without a progress indicator and still offers Resume

#### Scenario: A dead record falls back to the start panel
- **WHEN** the stored location no longer resolves
- **THEN** My learning shows the start panel and no error

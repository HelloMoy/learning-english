## MODIFIED Requirements

### Requirement: My learning offers to continue the last lesson

My learning SHALL offer to continue when, and only when, a stored location resolves to a live lesson. The
video it offers SHALL be that lesson's course's **continue target**, as defined by the `continue-target`
capability with the stored location as the last opened video — never the recorded video when that video is
already finished. The resume panel's primary action SHALL be its only playback affordance for the offered
video; no decorative play control SHALL render beside it.

When the offered video is a video lesson with a saved playback position, the panel SHALL show how far
through it the learner is; otherwise the indicator SHALL be omitted rather than rendered at zero.

Resolving a stored location requires a server round-trip, and resolving a continue target that differs from
the stored location requires one more. During that window the panel area SHALL be reserved with a
placeholder of the panel's shape when, and only when, the client's read of the stored location returned one;
without a stored location nothing SHALL be reserved and the start panel SHALL render. When the round-trip
answers that the record no longer resolves, the start panel SHALL render.

#### Scenario: A stored record reserves the panel while it resolves
- **WHEN** My learning has read a stored location and the round-trip has not answered
- **THEN** the panel area shows a placeholder naming no lesson and showing no progress

#### Scenario: A finished recorded video is not offered again
- **WHEN** the stored location resolves to a video the learner has finished
- **THEN** the resume panel offers the next unfinished video of that course instead

#### Scenario: A reading lesson shows no progress bar
- **WHEN** the offered lesson is a reading lesson
- **THEN** the resume panel renders without a progress indicator and still offers Resume

#### Scenario: A dead record falls back to the start panel
- **WHEN** the stored location no longer resolves
- **THEN** My learning shows the start panel and no error

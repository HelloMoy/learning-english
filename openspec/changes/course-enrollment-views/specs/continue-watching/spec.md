## MODIFIED Requirements

### Requirement: My learning offers to continue the last lesson

My learning SHALL offer to continue in the enrolled course the learner watched most recently, using that course's own stored location. The video it offers SHALL be that course's **continue target**, as defined by the `continue-target` capability with that course's stored location as the last opened video — never the recorded video when that video is already finished. The hero's primary action SHALL be its only playback affordance for the offered video; no decorative play control SHALL render beside it.

When the offered video is a video lesson with a saved playback position, the hero SHALL show how far through it the learner is; otherwise the indicator SHALL be omitted rather than rendered at zero.

The offer SHALL be computed on the client from the course data the page was rendered with, the learner's stored locations, completion marks and positions — without a server round-trip. Until the learner store has been seeded, the hero area SHALL render a placeholder of its shape naming no lesson. A stored location that no longer names a video of its course SHALL be treated as absent, and the course's continue target SHALL be chosen from its progress alone.

#### Scenario: The store is not seeded yet
- **WHEN** My learning renders before the learner snapshot is adopted
- **THEN** the hero area shows a placeholder naming no lesson and showing no progress

#### Scenario: A finished recorded video is not offered again
- **WHEN** the latest stored location names a video the learner has finished
- **THEN** the hero offers the next unfinished video of that course instead

#### Scenario: A reading lesson shows no progress bar
- **WHEN** the offered lesson is a reading lesson
- **THEN** the hero renders without a progress indicator and still offers Resume

#### Scenario: A dead record falls back to the course's progress
- **WHEN** the latest stored location no longer names a video of its course
- **THEN** My learning offers that course's continue target chosen from its progress, and shows no error

## ADDED Requirements

### Requirement: The course overview continues from its own course's place

The course overview SHALL choose its continue target with its own course's stored location, read from the per-course records, not the most recent location across courses.

#### Scenario: Watching another course keeps this course's place
- **WHEN** a learner opened Basic's sixth vowels video and then an Advanced lesson, and opens the Basic overview
- **THEN** the Basic overview continues from the sixth vowels video

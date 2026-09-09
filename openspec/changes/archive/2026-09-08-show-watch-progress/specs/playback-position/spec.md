## MODIFIED Requirements

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

## MODIFIED Requirements

### Requirement: Completion and playback position remain independent

A saved playback position below the lesson's finish threshold SHALL NOT mark the
lesson complete, and marking a lesson complete SHALL NOT alter or clear its saved
playback position.

Completion has two producers, both writing the same key through the same
`ProgressTracker` port: the manual **Mark as complete** button, and playback crossing
the finish threshold defined by the `watch-progress` capability. There is one stored
notion of "done"; the finish rule is a second way of reaching it, not a second state.

A recorded completion SHALL NOT be cleared by any later playback: seeking backwards or
rewatching a completed lesson leaves it complete.

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

## MODIFIED Requirements

### Requirement: The current lesson is featured on the route

The **current** lesson SHALL be the module's **continue target**, as defined once by the
`continue-target` capability: the rule applied to the module's lessons in `sequence` order, with the
lesson recorded by the `continue-watching` capability as the last opened lesson when it belongs to this
module. The module overview SHALL NOT restate or reimplement that rule; its route SHALL obtain the
current step from `findContinueTarget`.

A target of kind `start` or `continue` SHALL be the current step. A target of kind `rewatch` — every
lesson finished — SHALL make no step current.

Because the record holds the lesson opened last, opening an earlier lesson to review it
moves the current lesson to that point; the record cannot tell a review from a return to
the start, and a return to the start is what the learner means more often.

The current step SHALL be expanded into a featured card showing the lesson's poster
(or the gradient fallback), a "you are here" eyebrow naming `Video N`, the title, and one
primary action linking to the lesson.

When the current lesson is partly watched, the card SHALL show its watch progress bar
and the minutes left in that lesson, and the primary action SHALL read as continuing.
When it has not been started, the card SHALL show no bar and the primary action SHALL
read as starting the video.

A module in which every lesson is finished SHALL have no current step and SHALL feature
no card.

The featured card SHALL expose exactly one announced and tabbable link — its primary
action — with the poster excluded from the accessibility tree and the tab order.

#### Scenario: A learner going in order is featured the next video
- **WHEN** lessons 1–5 are finished and lesson 5 was opened last
- **THEN** step 6 is expanded into the featured card and no other step is expanded

#### Scenario: A learner who skipped ahead is not sent back to the start
- **WHEN** lessons 25–27 are finished, lesson 27 was opened last and lessons 1–24 have no progress
- **THEN** step 28 is featured, and steps 1–24 render as upcoming

#### Scenario: A learner who returned to the start continues there
- **WHEN** lessons 25–27 are finished, and afterwards lessons 1–2 were finished with lesson 2 opened last
- **THEN** step 3 is featured, not step 28

#### Scenario: A partly watched last opened lesson is featured itself
- **WHEN** lessons 25–27 are finished and lesson 7 was opened last and is partly watched
- **THEN** step 7 is featured

#### Scenario: A record from another module falls back to the furthest progress
- **WHEN** lessons 25–27 of this module are finished and the last opened lesson belongs to another module
- **THEN** step 28 is featured

#### Scenario: A partly watched furthest lesson is featured when there is no record
- **WHEN** there is no record, lesson 1 is finished, lesson 2 is not started and lesson 7 is partly watched
- **THEN** step 7 is featured, and step 2 renders as an upcoming step

#### Scenario: Nothing left after the anchor falls back to the first gap
- **WHEN** the last lesson of the module is finished and opened last, and lessons 3–24 have no progress
- **THEN** the first unfinished lesson, step 3 when 1–2 are finished, is featured

#### Scenario: An untouched module features its first video
- **WHEN** no lesson in the module has any progress
- **THEN** step 1 is featured

#### Scenario: A partly watched current lesson offers to continue
- **WHEN** the current lesson has a stored position of 264 seconds against a 660-second duration
- **THEN** the card shows a bar at 40%, states 7 minutes left, and its action reads as continuing

#### Scenario: An unstarted current lesson offers to start
- **WHEN** the current lesson has no stored position
- **THEN** the card shows no progress bar and its action reads as starting the video

#### Scenario: A finished module features nothing
- **WHEN** every lesson in the module is finished
- **THEN** no step is expanded and every step shows the finished marker

#### Scenario: The module and the course pick the same video
- **WHEN** the current step of a module is video 4 and that module holds the course's continue target
- **THEN** the course overview's continue tile offers the same video 4

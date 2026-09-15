## MODIFIED Requirements

### Requirement: My learning resumes the last lesson or starts the first

When a stored continue-watching location resolves to a live lesson, My learning SHALL show a resume
panel for the **continue target** of that lesson's course — the video the `continue-target` capability
picks from the course's videos in learning order, the learner's progress on this device, and the stored
location as the last opened video. The panel SHALL show the course, the target's module ordinal and
title, the target's position in its module (`Video 6 of 17`), the target's title, a progress bar when a
playback position is saved for a video lesson, a primary **Resume** action to the target, and a quieter
link to the course overview. When every video of that course is finished, the target SHALL be the
course's first video.

When no location is stored, or it no longer resolves, the page SHALL show a start panel whose primary
action opens the first lesson of the first catalog course. While a stored location, or the continue target
derived from it, is resolving, the panel area SHALL show a placeholder naming no lesson.

#### Scenario: A resolved record offers Resume
- **WHEN** the stored location resolves to the sixth video of a seventeen-video module and that video is not finished
- **THEN** the panel shows `Video 6 of 17` and Resume links to that lesson

#### Scenario: A finished recorded video resumes the next one
- **WHEN** the stored location names the sixth video of a seventeen-video module and that video is finished
- **THEN** the panel shows `Video 7 of 17`, names the seventh video, and Resume links to it

#### Scenario: Nothing watched offers the first lesson
- **WHEN** no location is stored
- **THEN** the panel's primary action links to the first lesson of the first course

### Requirement: Lesson progress is listed as lesson cards

My learning SHALL list, for the continued course — or the first catalog course when nothing is
continued — the course title, its completed and total video counts, and one card per module. Each card
SHALL show the module's ordinal, title, a progress ring labelled with the module's completed share as a
whole, locale-formatted percentage, and its completed-of-total video count. The ring SHALL be the same
progress ring the course overview draws. Counts SHALL use the same completion rule as the course
overview, and before hydration every ring SHALL read 0%.

Every card SHALL open its module's overview (`/[locale]/courses/<course>/modules/<module>`).

When a lesson is continued, the card of the module holding the course's **continue target** SHALL come
first and span the list's width, marked `Current`, naming the continue target's video, and SHALL be the
only card offering a **Continue** action, which opens that video. The other cards SHALL follow in
`sequence` order. When nothing is continued, every card SHALL render in `sequence` order and none SHALL
offer Continue.

#### Scenario: The continued module leads with Continue
- **WHEN** the continue target is a video of the second module
- **THEN** the second module's card is first, marked Current, names that video, and its Continue action opens the video; no other card offers Continue

#### Scenario: A finished last video of a module hands the lead to the next module
- **WHEN** the stored location names the finished last video of the second module and the third module is not finished
- **THEN** the third module's card leads, names its first unfinished video, and its Continue action opens that video

#### Scenario: Nothing continued offers no Continue
- **WHEN** no lesson is continued
- **THEN** the cards follow `sequence` order and no card offers Continue

#### Scenario: A card opens its module overview
- **WHEN** the learner activates the third module's card
- **THEN** they land on that module's overview for the active locale

#### Scenario: A finished module reads as complete
- **WHEN** every video of a module is complete
- **THEN** its ring reads 100%

#### Scenario: A card's ring fills to the module's share
- **WHEN** one of a module's three videos is complete
- **THEN** its card's ring fill covers a third of the circle and its label reads 33%

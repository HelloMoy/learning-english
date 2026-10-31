## ADDED Requirements

### Requirement: The outline states each lesson's progress and the course's

Every lesson row (a domain `Module` disclosure) in the "Course outline" SHALL lead with a **completion ring** and SHALL state its reading on a line beneath its title, in the desktop sidebar and the expanded mobile drawer alike:

| The learner has completed | Ring | Reading |
| --- | --- | --- |
| none of its videos | track only | `6 videos` |
| some of its videos | filled to the completed share | `4 / 6 videos · 67%` |
| all of its videos | a solid gold disc bearing a check | `Lesson completed` |

Under its heading the outline SHALL render a **course summary**: a bar filled to the share of
the course's videos completed, that share as a percentage, and a line stating
`{completed} of {total} videos · {completedLessons} of {lessonCount} lessons completed`.

Every reading SHALL count through the shared completion rule — marked complete or watched to
the end, a video with no runtime counted by its mark alone — so the outline's rings, summary
and video completion marks can never disagree.

Because completion is read from the browser's storage, the server-rendered frame and the
hydration render SHALL draw every ring and the summary bar as a track with no fill, SHALL state
each lesson's reading as its video count, and SHALL state no percentage. A learner who has
completed nothing SHALL see the same frame after hydration: the outline SHALL NOT assert that
the learner has watched nothing.

The ring and the check are decorative. The reading SHALL reach assistive technology as text,
and the lesson row's accessible **name** SHALL remain the lesson title alone — the reading is
its accessible **description** — so a screen reader still announces each disclosure by its
title and the row keeps exactly one tab stop. Copy SHALL follow the `course-vocabulary`
capability (a `Module` is a "lesson", a `Lesson` is a "video") in every supported locale.

#### Scenario: A lesson in progress states its share

- **WHEN** the outline renders a lesson of 6 videos of which the learner has completed 4
- **THEN** its ring is filled to two thirds and its row reads `4 / 6 videos · 67%`

#### Scenario: A finished lesson says it is finished

- **WHEN** the learner has completed every video of a lesson
- **THEN** its ring is drawn as a solid disc with a check and its row reads `Lesson completed`

#### Scenario: An untouched lesson states its size, not a failure

- **WHEN** the learner has completed none of a lesson's 6 videos
- **THEN** its ring shows the track alone and its row reads `6 videos`, with no percentage

#### Scenario: The course summary states the whole course

- **WHEN** the learner has completed 35 of the course's 107 videos, finishing 4 of its 10 lessons
- **THEN** the summary bar is filled to that share, shows `33%`, and reads `35 of 107 videos · 4 of 10 lessons completed`

#### Scenario: Nothing is claimed before hydration

- **WHEN** the server-rendered HTML of a lesson page is inspected for a learner with stored progress
- **THEN** every ring and the summary bar carry no fill, each lesson row states its video count, and no percentage is present

#### Scenario: The reading describes the row without renaming it

- **WHEN** a screen reader reaches a lesson row whose lesson is in progress
- **THEN** the disclosure's accessible name is the lesson title and its description is the reading

#### Scenario: The rings agree with the marks they open onto

- **WHEN** the learner expands a lesson whose ring reads `4 / 6 videos`
- **THEN** exactly four of its video rows carry the completion mark

## MODIFIED Requirements

### Requirement: The course outline is a compact row on small viewports

Below the `lg` breakpoint the "Course outline" SHALL be presented as a single-row card above
the breadcrumb, collapsed on arrival, holding: a circular **completion ring** tile, the
localized "Course outline" title, a subtitle stating the current lesson's module and its
position within that module, and a chevron indicating the collapsed or expanded state. The
ring SHALL be filled to the learner's completed share of the course and SHALL show that share
as a percentage inside it; until there is a reading it SHALL show the list icon inside an
unfilled track. The card SHALL NOT carry a separate edge meter.

The entire row SHALL be **one control**. The tile, the text, and the chevron SHALL NOT be
separately focusable, so a tap anywhere along the card's width expands the outline. The
chevron SHALL be decorative: the control's state SHALL be conveyed by `aria-expanded`, never
by the icon's direction alone.

The position reading SHALL be the current lesson's ordinal within its own module and that
module's lesson count — `Module · Lesson N of M`, where `M` counts the lessons of the module
named beside it, both derived from `sequence` order. Where the current lesson is not among
the course's lessons, the row SHALL state the title alone rather than an invented position.

At or above the `lg` breakpoint this row SHALL NOT render, and the sticky sidebar SHALL be
unaffected by everything in this requirement.

#### Scenario: The row names the region and states the position

- **WHEN** the learner opens the 13th of the 27 lessons in the module "Consonants" on a phone
- **THEN** the row shows the "Course outline" title and the subtitle `Consonants · Lesson 13 of 27`, in the active locale

#### Scenario: The row is a single tap target

- **WHEN** the row renders
- **THEN** exactly one focusable control exists in the card, and activating it anywhere along the row expands the outline

#### Scenario: The chevron reflects state without carrying it

- **WHEN** the row is expanded
- **THEN** the control reports `aria-expanded="true"` and the chevron is hidden from assistive technology

#### Scenario: A lesson with no derivable position still names the region

- **WHEN** the current lesson is not among the course's lessons
- **THEN** the row renders the "Course outline" title with no subtitle, and nothing fails

#### Scenario: The ring replaces the edge meter

- **WHEN** the row renders
- **THEN** it holds a completion ring in the tile's place and no meter along its bottom edge

#### Scenario: The row is absent on desktop

- **WHEN** the lesson page renders at or above the `lg` breakpoint
- **THEN** no compact row is rendered at any position on the page, and the sticky sidebar renders as specified elsewhere in this capability

### Requirement: The mobile row reports course completion only once it can be known

The compact row's completion ring SHALL be filled to the share of the course's lessons the
learner has completed, counted by the same rule the outline's own completion marks use: a
lesson counts as complete when it is marked complete or watched to the end, and a lesson with
no runtime is counted by its mark alone.

Because completion is read from the browser's storage, which the server cannot see, the row
SHALL render the ring's **track** — with the list icon inside it — in its server-rendered first
frame and during the hydration render, and SHALL NOT render its **fill** or its percentage
until hydration commits. A learner who has completed nothing SHALL see the track and the list
icon with no fill, and the ring SHALL carry no progress role and no progress reading in that
state — an indicator announcing zero is an assertion about the learner that the page is not
entitled to make.

Once there is a reading, the ring SHALL expose it to assistive technology as a `progressbar`
with a localized accessible name.

#### Scenario: The track renders before the fill can be known

- **WHEN** the server-rendered HTML of a lesson page is inspected
- **THEN** it contains the ring's track and the list icon, no filled portion and no percentage, while the `Module · Lesson N of M` reading — derived from the route, not from storage — is present

#### Scenario: Progress appears once hydration commits

- **WHEN** a learner who has completed 8 of 21 course lessons opens a lesson on a phone
- **THEN** after hydration the ring is filled to that share, shows `38%`, and carries a localized accessible name stating the reading

#### Scenario: A learner with no progress is not described as having none

- **WHEN** a learner who has completed nothing opens a lesson on a phone
- **THEN** the ring renders its track and the list icon with no fill, and carries no progress role and no reading

#### Scenario: The ring agrees with the rows it opens

- **WHEN** the learner expands the row and reads the completion marks in the outline
- **THEN** the number of marked lessons is the number the ring's share was computed from

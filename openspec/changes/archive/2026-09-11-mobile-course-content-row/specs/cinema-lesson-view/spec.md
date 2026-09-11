## ADDED Requirements

### Requirement: The course outline is a compact row on small viewports

Below the `lg` breakpoint the "Course outline" SHALL be presented as a single-row card above
the breadcrumb, collapsed on arrival, holding: a square tile bearing a list icon, the
localized "Course outline" title, a subtitle stating the current lesson's module and its
position within that module, and a chevron indicating the collapsed or expanded state. A thin
meter SHALL run along the card's bottom edge, filled to the learner's completed share of the
course.

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

#### Scenario: The row is absent on desktop

- **WHEN** the lesson page renders at or above the `lg` breakpoint
- **THEN** no compact row is rendered at any position on the page, and the sticky sidebar renders as specified elsewhere in this capability

### Requirement: The mobile row reports course completion only once it can be known

The compact row's edge meter SHALL be filled to the share of the course's lessons the learner
has completed, counted by the same rule the outline's own completion marks use: a lesson
counts as complete when it is marked complete or watched to the end, and a lesson with no
runtime is counted by its mark alone.

Because completion is read from the browser's storage, which the server cannot see, the row
SHALL render the meter's **track** in its server-rendered first frame and during the hydration
render, and SHALL NOT render its **fill** until hydration commits. A learner who has completed
nothing SHALL see the track with no fill, and the meter SHALL carry no progress role and no
progress reading in that state — an indicator announcing zero is an assertion about the
learner that the page is not entitled to make.

Once there is a reading, the meter SHALL expose it to assistive technology with a localized
accessible name.

#### Scenario: The track renders before the fill can be known

- **WHEN** the server-rendered HTML of a lesson page is inspected
- **THEN** it contains the meter's track and no filled portion, while the `Module · Lesson N of M` reading — derived from the route, not from storage — is present

#### Scenario: Progress appears once hydration commits

- **WHEN** a learner who has completed 8 of 21 course lessons opens a lesson on a phone
- **THEN** after hydration the edge meter is filled to that share and carries a localized accessible name stating the reading

#### Scenario: A learner with no progress is not described as having none

- **WHEN** a learner who has completed nothing opens a lesson on a phone
- **THEN** the meter renders its track with no fill, and carries no progress role and no reading

#### Scenario: The meter agrees with the rows it opens

- **WHEN** the learner expands the row and reads the completion marks in the outline
- **THEN** the number of marked lessons is the number the edge meter's share was computed from

### Requirement: The lesson page reads no presentation switch from the URL

The lesson page SHALL NOT vary its course-outline presentation on any search parameter. A URL
carrying `outline=a`, `outline=b`, `outline=c`, or any other value SHALL render exactly the
page a URL without that parameter renders.

#### Scenario: A leftover switch parameter changes nothing

- **WHEN** a learner opens a lesson URL carrying `?outline=a` or `?outline=c` on a phone
- **THEN** the compact row renders, exactly as it does without the parameter, and no alternative presentation exists to select

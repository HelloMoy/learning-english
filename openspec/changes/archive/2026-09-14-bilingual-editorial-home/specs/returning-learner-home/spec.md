## ADDED Requirements

### Requirement: The home chooses its state from the continue-watching record

The locale home SHALL render in one of two states: **new visitor** or **returning
learner**. The server render and the hydration pass SHALL render the new-visitor state.

After hydration the client SHALL read the stored continue-watching location:

- When no location is stored, the home SHALL stay in the new-visitor state.
- When a location is stored and its resolution has not answered, the hero SHALL be
  replaced by a placeholder of the returning hero's shape, naming no lesson, while every
  other section stays as rendered.
- When the location resolves to a live lesson, the home SHALL render the returning
  learner state.
- When the location no longer resolves, the home SHALL render the new-visitor state.

#### Scenario: No record keeps the new-visitor home
- **WHEN** the home is visited on a device with no stored location
- **THEN** the new-visitor hero, questions, levels table and closing band render, and no `Welcome back` copy appears

#### Scenario: A resolving record reserves the hero
- **WHEN** a location is stored and the resolution has not answered
- **THEN** the hero area shows a placeholder of the returning hero's shape and no lesson title

#### Scenario: A resolved record switches to the returning state
- **WHEN** a stored location resolves to a live lesson
- **THEN** the home renders the returning hero, the quick-review card, the progress list for that lesson's course, and the keep-going band

#### Scenario: A dead record falls back to the new-visitor home
- **WHEN** a stored location no longer resolves
- **THEN** the home renders the new-visitor state exactly as it does with no record

### Requirement: The returning hero offers exactly one way back in

In the returning state the hero SHALL show a localized welcome heading, the resolved
lesson's course, the module's localized ordinal and title, the lesson's position in its
module (`Video 6 of 17`), the lesson title, and a primary `Resume` action that navigates
to that lesson for the active locale.

When the lesson is a video lesson with a saved playback position, the hero SHALL show the
elapsed proportion as a progress bar; otherwise it SHALL omit the bar.

The hero SHALL also offer a secondary, visually quieter link to the course overview.
`Resume` SHALL be the page's only primary action above the levels table.

#### Scenario: The hero names the lesson and where it sits
- **WHEN** the stored location resolves to the sixth video of a seventeen-video lesson
- **THEN** the hero shows the lesson title and `Video 6 of 17`, and `Resume` links to that lesson

#### Scenario: A reading lesson shows no bar
- **WHEN** the resolved lesson is a reading lesson
- **THEN** the hero renders without a progress bar and still offers `Resume`

#### Scenario: The course overview stays one click away
- **WHEN** the returning hero renders
- **THEN** a secondary link to the resolved lesson's course overview renders beside `Resume`

### Requirement: The vowel-length card becomes a quick review for returning learners

In the returning state the vowel-length card SHALL render with its `quick-review` variant
in the same position the new-visitor card occupies.

#### Scenario: The card is relabelled, not replaced
- **WHEN** the home renders in the returning state
- **THEN** the vowel-length card renders with the `Quick review` eyebrow and working playback

### Requirement: The course being continued shows its progress lesson by lesson

In the returning state the home SHALL render a progress list for the course the resolved
lesson belongs to, in place of the new-visitor questions. It SHALL show the course title,
the course's completed and total video counts, and one row per module in `sequence`
order with the module's localized ordinal, its title, a progress bar and its completed
and total video counts.

Completion SHALL be counted with the same rule the course overview and lesson outline use,
so the three surfaces never disagree. A module whose videos are all complete SHALL show a
completed marker; the module containing the resolved lesson SHALL show a current marker.

Before hydration the list SHALL render its tracks without fills, so no row claims progress
the server cannot know.

#### Scenario: Every module of the course is listed in order
- **WHEN** the resolved lesson belongs to a course with five modules
- **THEN** the progress list renders five rows in `sequence` order, each with its completed and total counts

#### Scenario: The counts agree with the course overview
- **WHEN** two videos of a module are marked complete and a third was watched past the finish threshold
- **THEN** that module's row reports three completed videos, as its course overview card does

#### Scenario: The current module is marked
- **WHEN** the resolved lesson is in the second module
- **THEN** the second row carries the current marker and no other row does

### Requirement: The levels table marks the course being continued

In the returning state the levels table row for the course being continued SHALL show an
`In progress` badge, that course's completed and total video counts, and a
`Continue course` link to its course overview. Every other row SHALL render as it does in
the new-visitor state.

#### Scenario: Only the continued course is marked
- **WHEN** the resolved lesson belongs to the first course
- **THEN** the first row shows `In progress` and `Continue course`, and the second row shows neither

### Requirement: A keep-going band states what is left in the current lesson

In the returning state the closing band SHALL state how many videos of the resolved
lesson's module are not yet complete, name the resolved lesson and its position, and offer
`Resume` to the same destination as the hero. When every video of that module is
complete, the band SHALL say the module is complete and link to the course overview
instead.

#### Scenario: Remaining videos are counted
- **WHEN** five of a seventeen-video module are complete
- **THEN** the band reads `12 videos left in` followed by the module title, and offers `Resume`

#### Scenario: A finished module points onward
- **WHEN** every video of the resolved lesson's module is complete
- **THEN** the band says the module is complete and links to the course overview

### Requirement: Returning-learner copy is localized

Every string the returning state renders SHALL come from the active locale's messages in
`en`, `es` and `pt`, with ICU plurals for counts, and every link SHALL be locale-aware.

#### Scenario: The returning state renders in Spanish
- **WHEN** the returning state renders under `es`
- **THEN** the welcome heading, the position line, `Resume`, the progress list labels and the band come from `es.json`

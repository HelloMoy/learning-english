## MODIFIED Requirements

### Requirement: The course being continued is marked on its card

When a stored continue-watching location resolves to a lesson belonging to one of the catalog courses, that course's card SHALL be marked as in progress and its call to action SHALL invite the learner to continue rather than to start. Every other card SHALL read as not started.

The in-progress card's primary call to action SHALL navigate to **the resolved lesson itself** — the same destination as the `Continue watching` panel's action — not to the course overview. A card that says `Continue course` and lands two clicks short of the video contradicts the panel offering the real thing directly above it.

Because that primary action gives up the course overview, the in-progress card SHALL additionally render a **secondary action beneath it** that navigates to the course overview, so the whole course remains one click away. The two actions SHALL be visually distinguishable, the resume action reading as the primary one.

A not-started card SHALL keep exactly one call to action, to the course overview, and SHALL NOT render the secondary action.

Whenever there is no stored record, every card SHALL render the not-started state — the honest one — rather than flashing a mark it cannot yet justify. The in-progress state SHALL therefore be asserted only once a lesson href is known, so no card ever offers a resume action with nowhere to resume to.

When a stored record **does** exist and the round-trip that resolves it has not yet answered, the card's progress mark and its call-to-action area SHALL be reserved with a placeholder of their own dimensions instead of asserting the not-started state. The record's existence is known synchronously, before the round-trip; the course it belongs to is not. Reserving says "one of these cards is in progress and we are finding out which", which is true, and it stops the primary action's wording from changing under the learner's thumb. Every card SHALL reserve alike during that window, because guessing which one to reserve is the assertion being avoided.

When the round-trip answers, the resolved card SHALL take the in-progress state and every other card SHALL take the not-started state. When it answers that the record no longer resolves, every card SHALL take the not-started state.

#### Scenario: The in-progress course is marked
- **WHEN** the stored location points at a lesson of the first course
- **THEN** that course's card shows an in-progress mark and a `Continue course` action, and the other cards show a not-started mark and a `Start course` action

#### Scenario: Continuing goes to the lesson, not the course overview
- **WHEN** the stored location resolves to a lesson of a catalog course
- **THEN** that card's `Continue course` action links to that lesson's locale-aware path — the same href the `Continue watching` panel uses — and not to the course overview

#### Scenario: The in-progress card still reaches the course overview
- **WHEN** a card renders in the in-progress state
- **THEN** a second, secondary action renders beneath the primary one and links to the course overview for the active locale

#### Scenario: A not-started card offers one way in
- **WHEN** a card renders in the not-started state
- **THEN** it renders a single `Start course` action to the course overview and no secondary action

#### Scenario: An unresolvable record leaves every card unmarked
- **WHEN** a location is stored but no longer resolves to a live lesson
- **THEN** every card renders the not-started state, and no card offers a resume action

#### Scenario: No record leaves every card unmarked
- **WHEN** no location is stored
- **THEN** every card shows the not-started state

#### Scenario: A pending record reserves every card's mark and action
- **WHEN** the client has read a stored location and the round-trip that resolves it has not answered
- **THEN** every card shows a placeholder in place of its progress mark and its call-to-action area, and no card asserts either state

#### Scenario: The server-rendered card asserts nothing it cannot know
- **WHEN** the home is server-rendered, before `localStorage` can be read
- **THEN** every card renders the not-started state, as it does today

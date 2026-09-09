## ADDED Requirements

### Requirement: A course card is clickable across its body

A course card presents itself as one object — a bordered panel with its own glow and a hover-lit title — so a pointer landing anywhere on its **body** SHALL navigate to the course overview, the destination its title already carries.

The card's body is everything except the actions pinned at its foot. Those actions SHALL keep their own hit areas and their own destinations, unreduced and unshifted: on an in-progress card the primary action still resumes the lesson and the secondary action still opens the course overview, and a pointer landing on either SHALL reach that action's destination rather than the body's.

The body's hit area SHALL be an extension of the title's existing link, not a new control. The card SHALL therefore expose no additional link to assistive technology and add no tab stop, and its title link's accessible name SHALL remain the course title rather than the whole panel's text.

#### Scenario: Clicking the card body opens the course overview
- **WHEN** the user clicks the card's description, its module preview list, its `+N more` line or its count pills
- **THEN** they navigate to the course overview for the active locale — the same destination as the card's title

#### Scenario: The actions keep their own destinations
- **WHEN** the user clicks the primary or the secondary action on an in-progress card
- **THEN** they reach that action's destination — the resumed lesson or the course overview — and the body's hit area does not intercept the click

#### Scenario: The body's hit area adds no control
- **WHEN** a screen reader or keyboard user traverses a course card
- **THEN** the same links are announced and reachable as before the hit area was extended, and the card itself is not announced as a link

#### Scenario: The title keeps its accessible name
- **WHEN** assistive technology reports the card's title link
- **THEN** its name is the course title alone, not the description, the module list, the counts or the actions

## MODIFIED Requirements

### Requirement: The course being continued is marked on its card

When a stored continue-watching location resolves to a lesson belonging to one of the catalog courses, that course's card SHALL be marked as in progress and its call to action SHALL invite the learner to continue rather than to start. Every other card SHALL read as not started.

The in-progress card's primary call to action SHALL navigate to **the resolved lesson itself** — the same destination as the `Continue watching` panel's action — not to the course overview. A card that says `Continue course` and lands two clicks short of the video contradicts the panel offering the real thing directly above it.

Because that primary action gives up the course overview, the in-progress card SHALL additionally render a **secondary action beneath it** that navigates to the course overview, so the whole course remains one click away. The two actions SHALL be visually distinguishable, the resume action reading as the primary one.

A not-started card SHALL keep exactly one call to action, to the course overview, and SHALL NOT render the secondary action.

Before the client has read the record, and whenever there is no record, every card SHALL render the not-started state — the honest one — rather than flashing a mark it cannot yet justify. The in-progress state SHALL therefore be asserted only once a lesson href is known, so no card ever offers a resume action with nowhere to resume to.

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

#### Scenario: The mark resolves after hydration
- **WHEN** the home is server-rendered
- **THEN** the markup contains the not-started state for every card, and the mark appears only after the client has read the record

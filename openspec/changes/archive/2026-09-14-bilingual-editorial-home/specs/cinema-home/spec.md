## ADDED Requirements

### Requirement: The new-visitor hero leads with one action

In the new-visitor state the locale home SHALL render an editorial hero with a localized
eyebrow addressing Spanish and Portuguese speakers, a display heading, an intro that
mentions notes in Spanish and English, and exactly one primary action. That action SHALL
navigate to the first lesson of the first module of the first catalog course in
`sequence` order, for the active locale, and SHALL be accompanied by a localized note of
where it leads.

The hero SHALL place the vowel-length card (`hear-the-difference` variant) beside the copy
on wide viewports and below the primary action on phone-class viewports.

#### Scenario: The primary action opens the first lesson
- **WHEN** the new-visitor home renders with a non-empty catalog
- **THEN** the hero's primary action links to the first lesson of the first course's first module for the active locale

#### Scenario: The hero offers one primary action
- **WHEN** the new-visitor hero renders
- **THEN** it contains exactly one primary action, and the vowel-length card's controls are the only other interactive elements in it

#### Scenario: The card stacks under the action on a phone
- **WHEN** the home renders at a 390px viewport width
- **THEN** the vowel-length card renders below the primary action and the page does not scroll horizontally

### Requirement: The home answers the questions learners ask first

In the new-visitor state the home SHALL render a localized section of three numbered
questions with their answers, covering why the course starts with sounds, how it fits into
a few minutes a day, and whether it works on a phone.

#### Scenario: Three questions render in order
- **WHEN** the new-visitor home renders
- **THEN** the questions section shows three numbered questions, each with its answer, in the active locale

### Requirement: The home lists every catalog course as a row of an ordered levels table

The home SHALL render an `Available courses` section whose heading states how many levels
there are, followed by one row per catalog course in ascending `Course.sequence` order. No
course SHALL be dropped.

Each row SHALL show the course's localized level ordinal (`Level {number}`), its title, its
description, its lesson and video counts, and one link to the course overview for the
active locale.

When the catalog is empty the section SHALL be replaced by a localized empty state.

#### Scenario: Every catalog course gets a row
- **WHEN** the catalog resolves two courses
- **THEN** the levels table renders two rows in ascending `sequence` order, each linking to its own course overview

#### Scenario: Ordering is data, not arrival order
- **WHEN** the repository returns courses in an order that does not match their `sequence`
- **THEN** the rows still render in ascending `sequence` order

#### Scenario: Empty catalog degrades gracefully
- **WHEN** the catalog returns no entries
- **THEN** the home shows a localized empty state instead of an empty table

#### Scenario: Levels copy is localized
- **WHEN** the locale is `es`
- **THEN** the section heading, the ordinals, the counts and the row links render from `es.json`

### Requirement: The new-visitor home closes by repeating its primary action

In the new-visitor state the home SHALL end its content with a band that restates the
offer in localized copy and repeats the hero's primary action to the same destination.

#### Scenario: The band repeats the hero's destination
- **WHEN** the new-visitor home renders
- **THEN** the closing band's action links to the same lesson as the hero's primary action

## REMOVED Requirements

### Requirement: Home renders the whole catalog as an ordered ladder of levels
**Reason**: The ladder of course cards is replaced by the editorial levels table and the
new-visitor hero chosen in the "Bilingual Editorial" design.
**Migration**: Ordering, completeness, counts, localization and the empty state are now
specified by "The home lists every catalog course as a row of an ordered levels table".
Module previews and `+N more` are no longer shown on the home.

### Requirement: A course card is clickable across its body
**Reason**: Course cards no longer render on the home; each levels-table row carries a
single explicit link.
**Migration**: None — the course overview is reached through the row's link.

### Requirement: The course being continued is marked on its card
**Reason**: The in-progress mark moves to the levels table row and the returning hero.
**Migration**: See `returning-learner-home` — "The levels table marks the course being
continued" and "The returning hero offers exactly one way back in".

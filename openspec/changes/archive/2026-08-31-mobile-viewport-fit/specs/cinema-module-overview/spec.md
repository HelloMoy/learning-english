## ADDED Requirements

### Requirement: Video row titles stay legible on narrow viewports

In the module overview's video list, a lesson title too long for the space available SHALL remain legible rather than being cut to a prefix. On narrow viewports the title SHALL wrap onto as many lines as it needs; the single-line treatment is reserved for rows wide enough to show a title that distinguishes it from its neighbours.

This exists because these lesson titles share long prefixes. In the largest module every
title begins `Exercise N Pronunciation Step By Step Lesson`; truncated to the width of a
phone they all read `Exercise 1 Pronunciati…`, `Exercise 2 Pronunciati…`, and the list
stops being a way to choose a lesson. Truncation is only safe where enough of the title
survives to tell one row from the next.

Wrapping a title SHALL NOT change the row's other contents or their order — the eyebrow,
the completion mark, and the "Open" action stay as they are; the row simply grows taller.

#### Scenario: A long title wraps rather than truncates on a phone
- **WHEN** the module overview renders at a 320px or 390px viewport width for a module whose lesson titles exceed one line
- **THEN** each title wraps across multiple lines and is readable in full, with no ellipsis

#### Scenario: Rows with shared prefixes stay distinguishable
- **WHEN** a module's lesson titles share a long common prefix and the list renders on a phone
- **THEN** the part of each title that differs from its neighbours is visible, so a learner can tell the rows apart

#### Scenario: The row keeps its structure when a title wraps
- **WHEN** a title wraps onto several lines
- **THEN** the row still shows its `Video N` eyebrow, its completion mark when the lesson is complete, and its "Open" action, and the "Open" action remains fully within the viewport

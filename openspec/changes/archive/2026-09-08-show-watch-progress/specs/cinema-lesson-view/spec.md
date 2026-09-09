## MODIFIED Requirements

### Requirement: The outline marks lessons the learner has already completed

In the "Course outline" sidebar, a lesson row whose lesson has been completed SHALL carry a completion indicator distinguishing it from lessons not yet taken. The indicator SHALL be perceivable without relying on colour alone and SHALL carry a localized accessible name, so the row's state reaches assistive technology and not only sighted users.

A lesson row whose lesson has been partly watched SHALL additionally carry the **watch
progress bar** specified by the `watch-progress` capability, rendered beneath the lesson
title within the row. A completed row SHALL show the bar full. Both indicators SHALL
apply the shared completion rule — marked through the button, or watched to the end — so
the outline can never disagree with the module overview about the same lesson.

The bar SHALL NOT become part of the row link's accessible name, and SHALL NOT add a tab
stop: the row keeps exactly one announced, focusable control, which on the largest module
is 214 rows' worth of tab stops that must not double. It is announced as its own
`progressbar`, so its reading is still available to assistive technology.

The indicators SHALL coexist with the existing current-lesson marker: the lesson being viewed SHALL keep its `aria-current` treatment whether or not it is also complete or partly watched.

Because completion and playback position are read in the browser after hydration (see the `lesson-progress` and `watch-progress` capabilities), the outline SHALL render no completion marks and no progress bars on the server, SHALL NOT render an explicit "not completed" marker at any time, and SHALL render no bar at all for a lesson with nothing watched.

#### Scenario: A completed lesson is distinguishable in the outline
- **WHEN** the outline renders a module containing a lesson the learner has completed
- **THEN** that lesson's row shows the completion indicator and a full progress bar, and lessons never opened show neither

#### Scenario: A partly watched lesson shows how far it got
- **WHEN** the outline renders a lesson with a stored position of 240 seconds against a 600-second duration
- **THEN** that row shows a progress bar filled to 40%, and no completion indicator

#### Scenario: The current lesson can also be complete
- **WHEN** the lesson currently being viewed has already been completed
- **THEN** the row carries both the current-lesson marker (`aria-current`) and the completion indicator, and neither replaces the other

#### Scenario: The bar does not rename or duplicate the row's control
- **WHEN** a row carrying a progress bar is reached by keyboard or by a screen reader
- **THEN** the row link's accessible name is the lesson title alone, the link remains the row's only tab stop, and the bar is announced separately as a progress bar

#### Scenario: The indicator is announced, not merely coloured
- **WHEN** a screen reader reaches a completed lesson's row
- **THEN** the completed state is announced through a localized accessible name, and the distinction does not depend on colour alone

#### Scenario: A lesson with no runtime carries no bar
- **WHEN** the outline renders a reading lesson
- **THEN** that row shows no progress bar, and its completion still reflects the manual button

#### Scenario: Marking the current lesson updates the outline without a reload
- **WHEN** the learner activates "Mark as complete" for the lesson they are viewing
- **THEN** that lesson's row in the outline shows the completion indicator without requiring a page reload

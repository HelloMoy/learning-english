## ADDED Requirements

### Requirement: The outline marks lessons the learner has already completed

In the "Course outline" sidebar, a lesson row whose lesson has been completed SHALL carry a completion indicator distinguishing it from lessons not yet taken. The indicator SHALL be perceivable without relying on colour alone and SHALL carry a localized accessible name, so the row's state reaches assistive technology and not only sighted users.

The indicator SHALL coexist with the existing current-lesson marker: the lesson being viewed SHALL keep its `aria-current` treatment whether or not it is also complete.

Because completion is read in the browser after hydration (see the `lesson-progress` capability), the outline SHALL render no completion marks on the server and SHALL NOT render an explicit "not completed" marker at any time.

#### Scenario: A completed lesson is distinguishable in the outline
- **WHEN** the outline renders a module containing a lesson the learner has completed
- **THEN** that lesson's row shows the completion indicator, and lessons not completed show none

#### Scenario: The current lesson can also be complete
- **WHEN** the lesson currently being viewed has already been completed
- **THEN** the row carries both the current-lesson marker (`aria-current`) and the completion indicator, and neither replaces the other

#### Scenario: The indicator is announced, not merely coloured
- **WHEN** a screen reader reaches a completed lesson's row
- **THEN** the completed state is announced through a localized accessible name, and the distinction does not depend on colour alone

#### Scenario: Marking the current lesson updates the outline without a reload
- **WHEN** the learner activates "Mark as complete" for the lesson they are viewing
- **THEN** that lesson's row in the outline shows the completion indicator without requiring a page reload

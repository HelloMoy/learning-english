# Capability: cinema-lesson-view

## Purpose

Define the Immersion Cinema presentation of the Lesson Page. The lesson view adopts a three-column cinema layout: a left "Course outline" sidebar, a center column with a video hero (gold title overlay over the native player) followed by the lesson title, description, a Notes/Transcript tab pair, and a "Mark as complete" action, and a right rail with "Resources", "Lesson notes (source)", and an "Up next" card. Notes render as a bilingual ES/EN split; the Transcript tab is present for visual parity but disabled. Existing `NativeVideoPlayer`, breadcrumb, resource list, up-next, and mark-complete behaviors are preserved.

## Requirements

### Requirement: Lesson view renders as a cinema player with tabbed notes

The Lesson Page SHALL present a three-column cinema layout: a left "Course outline" sidebar, a center column with a video hero (gold title overlay over the player, native controls/scrubber retained) followed by the lesson title, description, a Notes/Transcript tab pair, and a "Mark as complete" action; and a right rail with "Resources", "Lesson notes (source)", and an "Up next" card. All regions SHALL be landmarks or labelled, keyboard-reachable with visible focus, and localized. The existing `NativeVideoPlayer`, breadcrumb, resource list, up-next, and mark-complete behaviors SHALL be preserved.

In the outline, each module title SHALL be a disclosure control that expands and collapses that module's lesson list in place. The control SHALL NOT navigate. Any number of modules MAY be open at the same time; expanding one module SHALL NOT collapse another. The module containing the current lesson SHALL start expanded. Each control SHALL expose its state via `aria-expanded` and SHALL be operable by keyboard with a visible focus ring.

#### Scenario: Video hero preserves the native player
- **WHEN** a video lesson renders
- **THEN** the gold title overlays the player, native playback controls remain operable, and Mark-as-complete stays reachable by keyboard with a visible focus ring

#### Scenario: Outline marks the current lesson
- **WHEN** the outline renders for the current lesson
- **THEN** the module containing the current lesson is expanded with `aria-expanded="true"`, the current lesson is marked current (`aria-current`), and every other module is collapsed with `aria-expanded="false"` so the learner is not shown all 107 lessons at once

#### Scenario: Expanding an inactive module reveals its lessons without leaving the page
- **WHEN** the learner activates the title of a module that is collapsed
- **THEN** that module's lessons appear in the outline, the control reports `aria-expanded="true"`, and no navigation occurs — the learner stays on the current lesson

#### Scenario: Module titles are not links
- **WHEN** the outline renders a module title
- **THEN** the title is a button, not a link, and activating it never routes to the module overview page

#### Scenario: Several modules can be open at once
- **WHEN** the learner expands a second module while another module is already expanded
- **THEN** both modules show their lessons; expanding one does not collapse the other

#### Scenario: Expanding is reversible
- **WHEN** the learner activates the title of a module that is currently expanded
- **THEN** that module's lessons are hidden and the control reports `aria-expanded="false"`

#### Scenario: The disclosure is keyboard operable
- **WHEN** the learner moves focus to a module title with the keyboard and presses `Enter` or `Space`
- **THEN** the module toggles between expanded and collapsed, and the focused control shows a visible focus ring

### Requirement: Notes tab shows a bilingual split; Transcript is present but disabled

The center column SHALL render a Notes tab and a Transcript tab. The Notes tab SHALL split the lesson's bilingual `readme.md` into two labelled columns ("Español" and "English") using a pure presentational splitter, falling back to a single column when the content cannot be split cleanly. Notes SHALL render through the existing safe Markdown component (no raw HTML). The Transcript tab SHALL be present for visual parity but disabled (`aria-disabled`), showing a localized "not available" state, since no transcript data exists.

#### Scenario: Notes split into ES/EN columns
- **WHEN** a lesson's notes contain a Spanish block followed by an English block
- **THEN** the Notes tab shows two labelled columns with the Spanish text under "Español" and the English text under "English"

#### Scenario: Ambiguous notes fall back to one column
- **WHEN** the notes cannot be split into two language blocks
- **THEN** the Notes tab renders the markdown in a single column without error

#### Scenario: Transcript tab is disabled
- **WHEN** the user reaches the Transcript tab
- **THEN** it is marked disabled, cannot be activated to reveal transcript content, and shows a localized "transcript not available" message

#### Scenario: Notes render safely
- **WHEN** notes markdown contains embedded HTML
- **THEN** no raw HTML/script is injected into the document

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

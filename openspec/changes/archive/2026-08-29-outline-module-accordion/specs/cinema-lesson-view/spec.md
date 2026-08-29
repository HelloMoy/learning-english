## MODIFIED Requirements

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

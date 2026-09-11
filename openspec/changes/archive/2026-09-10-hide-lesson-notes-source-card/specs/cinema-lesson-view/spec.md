## MODIFIED Requirements

### Requirement: Lesson view renders as a cinema player with tabbed notes

The Lesson Page SHALL present a three-column cinema layout: a left "Course outline" sidebar, a center column with a video hero (the Vidstack player specified by the `lesson-page` capability, controls/scrubber retained, with a gold title cover over the idle player) followed by the lesson title, description, a Notes/Transcript tab pair, and a "Mark as complete" action; and a right rail with a "Resources" card and an "Up next" card. All regions SHALL be landmarks or labelled, keyboard-reachable with visible focus, and localized. The existing breadcrumb, resource list, up-next, and mark-complete behaviors SHALL be preserved.

The right rail SHALL NOT render a "Lesson notes (source)" card. The lesson's notes are read in the Notes tab of the center column, rendered as Markdown in the learner's active locale; a rail card linking to the raw `readme.md` would send the learner to unstyled source of content the page already shows, so no such card SHALL exist. The notes `Resource` SHALL also stay out of the "Resources" card, so removing the dedicated card does not surface the same link under a different heading.

The gold title cover (the lesson eyebrow, the module headline, and its gradient scrim) SHALL render only while BOTH conditions hold: **the player shows no thumbnail of its own**, AND playback has not started in the current session. The cover exists to keep an idle black frame from being blank; wherever a thumbnail already fills that frame, the thumbnail is the cover and the gold cover SHALL NOT render at all.

A player shows a thumbnail of its own when EITHER of these holds:

- the lesson has a `poster`; or
- the lesson's `source` is a YouTube link, because the YouTube provider specified by the `lesson-page` capability discovers and paints its own thumbnail even when the lesson carries no `poster` field.

The condition SHALL therefore NOT be expressed as "the lesson has no `poster`" alone, which would paint the gold cover over YouTube's thumbnail.

From the player's first `play` event onward the cover SHALL NOT render, whether the video is playing or paused, and SHALL NOT reappear on `pause`, `seeking`, or `ended`. The cover SHALL remain non-interactive (`pointer-events-none`) so the player's controls stay operable beneath it, and it SHALL NOT sit above the in-player resume overlay: when both would be visible at once, the overlay SHALL be the surface the learner sees and can act on. The lesson title SHALL remain available in the breadcrumb and in the heading below the player, and the module title in the breadcrumb and the outline sidebar, so hiding the cover loses no information.

In the outline, each module title SHALL be a disclosure control that expands and collapses that module's lesson list in place. The control SHALL NOT navigate. Any number of modules MAY be open at the same time; expanding one module SHALL NOT collapse another. The module containing the current lesson SHALL start expanded. Each control SHALL expose its state via `aria-expanded` and SHALL be operable by keyboard with a visible focus ring.

#### Scenario: The right rail has no notes card
- **WHEN** a lesson whose notes `Resource` is present renders
- **THEN** the right rail contains exactly the "Resources" card and the "Up next" card — there is no "Lesson notes (source)" card and no link to the raw `readme.md` anywhere in the rail

#### Scenario: The Notes tab still renders the notes
- **WHEN** the same lesson renders
- **THEN** the Notes tab in the center column shows the notes body in the active locale, unchanged by the rail card's absence

#### Scenario: Video hero preserves the player controls
- **WHEN** a video lesson renders
- **THEN** the player's controls remain operable and Mark-as-complete stays reachable by keyboard with a visible focus ring

#### Scenario: A poster-less lesson shows the title cover before playback
- **WHEN** a self-hosted video lesson with no `poster` renders and playback has not started
- **THEN** the gold cover is painted over the idle player, showing the lesson eyebrow and the module title as a heading, and the player's controls remain operable beneath it

#### Scenario: A lesson with a poster never shows the title cover
- **WHEN** a video lesson with a `poster` renders and playback has not started
- **THEN** no title cover is painted — the module title is not rendered as a heading over the player — and the poster thumbnail is the only cover

#### Scenario: A YouTube lesson without a `poster` never shows the title cover
- **WHEN** a video lesson whose `source` is a YouTube link and which carries no `poster` renders and playback has not started
- **THEN** no title cover is painted — the module title is not rendered as a heading over the player — and the provider's own thumbnail is the only cover

#### Scenario: Starting playback retires the cover for the session
- **WHEN** the learner starts playback of a poster-less lesson and then pauses, seeks, or lets the video end
- **THEN** the title cover is gone from the first `play` onward and does not reappear in any of those states, leaving the video frame unobstructed

#### Scenario: The resume overlay is not obscured by the title cover
- **WHEN** the learner presses play on a poster-less lesson that has a resumable stored position
- **THEN** the resume overlay is the surface presented over the video frame, and the title cover does not cover or intercept it

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

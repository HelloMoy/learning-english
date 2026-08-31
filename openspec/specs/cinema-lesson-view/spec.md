# Capability: cinema-lesson-view

## Purpose

Define the Immersion Cinema presentation of the Lesson Page. The lesson view adopts a three-column cinema layout: a left "Course outline" sidebar, a center column with a video hero (the native player, with a gold title cover shown only over an idle, poster-less lesson) followed by the lesson title, description, a Notes/Transcript tab pair, and a "Mark as complete" action, and a right rail with "Resources", "Lesson notes (source)", and an "Up next" card. Notes render as a bilingual ES/EN split; the Transcript tab is present for visual parity but disabled. Existing `NativeVideoPlayer`, breadcrumb, resource list, up-next, and mark-complete behaviors are preserved.

## Requirements

### Requirement: Lesson view renders as a cinema player with tabbed notes

The Lesson Page SHALL present a three-column cinema layout: a left "Course outline" sidebar, a center column with a video hero (the native player, controls/scrubber retained, with a gold title cover over the idle player) followed by the lesson title, description, a Notes/Transcript tab pair, and a "Mark as complete" action; and a right rail with "Resources", "Lesson notes (source)", and an "Up next" card. All regions SHALL be landmarks or labelled, keyboard-reachable with visible focus, and localized. The existing `NativeVideoPlayer`, breadcrumb, resource list, up-next, and mark-complete behaviors SHALL be preserved.

The gold title cover (the lesson eyebrow, the module headline, and its gradient scrim) SHALL render only while BOTH conditions hold: the lesson has no `poster`, AND playback has not started in the current session. When the lesson has a `poster`, the cover SHALL NOT render at all — the thumbnail is the cover. From the player's first `play` event onward the cover SHALL NOT render, whether the video is playing or paused, and SHALL NOT reappear on `pause`, `seeking`, or `ended`. The cover SHALL remain non-interactive (`pointer-events-none`) so the native controls stay operable beneath it. The lesson title SHALL remain available in the breadcrumb and in the heading below the player, and the module title in the breadcrumb and the outline sidebar, so hiding the cover loses no information.

In the outline, each module title SHALL be a disclosure control that expands and collapses that module's lesson list in place. The control SHALL NOT navigate. Any number of modules MAY be open at the same time; expanding one module SHALL NOT collapse another. The module containing the current lesson SHALL start expanded. Each control SHALL expose its state via `aria-expanded` and SHALL be operable by keyboard with a visible focus ring.

#### Scenario: Video hero preserves the native player
- **WHEN** a video lesson renders
- **THEN** native playback controls remain operable and Mark-as-complete stays reachable by keyboard with a visible focus ring

#### Scenario: A poster-less lesson shows the title cover before playback
- **WHEN** a video lesson with no `poster` renders and playback has not started
- **THEN** the gold cover is painted over the idle player, showing the lesson eyebrow and the module title as a heading, and the native controls remain operable beneath it

#### Scenario: A lesson with a poster never shows the title cover
- **WHEN** a video lesson with a `poster` renders and playback has not started
- **THEN** no title cover is painted — the module title is not rendered as a heading over the player — and the poster thumbnail is the only cover

#### Scenario: Starting playback retires the cover for the session
- **WHEN** the learner starts playback of a poster-less lesson and then pauses, seeks, or lets the video end
- **THEN** the title cover is gone from the first `play` onward and does not reappear in any of those states, leaving the video frame unobstructed

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

### Requirement: The outline keeps the current lesson visible on arrival

The "Course outline" sidebar SHALL be a self-contained scroll region on desktop: it
SHALL stick below the site header, its height SHALL be bounded by the viewport, and its
content SHALL scroll inside it rather than extending the page. On arrival at a lesson,
the outline SHALL position its own scroll offset so the row marked `aria-current="page"`
is visible within that region, placed near the middle of the region when there is enough
content above and below it to allow it. Positioning the outline SHALL NOT change the
document's scroll position — the learner still arrives at the top of the lesson, looking
at the player.

The same positioning SHALL be applied in the mobile drawer at the moment the learner
opens it, so the drawer never opens onto the first module of a long course.

The adjustment SHALL be instant — the outline SHALL be at its offset by the time the
learner sees it, with no animated scroll. This holds for every learner and therefore
satisfies `prefers-reduced-motion: reduce` by construction.

Bounding the region SHALL NOT cost the outline its own label: the "Course outline"
heading SHALL remain visible while the region is scrolled, so the sidebar still
identifies itself once the current lesson is in view. Where the shell already names the
region — the mobile drawer's `<summary>` — the outline SHALL NOT add a second visible
heading saying the same thing; the region's accessible name SHALL be unaffected either
way. The title of the module being scrolled SHALL likewise stay visible, pinned
directly below the outline heading, so the learner reading a list of exercises never
loses track of which module they belong to.

When no row is marked current — the outline renders without a current lesson, or the
learner has collapsed the module that holds it — the outline SHALL leave its scroll
offset untouched and SHALL continue to render normally.

#### Scenario: A lesson in a late module opens with the outline showing where the learner is
- **WHEN** the learner opens a lesson belonging to one of the course's last modules, on a viewport shorter than the full outline
- **THEN** the outline's own scroll offset is set so the current lesson row is inside the visible part of the sidebar, without the learner scrolling anything

#### Scenario: The outline scrolls on its own, not with the page
- **WHEN** the outline is taller than the space available beside the lesson
- **THEN** the sidebar is a bounded, scrollable region that stays in view as the page scrolls, and its overflow scrolls inside it instead of lengthening the page

#### Scenario: Positioning the outline leaves the page where it was
- **WHEN** the outline positions the current lesson on arrival
- **THEN** the document's scroll position is unchanged — the player and the lesson title remain in view

#### Scenario: The current lesson is centred when there is room
- **WHEN** the current lesson has enough lessons above and below it inside the outline to fill the region
- **THEN** the current lesson row sits near the middle of the outline's visible area, so neighbouring lessons give context in both directions

#### Scenario: The adjustment is never animated
- **WHEN** the outline positions the current lesson, with or without `prefers-reduced-motion: reduce` set
- **THEN** the outline is already at its offset when first painted — no animated scroll runs, so no motion preference can be violated

#### Scenario: The outline still names itself once scrolled
- **WHEN** the outline has scrolled to bring the current lesson into view
- **THEN** the "Course outline" heading is still visible at the top of the region rather than scrolled out of it

#### Scenario: The module being scrolled keeps its title in view
- **WHEN** the learner scrolls through the lessons of an expanded module
- **THEN** that module's title stays pinned below the outline heading until the next module's title replaces it, and lesson rows pass behind it rather than through it

#### Scenario: The drawer does not name itself twice
- **WHEN** the outline renders inside a shell that already labels the region, such as the mobile drawer's `<summary>`
- **THEN** only one visible "Course outline" label appears, and the region keeps its accessible name

#### Scenario: The mobile drawer opens onto the current lesson
- **WHEN** the learner opens the collapsed outline drawer on a small viewport
- **THEN** the drawer's outline positions the current lesson into view the same way the desktop sidebar does

#### Scenario: No current lesson leaves the outline alone
- **WHEN** the outline renders with no row marked `aria-current="page"`
- **THEN** no scroll adjustment is made, the outline renders at its natural offset, and nothing fails

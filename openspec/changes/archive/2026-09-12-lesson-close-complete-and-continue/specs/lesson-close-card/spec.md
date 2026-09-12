## ADDED Requirements

### Requirement: The Lesson Page closes with one "complete and continue" block on phone-class viewports

On phone-class viewports — below the `lg` breakpoint — the Lesson Page SHALL end its
center column with a single closing block containing, in this order:

1. a localized prompt inviting the learner to close the lesson and move on;
2. the **Mark as complete** button, rendered at the block's full width;
3. a separator;
4. the **next-lesson row** — a locale-aware link to the next Lesson carrying a play
   glyph, the localized "Up next" eyebrow, and the next Lesson's title.

The block SHALL be the last thing in the center column, so the learner reaches it
immediately after the lesson's own content rather than after the stacked rail.

The block SHALL carry the same surface vocabulary as the page's other cards — the card
background, the border token, and the card corner radius — and the next-lesson row SHALL
be visually separated from the button by a divider, so the two actions read as one
closing surface with two steps rather than as two unrelated controls.

The **Mark as complete** behaviour SHALL be unchanged: the same button, the same dual
write, the same completed and pending states.

#### Scenario: The closing block renders at phone width
- **WHEN** a video lesson with a next lesson is rendered at a 390px viewport width
- **THEN** the center column ends with one block containing the prompt, the "Mark as complete" button, a divider, and a link to the next lesson — in that order

#### Scenario: Marking complete from inside the block still records the lesson
- **WHEN** the learner activates the "Mark as complete" button inside the closing block
- **THEN** the lesson is recorded exactly as it is today and the button moves to its completed state, with the next-lesson row unaffected

### Requirement: The next-lesson row is a control-sized target that names its destination

The next-lesson row SHALL be a single locale-aware link whose activatable area is at
least 44px tall, so it can be tapped on a phone without precision. The whole row —
glyph, eyebrow, title and chevron — SHALL belong to that one link; the row SHALL NOT
render a second, competing link to the same lesson.

The link's accessible name SHALL name the destination lesson, so a learner using a
screen reader hears which lesson comes next rather than "link, chevron".

The row SHALL link to the next Lesson's own module route — the next Lesson MAY belong to
a different Module than the current one — built with the shared lesson route builder
rather than a concatenated string, and routed through the locale-aware `Link` so the
active locale segment is preserved.

The title SHALL remain readable when it is long: it wraps rather than being clipped, and
the row grows to fit it.

#### Scenario: The row links to the next lesson's own module
- **WHEN** the next lesson belongs to a different module than the current lesson
- **THEN** the row's `href` addresses the next lesson under *that* module's slug, prefixed with the active locale

#### Scenario: The row is one link with an accessible name
- **WHEN** the closing block renders with a next lesson
- **THEN** the row is a single link whose accessible name contains the next lesson's title

#### Scenario: A long title wraps instead of being clipped
- **WHEN** the next lesson's title is longer than the row's width
- **THEN** the title wraps onto further lines and no part of it is truncated out of reach

### Requirement: The closing block shows the terminal state on the last lesson

When the view resolves with no next Lesson, the closing block SHALL render the same
localized "you've reached the end of the course" message the "Up next" card renders
today, in place of the next-lesson row, and SHALL NOT render a link.

#### Scenario: The last lesson shows the end-of-course message
- **WHEN** a lesson whose resolved view has `nextLesson: null` is rendered at phone width
- **THEN** the closing block shows the localized end-of-course message and contains no next-lesson link

### Requirement: The closing block's next-lesson affordance is phone-only

From the `lg` breakpoint up, the closing block SHALL NOT show its prompt, its divider or
its next-lesson row, and the right rail's "Up next" card SHALL be shown as it is today.
Below `lg`, that rail card SHALL NOT be shown.

At no viewport width SHALL the page offer the next lesson twice: exactly one of the two
affordances is visible at any width.

#### Scenario: Only the rail card is visible on a desktop viewport
- **WHEN** a lesson is rendered at a 1280px viewport width
- **THEN** the right rail's "Up next" card is visible, the closing block's next-lesson row is not, and the "Mark as complete" button keeps its intrinsic width

#### Scenario: Only the closing block is visible on a phone viewport
- **WHEN** the same lesson is rendered at a 390px viewport width
- **THEN** the closing block's next-lesson row is visible, the rail's "Up next" card is not, and exactly one link to the next lesson is visible on the page

### Requirement: The closing block's copy is localized in every supported locale

Every string the closing block renders — the prompt and the "Up next" eyebrow — SHALL be
resolved through `next-intl` from the `Components.*` namespaces and SHALL be present in
every locale message file (`en`, `es`, `pt`). No string SHALL be hardcoded in the
component.

#### Scenario: The prompt is translated in every locale
- **WHEN** the Lesson Page is rendered in `en`, `es` and `pt`
- **THEN** the closing block's prompt and eyebrow render in that locale, and no message key is rendered raw

### Requirement: The Resources card precedes the closing block on phone-class viewports

Below the `lg` breakpoint the page SHALL render the lesson's **Resources** card above the
closing block, so the learner meets the lesson's materials before the action that ends
the lesson. The closing block SHALL remain the last thing on the page.

The stacked rail SHALL NOT then render a second Resources card: exactly one is visible
at any viewport width, as for the "Up next" card. From `lg` up the rail carries it, as
it does today.

#### Scenario: Materials come before the closing block on a phone
- **WHEN** a lesson with resources is rendered at a 390px viewport width
- **THEN** the visible Resources card appears above the closing block, and the closing block is the last thing on the page

#### Scenario: The Resources card is shown once
- **WHEN** the same lesson is rendered at 390px and at 1280px
- **THEN** exactly one Resources card is visible at each width — in the stack above the closing block on the phone, and in the right rail on the desktop

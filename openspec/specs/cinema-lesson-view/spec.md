# Capability: cinema-lesson-view

## Purpose

Define the Immersion Cinema presentation of the Lesson Page. The lesson view adopts a three-column cinema layout: a left "Course outline" sidebar, a center column with a video hero (the native player, with a gold title cover shown only over an idle, poster-less lesson) followed by the lesson title, description, a Notes/Transcript tab pair, and a "Mark as complete" action, and a right rail with a "Resources" card and an "Up next" card. Notes render in the app's active locale — one language at a time, never a side-by-side pair; the Transcript tab is present for visual parity but disabled. Existing `NativeVideoPlayer`, breadcrumb, resource list, up-next, and mark-complete behaviors are preserved.
## Requirements
### Requirement: Lesson view renders as a cinema player with tabbed notes

The Lesson Page SHALL present a three-column cinema layout: a left "Course outline" sidebar, a center column with a video hero (the Vidstack player specified by the `lesson-page` capability, controls/scrubber retained, with a gold title cover over the idle player) followed by the lesson title, description, a Notes/Transcript tab pair, and a "Mark as complete" action; and a right rail with a "Resources" card and an "Up next" card. All regions SHALL be landmarks or labelled, keyboard-reachable with visible focus, and localized. The existing breadcrumb, resource list, up-next, and mark-complete behaviors SHALL be preserved.

The three-column layout is the presentation from the `lg` breakpoint up. Below `lg` the columns stack, and there the right rail SHALL carry the "Resources" card alone: the "Up next" card SHALL NOT be rendered in the stacked rail, because the center column already ends with the closing block specified by the `lesson-close-card` capability, which pairs "Mark as complete" with the next lesson. The next lesson SHALL therefore be offered exactly once at every viewport width.

The right rail SHALL NOT render a "Lesson notes (source)" card. The lesson's notes are read in the Notes tab of the center column, rendered as Markdown in the learner's active locale; a rail card linking to the raw `readme.md` would send the learner to unstyled source of content the page already shows, so no such card SHALL exist. The notes `Resource` SHALL also stay out of the "Resources" card, so removing the dedicated card does not surface the same link under a different heading.

The gold title cover (the lesson eyebrow, the module headline, and its gradient scrim) SHALL render only while BOTH conditions hold: **the player shows no thumbnail of its own**, AND playback has not started in the current session. The cover exists to keep an idle black frame from being blank; wherever a thumbnail already fills that frame, the thumbnail is the cover and the gold cover SHALL NOT render at all.

A player shows a thumbnail of its own when EITHER of these holds:

- the lesson has a `poster`; or
- the lesson's `source` is a YouTube link, because the YouTube provider specified by the `lesson-page` capability discovers and paints its own thumbnail even when the lesson carries no `poster` field.

The condition SHALL therefore NOT be expressed as "the lesson has no `poster`" alone, which would paint the gold cover over YouTube's thumbnail.

From the player's first `play` event onward the cover SHALL NOT render, whether the video is playing or paused, and SHALL NOT reappear on `pause`, `seeking`, or `ended`. The cover SHALL remain non-interactive (`pointer-events-none`) so the player's controls stay operable beneath it, and it SHALL NOT sit above the in-player resume overlay: when both would be visible at once, the overlay SHALL be the surface the learner sees and can act on. The lesson title SHALL remain available in the breadcrumb and in the heading below the player, and the module title in the breadcrumb and the outline sidebar, so hiding the cover loses no information.

In the outline, each module title SHALL be a disclosure control that expands and collapses that module's lesson list in place. The control SHALL NOT navigate. Any number of modules MAY be open at the same time; expanding one module SHALL NOT collapse another. The module containing the current lesson SHALL start expanded. Each control SHALL expose its state via `aria-expanded` and SHALL be operable by keyboard with a visible focus ring.

#### Scenario: The right rail has no notes card
- **WHEN** a lesson whose notes `Resource` is present renders at a viewport of `lg` or wider
- **THEN** the right rail contains exactly the "Resources" card and the "Up next" card — there is no "Lesson notes (source)" card and no link to the raw `readme.md` anywhere in the rail

#### Scenario: The stacked rail carries Resources alone on a phone
- **WHEN** the same lesson renders at a 390px viewport width
- **THEN** the stacked rail shows the "Resources" card and no "Up next" card, and the next lesson is offered once, by the closing block at the end of the center column

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

### Requirement: Notes tab shows the active locale's notes; Transcript is present but disabled

The center column SHALL render a Notes tab and a Transcript tab. The Notes tab SHALL render the lesson's notes in **exactly one language — the app's active locale** — as a single full-width column, using a pure presentational selector over the lesson's `readme.md`. It SHALL NOT render two languages at the same time. Notes SHALL render through the existing safe Markdown component (no raw HTML). The Transcript tab SHALL be present for visual parity but disabled (`aria-disabled`), showing a localized "not available" state, since no transcript data exists.

The active locale SHALL be the one `next-intl` reports for the current request — the same locale the header's language control sets — so switching the app's language switches the notes with it. The Notes tab SHALL NOT offer a language control of its own.

The selector SHALL identify each language by an explicit **level-2 language section heading** — a `##` heading (not `###` or deeper) whose text names the language, in any of the three locales' own words and with or without a flag emoji (for example `## Español`, `## 🇪🇸 Español`, `## Spanish`, `## English`, `## 🇺🇸 English`, `## Inglés`, `## Português`, `## 🇧🇷 Português`, `## Portuguese`). A language section SHALL run from its heading until the next level-2 heading or the end of the document. Content before the first level-2 heading — the lesson's `#` title — SHALL be discarded, and a level-2 section whose heading names no recognized language SHALL be ignored. The selector SHALL NOT infer languages by counting blank-line-separated blocks, so a lesson MAY nest `###` and `####` sub-headings, lists, blockquotes and examples inside a language section without losing its content.

When the notes carry no section for the active locale, the selector SHALL resolve in this order and render the first section it finds: **active locale → English → Spanish**. When the notes carry no recognized language section at all, the Notes tab SHALL render the original Markdown unchanged. Notes therefore never render empty and never render broken.

The language heading itself SHALL be dropped from the rendered body. Everything else inside the section SHALL be preserved verbatim and rendered as Markdown. The Notes tab SHALL NOT render a language label above the body — the panel is already in the language the learner selected, so a label would state what the app's own language control states.

#### Scenario: Spanish notes render for a Spanish learner
- **WHEN** a lesson whose notes carry `## 🇪🇸 Español`, `## 🇺🇸 English` and `## 🇧🇷 Português` sections is opened under the `es` locale
- **THEN** the Notes tab shows the Spanish section's body alone, occupying the full width, with no English or Portuguese text and no "ESPAÑOL" / "ENGLISH" column labels

#### Scenario: English notes render for an English learner
- **WHEN** the same lesson is opened under the `en` locale
- **THEN** the Notes tab shows the English section's body alone, and neither the Spanish nor the Portuguese body appears in the panel

#### Scenario: Portuguese notes render for a Portuguese learner
- **WHEN** the same lesson is opened under the `pt` locale
- **THEN** the Notes tab shows the Portuguese section's body alone, and neither the Spanish nor the English body appears in the panel

#### Scenario: Switching the app's language switches the notes
- **WHEN** the learner changes the app's language from Spanish to Portuguese while on a lesson page
- **THEN** the Notes tab body is the Portuguese section, without the learner touching any control inside the panel

#### Scenario: A missing locale section falls back to English
- **WHEN** a lesson's notes carry only `## Español` and `## English` sections and the lesson is opened under the `pt` locale
- **THEN** the Notes tab shows the English section's body alone, rather than an empty panel or two columns

#### Scenario: A missing locale and missing English fall back to Spanish
- **WHEN** a lesson's notes carry only a `## Español` section and the lesson is opened under the `pt` locale
- **THEN** the Notes tab shows the Spanish section's body

#### Scenario: The language heading is never shown
- **WHEN** any language section is rendered
- **THEN** its `##` language heading is not present in the panel, and the section's own `###` sub-headings are the first headings the learner sees

#### Scenario: Nested sub-sections survive the selection
- **WHEN** the selected language section contains `###` sub-headings, `####` sub-headings and bullet lists beneath its `##` language heading
- **THEN** the panel renders every nested sub-heading and list item

#### Scenario: The language sections may appear in any order
- **WHEN** a lesson's notes place the `## English` section before the `## Español` section
- **THEN** the locale still selects its own section, unaffected by the order the sections appear in the file

#### Scenario: Ambiguous notes fall back to the whole body
- **WHEN** the notes contain no level-2 language section heading
- **THEN** the Notes tab renders the markdown as-is in a single column without error

#### Scenario: Transcript tab is disabled
- **WHEN** the user reaches the Transcript tab
- **THEN** it is marked disabled, cannot be activated to reveal transcript content, and shows a localized "transcript not available" message

#### Scenario: Notes render safely
- **WHEN** notes markdown contains embedded HTML
- **THEN** no raw HTML/script is injected into the document

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

### Requirement: Lesson notes Markdown renders with a theme-owned typographic hierarchy

The Markdown renderer used by the Lesson Page's Notes tab SHALL apply its own element
styling, declared alongside the renderer, so that a notes body's structure is visible without
depending on any Tailwind plugin the build does not generate.

The renderer SHALL give distinct, visible treatment to at least: level-1 through level-4
headings, paragraphs, unordered and ordered lists and their items, blockquotes, strong and
emphasized text, inline code, and horizontal rules. Headings SHALL descend in visual weight
so a `###` sub-heading reads as subordinate to the section around it, and block elements
SHALL carry vertical rhythm so consecutive paragraphs and list items do not run together.

Styling SHALL be expressed with the project's Immersion Cinema theme tokens (`foreground`,
`muted-foreground`, `gold`, `border`) rather than a generic prose palette, and SHALL be
readable in the app's dark surface without a separate inverted variant.

`LessonNotesTabs` SHALL NOT carry typography class names of its own for the notes body. The
Notes tab's only styling responsibility is the column layout and the "Español" / "English"
column labels; how a heading or a list looks belongs to the renderer.

The renderer SHALL continue to reject raw HTML embedded in a notes body.

#### Scenario: A notes heading is visually distinct from body text

- **WHEN** a notes body contains a `###` sub-heading followed by a paragraph
- **THEN** the rendered heading element carries styling that sets it apart from the paragraph — it is not left at the browser's default rendering

#### Scenario: Lists and blockquotes render as structured blocks

- **WHEN** a notes body contains a bullet list and a blockquote
- **THEN** the list renders with visible markers and indentation and the blockquote renders with its own visual treatment, both distinguishable from surrounding paragraphs

#### Scenario: The Notes tab delegates typography to the renderer

- **WHEN** the Notes tab renders a lesson's notes
- **THEN** the container it puts the Markdown in carries no typography class names; the styling comes from the Markdown renderer itself

#### Scenario: Styled Markdown still blocks raw HTML

- **WHEN** a notes body contains embedded HTML such as a `<script>` or an `<img onerror=…>`
- **THEN** no raw HTML element is injected into the document

### Requirement: The course outline is a compact row on small viewports

Below the `lg` breakpoint the "Course outline" SHALL be presented as a single-row card above
the breadcrumb, collapsed on arrival, holding: a square tile bearing a list icon, the
localized "Course outline" title, a subtitle stating the current lesson's module and its
position within that module, and a chevron indicating the collapsed or expanded state. A thin
meter SHALL run along the card's bottom edge, filled to the learner's completed share of the
course.

The entire row SHALL be **one control**. The tile, the text, and the chevron SHALL NOT be
separately focusable, so a tap anywhere along the card's width expands the outline. The
chevron SHALL be decorative: the control's state SHALL be conveyed by `aria-expanded`, never
by the icon's direction alone.

The position reading SHALL be the current lesson's ordinal within its own module and that
module's lesson count — `Module · Lesson N of M`, where `M` counts the lessons of the module
named beside it, both derived from `sequence` order. Where the current lesson is not among
the course's lessons, the row SHALL state the title alone rather than an invented position.

At or above the `lg` breakpoint this row SHALL NOT render, and the sticky sidebar SHALL be
unaffected by everything in this requirement.

#### Scenario: The row names the region and states the position

- **WHEN** the learner opens the 13th of the 27 lessons in the module "Consonants" on a phone
- **THEN** the row shows the "Course outline" title and the subtitle `Consonants · Lesson 13 of 27`, in the active locale

#### Scenario: The row is a single tap target

- **WHEN** the row renders
- **THEN** exactly one focusable control exists in the card, and activating it anywhere along the row expands the outline

#### Scenario: The chevron reflects state without carrying it

- **WHEN** the row is expanded
- **THEN** the control reports `aria-expanded="true"` and the chevron is hidden from assistive technology

#### Scenario: A lesson with no derivable position still names the region

- **WHEN** the current lesson is not among the course's lessons
- **THEN** the row renders the "Course outline" title with no subtitle, and nothing fails

#### Scenario: The row is absent on desktop

- **WHEN** the lesson page renders at or above the `lg` breakpoint
- **THEN** no compact row is rendered at any position on the page, and the sticky sidebar renders as specified elsewhere in this capability

### Requirement: The mobile row reports course completion only once it can be known

The compact row's edge meter SHALL be filled to the share of the course's lessons the learner
has completed, counted by the same rule the outline's own completion marks use: a lesson
counts as complete when it is marked complete or watched to the end, and a lesson with no
runtime is counted by its mark alone.

Because completion is read from the browser's storage, which the server cannot see, the row
SHALL render the meter's **track** in its server-rendered first frame and during the hydration
render, and SHALL NOT render its **fill** until hydration commits. A learner who has completed
nothing SHALL see the track with no fill, and the meter SHALL carry no progress role and no
progress reading in that state — an indicator announcing zero is an assertion about the
learner that the page is not entitled to make.

Once there is a reading, the meter SHALL expose it to assistive technology with a localized
accessible name.

#### Scenario: The track renders before the fill can be known

- **WHEN** the server-rendered HTML of a lesson page is inspected
- **THEN** it contains the meter's track and no filled portion, while the `Module · Lesson N of M` reading — derived from the route, not from storage — is present

#### Scenario: Progress appears once hydration commits

- **WHEN** a learner who has completed 8 of 21 course lessons opens a lesson on a phone
- **THEN** after hydration the edge meter is filled to that share and carries a localized accessible name stating the reading

#### Scenario: A learner with no progress is not described as having none

- **WHEN** a learner who has completed nothing opens a lesson on a phone
- **THEN** the meter renders its track with no fill, and carries no progress role and no reading

#### Scenario: The meter agrees with the rows it opens

- **WHEN** the learner expands the row and reads the completion marks in the outline
- **THEN** the number of marked lessons is the number the edge meter's share was computed from

### Requirement: The lesson page reads no presentation switch from the URL

The lesson page SHALL NOT vary its course-outline presentation on any search parameter. A URL
carrying `outline=a`, `outline=b`, `outline=c`, or any other value SHALL render exactly the
page a URL without that parameter renders.

#### Scenario: A leftover switch parameter changes nothing

- **WHEN** a learner opens a lesson URL carrying `?outline=a` or `?outline=c` on a phone
- **THEN** the compact row renders, exactly as it does without the parameter, and no alternative presentation exists to select

### Requirement: The video frame is never an undressed black box

The lesson's video frame SHALL show a placeholder whenever the player is not yet able to
play, so the frame reads as a player that is coming rather than as a player that is broken.

The frame already reserves its space — its 16:9 box resolves server-side and does not
shift — but the markup inside it arrives empty: the provider's `<iframe>` has no source,
the poster `<img>` has no source, and the layout element carries no controls until the
player boots. The result is a flat black rectangle for as long as the bundle and the embed
take, which on a slow connection is the longest-lived state of the page.

The placeholder SHALL carry the lesson's own poster where the lesson declares one, so the
frame shows the actual lesson rather than a generic shape, and SHALL fall back to the
`Skeleton` shimmer where it does not. In both cases it SHALL carry a play-control and
control-bar silhouette, so the box is legible as a player.

This requirement SHALL NOT change the gold title cover or the condition under which it is
shown. The cover answers "this lesson has no carátula of its own"; the placeholder answers
"the player is not ready yet". They are different questions and both may be true at once.

#### Scenario: A booting player shows a placeholder, not a black box
- **WHEN** the lesson page renders and the player cannot yet play
- **THEN** the video frame shows the placeholder, and no undressed black rectangle is presented

#### Scenario: The placeholder shows the lesson's own poster
- **WHEN** the lesson declares a poster
- **THEN** the placeholder renders that poster inside the frame while the player boots

#### Scenario: The gold title cover is unaffected
- **WHEN** the placeholder is shown for a lesson whose cover condition is met
- **THEN** the gold title cover renders exactly as it does today, over the placeholder

#### Scenario: The ready player is unobstructed
- **WHEN** the player reports it can play
- **THEN** the placeholder is gone and every player control, gesture and overlay behaves as it does today

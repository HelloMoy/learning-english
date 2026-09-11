## ADDED Requirements

### Requirement: A search param selects the mobile course-outline presentation

The Lesson Page SHALL read a search param named `outline` whose recognized values are `a`, `b`
and `c`. Each recognized value SHALL select one provisional mobile presentation of the course
outline in place of the default drawer. An absent param, an empty value, or any unrecognized
value SHALL select the default drawer — the presentation specified by `cinema-lesson-view`.

The param SHALL be read as URL state, not stored: it SHALL NOT be written to `localStorage`, a
cookie, or any user setting, and the selection SHALL therefore not survive a visit to a URL
without the param.

No control anywhere in the application SHALL link to, or offer a way to set, the `outline` param.
It is reached by typing it.

The selection SHALL affect only the presentation rendered below the `lg` breakpoint. The desktop
sticky sidebar SHALL render identically for every value of the param, recognized or not.

#### Scenario: A recognized value selects its variant

- **WHEN** a learner opens a lesson URL carrying `?outline=b` on a viewport narrower than `lg`
- **THEN** Variant B renders, and the default `<details>` drawer does not

#### Scenario: No param renders today's drawer

- **WHEN** a learner opens a lesson URL with no `outline` param on a viewport narrower than `lg`
- **THEN** the default `<details>` drawer renders exactly as specified by `cinema-lesson-view` —
  a `<summary>` carrying the localized "Course content" label, collapsed, with no variant chrome

#### Scenario: An unrecognized value falls back rather than failing

- **WHEN** a learner opens a lesson URL carrying `?outline=z`, `?outline=`, or `?outline=A%20`
- **THEN** the default drawer renders, no error is raised, and nothing is logged to the console

#### Scenario: The desktop sidebar ignores the param

- **WHEN** a lesson URL carrying any `outline` value is opened on a viewport at or above `lg`
- **THEN** the sticky sidebar renders with the same markup and behavior it has without the param,
  and no variant chrome appears at any position on the page

#### Scenario: Changing the param does not require a reload

- **WHEN** the `outline` param changes while the Lesson Page is mounted
- **THEN** the rendered presentation changes to match, without a full page reload and without
  losing the player's playback position

### Requirement: Every variant opens the same course outline

Each variant SHALL render the existing `Outline` — the same modules, the same lesson rows in
`sequence` order, the same current-lesson indication, the same completion marks, and the same
per-lesson meters — inside a bounded, scrollable region. No variant SHALL render its own copy of
the lesson list.

Each variant SHALL be collapsed on arrival and SHALL expand on a tap of its control. On expanding,
the variant SHALL position the outline so the row marked `aria-current="page"` is in view, the
same way the default drawer does, so no variant opens onto the first module of a long course.

Each variant's control SHALL expose its expanded state through `aria-expanded`, SHALL be operable
by keyboard with a visible focus ring, and SHALL carry a localized accessible name. Because each
variant's own control already names the region, the `Outline` SHALL NOT render a second visible
heading inside it.

#### Scenario: A variant expands onto the current lesson

- **WHEN** a learner on lesson 40 of a long course taps any variant's control
- **THEN** the outline expands and the row for lesson 40 is in view within the variant's scroll
  region, and the page's own scroll position is unchanged

#### Scenario: A variant's control reports its state

- **WHEN** any variant renders collapsed and is then activated
- **THEN** its control reports `aria-expanded="false"` before activation and `aria-expanded="true"`
  after it

#### Scenario: A variant is operable by keyboard

- **WHEN** a learner moves focus to any variant's control and presses Enter or Space
- **THEN** the outline expands, and the control carries a visible focus indicator throughout

#### Scenario: The region is not named twice

- **WHEN** any variant renders its expanded outline
- **THEN** the words "Course content" appear once in the variant's own control, and the `Outline`
  renders no second visible heading — while the outline's `nav` keeps its accessible name

### Requirement: Variants report course progress read after hydration

Variants A and B SHALL display how far the learner has got through the course, and Variants A, B
and C SHALL display where the current lesson sits inside its module.

Course progress SHALL be counted with the same rule the outline's completion marks use, so a
variant's reading can never disagree with the rows it opens onto. A lesson counts as complete when
it is marked complete or watched to the end; a lesson with no runtime is counted only by its mark.

The position reading SHALL be the current lesson's ordinal within its own module and that module's
lesson count — `Lesson N of M`, where `M` is the number of lessons in the module named beside it,
both derived from `sequence` order.

Because completion and playback position are read from `localStorage`, which the server cannot
read, no variant SHALL render a meter fill or a percentage in its server-rendered first frame or
during the hydration render. Until hydration commits, a variant SHALL render its track without a
fill and SHALL omit the percentage entirely rather than render it as zero. The position reading
`Lesson N of M` is derived from the route and the course structure, not from storage, and SHALL
therefore render on the server like the rest of the page.

Every number a variant displays SHALL be formatted through `next-intl`, and every label SHALL come
from the message files for `en`, `es` and `pt`.

#### Scenario: The percentage is absent before hydration

- **WHEN** the server-rendered HTML of a lesson page carrying `?outline=a` is inspected
- **THEN** it contains no completion percentage and no filled meter segment, while the
  `Lesson N of M` reading is present

#### Scenario: Progress appears once hydration commits

- **WHEN** a learner who has completed 8 of 21 lessons in a course opens `?outline=a`
- **THEN** after hydration the card shows the course percentage and a meter filled to match, and
  the reading agrees with the completion marks in the outline the card opens

#### Scenario: The position reading counts within the module

- **WHEN** the current lesson is the 13th of the 27 lessons in the module "Consonants"
- **THEN** the variant reads `Consonants · Lesson 13 of 27` (Variants A and B) or `13 / 27`
  (Variant C), in the active locale

#### Scenario: A learner with no progress sees no meter fill

- **WHEN** a learner who has completed nothing opens `?outline=a` or `?outline=b`
- **THEN** the meter renders its track with no fill, and no percentage is asserted

### Requirement: Variant A presents progress as a card above the breadcrumb

Variant A SHALL render, above the breadcrumb, a card containing: a segmented meter with one
segment per course module, each segment filled in proportion to that module's completed lessons;
the course-completion percentage as a prominent numeral; the reading `Module · Lesson N of M`; and
a disclosure control labelled with the localized "View content" copy that expands the outline in
place, below the card's own content.

The segmented meter SHALL be exposed to assistive technology as a single progress indicator with a
localized accessible name stating the same reading the percentage shows, rather than as a row of
unlabelled segments.

#### Scenario: The meter has one segment per module

- **WHEN** Variant A renders for a course of five modules
- **THEN** the meter draws five segments, and the segment for a fully completed module is fully
  filled while the segment for an untouched module is empty

#### Scenario: The card expands in place

- **WHEN** the learner activates Variant A's "View content" control
- **THEN** the outline expands below the card's progress row, the card stays above the breadcrumb,
  and the page does not navigate

#### Scenario: The meter states its reading in text

- **WHEN** Variant A's meter renders after hydration
- **THEN** it carries a single progress role with a localized accessible name conveying the
  completion reading, not one indicator per segment

### Requirement: Variant B presents a compact row with an edge meter

Variant B SHALL render, above the breadcrumb, a single-row card containing: a square tile bearing
a list icon, the localized "Course content" title, the `Module · Lesson N of M` subtitle, and a
chevron indicating the collapsed or expanded state. A thin completion meter SHALL run along the
card's bottom edge, filled to the course-completion fraction.

The whole row SHALL be one control — the tile, the text, and the chevron SHALL NOT be separately
focusable — so there is a single tap target spanning the card's width. The chevron SHALL be
decorative: the control's state SHALL be conveyed by `aria-expanded`, never by the icon alone.

#### Scenario: The row is a single tap target

- **WHEN** Variant B renders
- **THEN** exactly one focusable control exists in the card, and activating it anywhere along the
  row expands the outline

#### Scenario: The chevron reflects state without carrying it

- **WHEN** Variant B is expanded
- **THEN** the chevron's rendered direction changes and the control reports `aria-expanded="true"`,
  while the icon itself is hidden from assistive technology

#### Scenario: The edge meter tracks course completion

- **WHEN** a learner who has completed 8 of 21 course lessons opens `?outline=b`
- **THEN** after hydration the bottom-edge meter is filled to the same fraction Variant A's
  percentage reports for the same learner

### Requirement: Variant C docks the control to the bottom of the viewport

Variant C SHALL render a bar fixed to the bottom edge of the viewport containing: a grab handle, a
list icon, the localized "Course content" title, the `N / M` counter, and an upward chevron.
Variant C SHALL NOT render any card above the breadcrumb — the breadcrumb SHALL run straight into
the player.

Activating the bar SHALL expand the outline upward into a sheet over the page; activating it again,
or pressing Escape, SHALL collapse it. While the sheet is expanded, focus SHALL be reachable within
it by keyboard and SHALL return to the bar when it collapses.

The bar SHALL sit above the browser's own bottom chrome and SHALL respect the safe-area inset, so
its control is fully tappable on a device with a home indicator. The docked bar SHALL NOT cover the
player's controls: the page SHALL reserve space equal to the bar's height at the end of its
scrollable content.

The grab handle SHALL be decorative. Variant C SHALL NOT implement a drag-to-dismiss gesture in
this change.

#### Scenario: No card sits above the breadcrumb

- **WHEN** a learner opens `?outline=c`
- **THEN** the breadcrumb is the first element below the site header, and the course-content
  control is at the bottom edge of the viewport

#### Scenario: The sheet expands and collapses

- **WHEN** the learner taps the docked bar and then presses Escape
- **THEN** the outline expands over the page and then collapses, and focus returns to the bar

#### Scenario: The bar clears the safe area

- **WHEN** Variant C renders on a viewport reporting a non-zero bottom safe-area inset
- **THEN** the bar's control is offset above the inset rather than beneath it

#### Scenario: The bar does not cover the end of the page

- **WHEN** the learner scrolls Variant C's page to the bottom
- **THEN** the last content of the page is visible above the docked bar, not behind it

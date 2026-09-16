# Capability: cinema-module-overview

## Purpose

Define the Immersion Cinema presentation of the module overview route (`/[locale]/courses/[courseSlug]/modules/[moduleSlug]`). The module is presented as a video list: a header carrying the back link, the module's video count and ordinal, and its title, followed by an ordered list of video rows — one per lesson — each showing a thumbnail/play affordance, a "Video N" eyebrow, the lesson title, duration when known, and a trailing action, naming the video it opens, that links to the Lesson Page.
## Requirements
### Requirement: Video rows mark lessons the learner has already completed

A step's state SHALL be derived from the learner's stored progress, using the existing
completion rule of the `lesson-progress` and `watch-progress` capabilities: a lesson is
**finished** when it counts as complete; otherwise it has a watched fraction between 0
and 1.

The finished marker SHALL carry a localized accessible name, so the finished state is
announced and does not rest on the marker's colour or glyph alone. A step whose lesson
is partly watched and is not the current step SHALL NOT render a progress bar; partial
progress is shown on the current step only.

Because completion and playback position are read in the browser after hydration while
the module's lessons are resolved on the server, the route and the progress panel SHALL
be client-rendered from lesson data the server resolves; the header and back link SHALL
remain server-rendered. No explicit "not completed" marker text SHALL be rendered.

#### Scenario: A completed lesson is distinguishable on the route
- **WHEN** the module overview renders a lesson the learner has completed
- **THEN** that step shows the finished marker with its localized accessible name, and steps for lessons never opened show the upcoming marker

#### Scenario: A lesson watched to the end counts as finished without the button
- **WHEN** a lesson has a stored position past its finish threshold and was never marked complete
- **THEN** its step renders as finished

#### Scenario: The header stays server-rendered
- **WHEN** the module overview is rendered
- **THEN** the back link, eyebrow, title and videos-and-runtime line are produced on the server, and only the route and the progress panel are client-rendered

#### Scenario: The indicator is announced, not merely coloured
- **WHEN** a screen reader reaches a finished step
- **THEN** the finished state is announced through a localized accessible name

### Requirement: Module overview renders as a video list

The module overview (`/[locale]/courses/[courseSlug]/modules/[moduleSlug]`) SHALL present a back link to the course, an eyebrow stating the module's ordinal and the course title, the module title, a line stating how many videos the module holds and their total runtime, a module progress panel, and a **route**: an ordered sequence of steps, one per lesson, joined by a vertical rail. All copy SHALL be localized and links SHALL be locale-aware.

Each step SHALL carry a marker on the rail showing its state — **finished**, **current** or **upcoming** — and the state SHALL be perceivable without relying on colour alone. Steps SHALL render in `sequence` order and SHALL be labelled `Video N` with the real lesson title and, for video lessons, a minute label.

- An **upcoming** step SHALL show the lesson's thumbnail, the `Video N · M min` eyebrow, the title, and a trailing action labelled as watching that lesson's video.
- A **finished** step SHALL be compact: the `Video N · M min` eyebrow and the title, visually subordinate to upcoming steps, with a trailing action labelled as watching the video again. It SHALL NOT show a thumbnail.
- The **current** step is specified by the requirement "The current lesson is featured on the route".

The trailing action SHALL be labelled with what it does rather than with the generic `Open`.

The header SHALL NOT render a decorative hero tile for the module. A `Module` carries no artwork, so such a tile could only repeat the ordinal the eyebrow already states and a truncation of the title beneath it, while displacing the route.

Steps SHALL NOT be labelled `Episode N`; the `course-vocabulary` capability fixes each term to one level.

A thumbnail SHALL render the lesson's `poster` artwork when the lesson has one, and SHALL fall back to the decorative gradient tile with a play affordance when it does not. The thumbnail SHALL navigate to the same lesson as that step's action when activated with a pointer, and SHALL be excluded from the accessibility tree and from the tab order, leaving the step's action as its single announced and tabbable control.

#### Scenario: The header carries no decorative hero tile
- **WHEN** the module overview renders
- **THEN** the header shows the back link, the eyebrow, the module title and the videos-and-runtime line, and no gradient tile repeating the module ordinal or the first word of its title

#### Scenario: The header states the module's size
- **WHEN** a module holds 17 video lessons totalling 9,525 seconds
- **THEN** the header reads as 17 videos and 2 h 39 min in the active locale

#### Scenario: Steps reflect real lessons in order
- **WHEN** the module resolves its lessons
- **THEN** steps render in `sequence` order, each labelled `Video N` with the real lesson title, and each step's action links to that lesson for the active locale

#### Scenario: An upcoming step invites watching the video
- **WHEN** a step renders for a lesson that is neither finished nor current
- **THEN** it shows the lesson's thumbnail and an action reading as an invitation to watch that video, and no step is labelled `Open`

#### Scenario: A finished step recedes
- **WHEN** a step renders for a finished lesson
- **THEN** it shows no thumbnail, its title is visually subordinate to upcoming titles, its rail marker shows the finished state, and its action reads as watching the video again

#### Scenario: Duration shown only when known
- **WHEN** a lesson is a video with a duration
- **THEN** its step shows a minute label; **AND WHEN** the lesson is a reading lesson
- **THEN** the duration is omitted rather than shown as zero

#### Scenario: Back link returns to the course overview
- **WHEN** the user activates the back link
- **THEN** they navigate to the course overview for the active locale

#### Scenario: A lesson without artwork keeps the placeholder tile
- **WHEN** a step that shows a thumbnail renders for a lesson with no `poster`
- **THEN** the thumbnail shows the decorative gradient tile with its play affordance, and no broken or empty image is rendered

#### Scenario: The thumbnail does not duplicate the step's control for assistive technology
- **WHEN** a screen reader or keyboard user traverses a step
- **THEN** exactly one link is announced and reachable for that step, and the thumbnail is skipped

#### Scenario: Retired vocabulary is absent
- **WHEN** the module overview renders in any supported locale
- **THEN** no step or eyebrow is labelled with an episode or season term

### Requirement: Video row titles stay legible on narrow viewports

In the module overview's video list, a lesson title too long for the space available SHALL remain legible rather than being cut to a prefix. On narrow viewports the title SHALL wrap onto as many lines as it needs; the single-line treatment is reserved for rows wide enough to show a title that distinguishes it from its neighbours.

This exists because these lesson titles share long prefixes. In the largest module every
title begins `Exercise N Pronunciation Step By Step Lesson`; truncated to the width of a
phone they all read `Exercise 1 Pronunciati…`, `Exercise 2 Pronunciati…`, and the list
stops being a way to choose a lesson. Truncation is only safe where enough of the title
survives to tell one row from the next.

Wrapping a title SHALL NOT change the row's other contents or their order — the eyebrow,
the completion mark, and the trailing action stay as they are; the row simply grows taller.

#### Scenario: A long title wraps rather than truncates on a phone
- **WHEN** the module overview renders at a 320px or 390px viewport width for a module whose lesson titles exceed one line
- **THEN** each title wraps across multiple lines and is readable in full, with no ellipsis

#### Scenario: Rows with shared prefixes stay distinguishable
- **WHEN** a module's lesson titles share a long common prefix and the list renders on a phone
- **THEN** the part of each title that differs from its neighbours is visible, so a learner can tell the rows apart

#### Scenario: The row keeps its structure when a title wraps
- **WHEN** a title wraps onto several lines
- **THEN** the row still shows its `Video N` eyebrow, its completion mark when the lesson is complete, and its trailing action, and that action remains fully within the viewport

### Requirement: A video row is clickable across its whole area

A video row is one object — a full-width band holding one lesson's thumbnail, ordinal, title, progress and duration — so a pointer landing anywhere in the row SHALL navigate to that lesson's page, not only a pointer landing on the trailing action.

The extended hit area SHALL be an extension of that trailing action, not a new control. The row SHALL therefore continue to expose exactly one announced and tabbable link, and its accessible name SHALL remain the action's own label rather than the row's whole text.

The row SHALL show a pointer-driven hover treatment, so the area that responds to a click is the area that looks like it will.

#### Scenario: Clicking the row body opens the lesson
- **WHEN** the user clicks the row's title, its ordinal, its progress bar or its duration
- **THEN** they navigate to that row's lesson for the active locale — the same destination as the row's trailing action

#### Scenario: The row still exposes exactly one control
- **WHEN** a screen reader or keyboard user traverses a video row
- **THEN** exactly one link is announced and reachable for that row, as before the hit area was extended, and the row itself is not announced as a link

#### Scenario: The row shows it is clickable
- **WHEN** the pointer moves over any part of a row
- **THEN** the row shows a hover treatment covering the whole band rather than only under the trailing action

### Requirement: The current lesson is featured on the route

The **current** lesson SHALL be the module's **continue target**, as defined once by the
`continue-target` capability: the rule applied to the module's lessons in `sequence` order, with the
lesson recorded by the `continue-watching` capability as the last opened lesson when it belongs to this
module. The module overview SHALL NOT restate or reimplement that rule; its route SHALL obtain the
current step from `findContinueTarget`.

A target of kind `start` or `continue` SHALL be the current step. A target of kind `rewatch` — every
lesson finished — SHALL make no step current.

Because the record holds the lesson opened last, opening an earlier lesson to review it
moves the current lesson to that point; the record cannot tell a review from a return to
the start, and a return to the start is what the learner means more often.

The current step SHALL be expanded into a featured card showing the lesson's poster
(or the gradient fallback), a "you are here" eyebrow naming `Video N`, the title, and one
primary action linking to the lesson.

When the current lesson is partly watched, the card SHALL show its watch progress bar
and the minutes left in that lesson, and the primary action SHALL read as continuing.
When it has not been started, the card SHALL show no bar and the primary action SHALL
read as starting the video.

A module in which every lesson is finished SHALL have no current step and SHALL feature
no card.

The featured card SHALL expose exactly one announced and tabbable link — its primary
action — with the poster excluded from the accessibility tree and the tab order.

#### Scenario: A learner going in order is featured the next video
- **WHEN** lessons 1–5 are finished and lesson 5 was opened last
- **THEN** step 6 is expanded into the featured card and no other step is expanded

#### Scenario: A learner who skipped ahead is not sent back to the start
- **WHEN** lessons 25–27 are finished, lesson 27 was opened last and lessons 1–24 have no progress
- **THEN** step 28 is featured, and steps 1–24 render as upcoming

#### Scenario: A learner who returned to the start continues there
- **WHEN** lessons 25–27 are finished, and afterwards lessons 1–2 were finished with lesson 2 opened last
- **THEN** step 3 is featured, not step 28

#### Scenario: A partly watched last opened lesson is featured itself
- **WHEN** lessons 25–27 are finished and lesson 7 was opened last and is partly watched
- **THEN** step 7 is featured

#### Scenario: A record from another module falls back to the furthest progress
- **WHEN** lessons 25–27 of this module are finished and the last opened lesson belongs to another module
- **THEN** step 28 is featured

#### Scenario: A partly watched furthest lesson is featured when there is no record
- **WHEN** there is no record, lesson 1 is finished, lesson 2 is not started and lesson 7 is partly watched
- **THEN** step 7 is featured, and step 2 renders as an upcoming step

#### Scenario: Nothing left after the anchor falls back to the first gap
- **WHEN** the last lesson of the module is finished and opened last, and lessons 3–24 have no progress
- **THEN** the first unfinished lesson, step 3 when 1–2 are finished, is featured

#### Scenario: An untouched module features its first video
- **WHEN** no lesson in the module has any progress
- **THEN** step 1 is featured

#### Scenario: A partly watched current lesson offers to continue
- **WHEN** the current lesson has a stored position of 264 seconds against a 660-second duration
- **THEN** the card shows a bar at 40%, states 7 minutes left, and its action reads as continuing

#### Scenario: An unstarted current lesson offers to start
- **WHEN** the current lesson has no stored position
- **THEN** the card shows no progress bar and its action reads as starting the video

#### Scenario: A finished module features nothing
- **WHEN** every lesson in the module is finished
- **THEN** no step is expanded and every step shows the finished marker

#### Scenario: The module and the course pick the same video
- **WHEN** the current step of a module is video 4 and that module holds the course's continue target
- **THEN** the course overview's continue tile offers the same video 4

### Requirement: The module states its progress in a panel

The module overview SHALL render a module progress panel stating the percentage of the
module's lessons finished, drawn as a ring with the percentage as text, the count as
`N of M videos`, and the watch time left in the module. Time left SHALL be the sum over
the module's video lessons of the unwatched part of each duration, where a finished
lesson contributes nothing.

When every lesson is finished, the panel SHALL state that the lesson (module) is
completed instead of the count, using the `course-vocabulary` term, and SHALL NOT state
time left.

On viewports at or above the `lg` breakpoint the panel SHALL sit in a side column beside
the route and stay in view while the route scrolls; below it, the panel SHALL render
above the route. The ring SHALL be decorative, with the progress exposed as text.

#### Scenario: The panel counts finished lessons
- **WHEN** 5 of a module's 17 lessons are finished
- **THEN** the panel shows 29%, 5 of 17 videos, and the remaining watch time

#### Scenario: Time left discounts partial progress
- **WHEN** a module holds two 600-second lessons, one finished and one watched to 240 seconds
- **THEN** the panel states 6 minutes left

#### Scenario: A finished module says so
- **WHEN** every lesson is finished
- **THEN** the panel shows 100% and the completed label, and no time left

#### Scenario: The panel follows the viewport
- **WHEN** the page renders at 1440px wide
- **THEN** the panel sits beside the route; **AND WHEN** it renders at 390px wide
- **THEN** the panel sits above the route and the page does not scroll horizontally

### Requirement: Progress-dependent parts wait for the learner's progress

The route SHALL render every step as upcoming with no featured card, and the progress
panel SHALL render without figures, until the browser has read both the learner's stored
progress and the continue-watching record, so the first frame never asserts progress
that may be false. The featured card SHALL NOT be shown from progress alone while the
record is still being read, so it never appears on one lesson and then moves to
another. Once both are read, the route and panel SHALL update to the derived state.

#### Scenario: The first frame asserts nothing
- **WHEN** the module overview is rendered on the server
- **THEN** no step shows the finished or current state, no card is featured, and the panel shows no percentage, count or time left

#### Scenario: Progress appears after hydration
- **WHEN** the page hydrates on a device holding progress for the module
- **THEN** the finished steps, the featured card and the panel figures appear

### Requirement: The progress panel shows the module's prize

The module progress panel SHALL show, below its progress figures, the module's prize as assigned by the
`learner-achievements` catalog, in the module's prize state as `learner-achievements` defines it —
tickets earned are kept after an un-mark and a claim is kept for good, so the prize row follows tickets
and claims, not the videos the panel counts as finished now.

The prize SHALL be drawn exactly as the prize counter draws a prize in the same state, keeping the
counter's surprise:

- **locked** or **collecting** — the prize's silhouette, its name withheld as `???`, a ticket tag reading
  the tickets earned out of the module's lessons (`11 / 17`), and a line stating how many tickets are
  still needed;
- **ready** — the silhouette and `???`, a line stating that every ticket is collected, and a **Claim
  prize** text link — underlined, in the muted text colour of the page's other secondary text links
  such as the lesson page's Unmark, never styled as a button — that opens `/[locale]/achievements` asking for this module's prize, the same destination
  the prize-ready dialog opens;
- **claimed** — the coloured illustration, the prize's name, and a tag reading that it was redeemed.

The prize SHALL NOT be drawn in colour, nor named, in any state but claimed. The panel SHALL NOT offer
to share the prize.

The illustration SHALL be decorative. Assistive technology SHALL hear the whole state in one sentence —
the prize's name and that it is redeemed, that the module's hidden prize is ready to claim, or that the
module's hidden prize has the given tickets — and the Claim prize link SHALL be named after the module.
States SHALL NOT be told apart by colour alone.

A module that holds no lessons SHALL show no prize row. Until the learner's progress has been read, the
row SHALL keep its shape with its label, the silhouette and `???` only, and SHALL show no ticket tag, state
line or action, so the first frame asserts nothing and the route below does not jump when progress arrives.

In the panel and in the finale, the Claim prize text link SHALL sit on the same line as the prize's
label (`Prize ready`), at the end of that line, rather than on a line of its own.

#### Scenario: Claim prize shares the label's line
- **WHEN** a ready prize is shown in the panel or the finale
- **THEN** Claim prize sits on the same line as the Prize ready label, after it

#### Scenario: A module still collecting shows the hidden prize and what is left
- **WHEN** 11 of the 17 `Vowels` lessons have earned their tickets and its prize is not claimed
- **THEN** the panel shows the harmonica's silhouette, `???`, a `11 / 17` tag and that 6 tickets are still needed, and assistive technology hears that the hidden prize of Vowels has 11 of 17 tickets

#### Scenario: An untouched module shows its hidden prize
- **WHEN** no `Vowels` lesson has earned its ticket
- **THEN** the panel shows the silhouette, `???` and a `0 / 17` tag

#### Scenario: A ready prize sends the learner to claim it
- **WHEN** every `Vowels` lesson has earned its ticket and the prize is not claimed
- **THEN** the panel still shows the silhouette and `???`, states that every ticket is collected, and offers a Claim prize link named after Vowels that opens `/[locale]/achievements?claim=2-vowels`

#### Scenario: A claimed prize is revealed
- **WHEN** the learner has claimed the `Vowels` prize on the counter
- **THEN** the panel shows the harmonica in colour, named, tagged as redeemed, with no Claim prize link

#### Scenario: Tickets outlive an un-mark
- **WHEN** every `Vowels` lesson has earned its ticket, the prize is not claimed, and the learner un-marks one lesson
- **THEN** the panel's figures state 16 of 17 videos while the prize row still reads ready to claim

#### Scenario: Nothing is shared
- **WHEN** the panel shows a claimed prize
- **THEN** it offers no share action

#### Scenario: The first frame shows no prize state
- **WHEN** the module overview is rendered on the server
- **THEN** the panel's prize row shows only its label, the silhouette and `???`, with no ticket tag, state line or Claim prize link

### Requirement: The route ends at the module's prize

After the module's last step, the route's rail SHALL continue into a **prize finale**: a marker on the rail
and a card presenting the module's prize, in the same state, drawing and wording rules as the progress
panel's prize row — silhouette and `???` until claimed, the ticket tag while locked or collecting, a
**Claim prize** link to `/[locale]/achievements` asking for this module's prize while ready, and the
coloured, named prize once claimed. Its Claim prize link SHALL be the same text link as the panel's.

Once every ticket is collected — ready or claimed — the finale's primary action SHALL be a button
reading **Start Lesson NN →**, where `NN` is the next lesson's ordinal padded to two digits, leading to
the next lesson of the course that holds videos, to the same destination the course overview's tile
for that lesson opens: its only video when it holds one, otherwise its overview. While the prize is
ready, the Claim prize text link SHALL remain on the card, on the prize label's line. A module that is the last of its course to
hold videos SHALL offer no Start Lesson action. While tickets are still being collected the finale
SHALL offer no Start Lesson action.

The finale SHALL NOT be a lesson step: it SHALL NOT be an item of the route's list of steps, SHALL carry
no finished, current or upcoming state, and SHALL NOT change which step is current or how steps are
counted.

The finale's marker SHALL carry a trophy icon, and SHALL tell a prize still collecting apart from one
whose tickets are all collected by shape as well as colour: a dashed ring while collecting, a solid disc
once every ticket is collected. A ready prize's card SHALL be featured like the current step's card; a
collecting or locked prize's card SHALL be visually subordinate to the steps above it. The finale SHALL
NOT offer to share the prize.

Assistive technology SHALL hear the finale's state in one sentence, as for the panel's prize row. The
finale's tabbable controls SHALL be the Start Lesson button and the Claim prize link, each only in
the states above.

A module that holds no lessons SHALL render no finale. Until the learner's progress has been read, the
finale SHALL show no prize state, ticket count or action.

#### Scenario: The route leads to a hidden prize
- **WHEN** 11 of the 17 `Vowels` lessons have earned their tickets
- **THEN** after step 17 the rail ends at a prize finale showing the harmonica's silhouette, `???` and `11 / 17`, and the route still holds exactly 17 steps

#### Scenario: A ready prize is featured at the end of the route
- **WHEN** every `Vowels` lesson has earned its ticket and the prize is not claimed
- **THEN** the finale is featured, shows the silhouette and `???`, offers Start Lesson 03 → opening the `Consonants` overview as its primary button, and a Claim prize text link named after Vowels that opens `/[locale]/achievements?claim=2-vowels`

#### Scenario: A claimed prize closes the route
- **WHEN** the learner has claimed the `Vowels` prize
- **THEN** the finale shows the harmonica in colour, named, tagged as redeemed, offers Start Lesson 03 →, and offers no Claim prize link and no share action

#### Scenario: The next lesson opens where the course overview opens it
- **WHEN** every ticket of `Ejercicios para dominar el ritmo en Inglés` is collected and the next lesson, `Fluidez y Velocidad`, holds a single video
- **THEN** Start Lesson 05 → opens that video's lesson page

#### Scenario: The course's last lesson offers no next lesson
- **WHEN** every ticket of the last lesson of a course is collected
- **THEN** the finale offers no Start Lesson action

#### Scenario: Collecting offers no next lesson
- **WHEN** 11 of the 17 `Vowels` lessons have earned their tickets
- **THEN** the finale offers no Start Lesson action

#### Scenario: Claim prize reads as a text link
- **WHEN** a ready prize is shown in the panel or the finale
- **THEN** Claim prize is an underlined text link in the muted text colour, with no button background

#### Scenario: The finale's marker is a trophy
- **WHEN** the finale renders in any state
- **THEN** its marker carries a trophy icon, inside a dashed ring while collecting and a solid disc once every ticket is collected

#### Scenario: The finale is not counted as a step
- **WHEN** a screen reader lists the route's steps
- **THEN** it finds one item per lesson and the finale outside that list

#### Scenario: The finale waits for progress
- **WHEN** the module overview is rendered on the server
- **THEN** the finale shows no prize state, ticket tag or Claim prize link

#### Scenario: The finale fits a phone
- **WHEN** the module overview renders at 390px wide with a ready prize
- **THEN** the finale's card and its Claim prize link sit within the viewport and the page does not scroll horizontally


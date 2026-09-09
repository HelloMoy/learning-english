# Capability: cinema-home

## Purpose

Define the Immersion Cinema presentation of the locale layout and home route. The locale layout renders a global header that exposes the brand and a route-derived section eyebrow while preserving the existing locale switcher and theme toggle. The home route (`/[locale]`) renders as a streaming cover: a cinema hero with localized copy and CTAs, followed by a featured-course rail that surfaces the real catalog course with module/lesson counts and a compact module index.
## Requirements
### Requirement: Global header shows brand and section chrome

The locale layout SHALL render an Immersion Cinema header containing the `ENGLISH·COURSE` wordmark, a section eyebrow of the form `IMMERSION CINEMA · <SECTION>` where `<SECTION>` derives from the current route (`HOME`, `COURSE`, `MODULE`, `LESSON`), and the existing locale switcher and theme toggle re-styled as chips. The header SHALL remain a landmark, keep locale switching and theme toggling functional, and be localized.

The wordmark SHALL read `ENGLISH·COURSE` in every supported locale. It is a brand mark, not copy: it is not translated, and it names the same product the site publishes to the outside world through its metadata, so a learner reads one name in the header, the browser tab and a shared link preview.

The header SHALL fit within the viewport at every phone-class viewport width in every supported locale, rather than forcing the document to scroll horizontally. Its contents are not all equally load-bearing, so it sheds them in a fixed order as width runs out:

1. The section eyebrow is the first to go — it restates information the page's own heading already carries.
2. The controls' supporting text goes next: the locale control shows the active locale's short code (`EN`, `ES`, `PT`) in place of its full name, and the theme toggle drops its theme-name text and keeps its icon. Whatever visible text a control drops SHALL NOT change what assistive technology announces — each control's accessible name SHALL name the full concept (`Language: English`, `Theme: Dark`) at every width, and SHALL NOT be derived from the abbreviated visible text.
3. The wordmark is never dropped; it is the header's identity and its link home.

The locale control SHALL present the active locale as visible text at every width, so a learner can always see which language they are in without opening anything. Its width SHALL be governed by the label it currently displays rather than by the longest label it could display — a native `<select>`, whose rendered width is set by its widest `<option>`, cannot satisfy this and SHALL NOT be used.

At every width the locale control and the theme toggle SHALL remain fully within the viewport and operable. On touch-sized viewports each SHALL present a hit area of at least 44×44 CSS pixels, which may extend beyond its visible chip.

#### Scenario: Section label reflects the route
- **WHEN** the user is on the locale home
- **THEN** the header eyebrow reads `IMMERSION CINEMA · HOME`; on a lesson route it reads `IMMERSION CINEMA · LESSON`

#### Scenario: Locale and theme controls remain functional
- **WHEN** the header renders with the chip-styled controls
- **THEN** changing the locale and toggling the theme behave exactly as before the re-skin

#### Scenario: The header fits the narrowest phone in every locale
- **WHEN** the header renders at a 320px viewport width in `en`, `es`, or `pt`
- **THEN** it fits within the viewport and contributes no horizontal document scroll

#### Scenario: Controls shed visible text but keep their accessible names
- **WHEN** the header renders at a phone-class width, showing `ES` in place of `Español` and hiding the theme name
- **THEN** the locale control and theme toggle each still expose the same accessible name they expose at desktop widths — `Language: Spanish`, `Theme: Dark` — so a screen reader announces the full concept rather than the abbreviation

#### Scenario: The active language is always visible
- **WHEN** the header renders at any width
- **THEN** the locale control displays the active locale as text — its short code on a phone, its full name from `sm` up — without the learner having to open the menu

#### Scenario: Choosing a language from the menu switches locale
- **WHEN** the learner opens the locale control and chooses a different language
- **THEN** they navigate to the same path under the chosen locale, exactly as the previous `<select>` did

#### Scenario: The locale menu is operable by keyboard
- **WHEN** a keyboard user opens the locale control, moves through the options with the arrow keys, and confirms one
- **THEN** the locale changes, and when the menu closes focus returns to the control that opened it

#### Scenario: Both controls stay operable on a phone
- **WHEN** a learner on a 320px viewport reaches for the theme toggle or the locale switcher
- **THEN** both are fully on screen and each offers a hit area of at least 44×44 CSS pixels

#### Scenario: The wordmark survives the narrowest width
- **WHEN** the header renders at a 320px viewport width
- **THEN** the `ENGLISH·COURSE` wordmark is still present, is not clipped, and still links to the locale home

#### Scenario: The wordmark reads the same in every locale
- **WHEN** the header renders under `en`, `es` or `pt`
- **THEN** the wordmark reads `ENGLISH·COURSE` in all three, because the brand mark is not translated copy

### Requirement: Home renders the whole catalog as an ordered ladder of levels

The locale home (`/[locale]`) SHALL present a cinema hero over a `CinemaBackground` with an eyebrow, the localized title and subtitle, followed by an explicitly labelled `Available courses` section containing a numbered track and **one card per catalog course**, in `Course.sequence` order. No course SHALL be dropped, and no course SHALL be given a layout slot the others cannot have.

Each course card SHALL show: the course's localized ordinal (`Level {number}`, derived from `Course.sequence`), its title, its description, its leading modules with their ordinals, a `+N more` indicator when the course has more modules than are listed, the module and lesson counts, and one call to action linking to the course overview for the active locale.

The section heading SHALL state that these are the available courses, and SHALL report how many there are.

All copy SHALL be localized (en/es/pt) and links SHALL be locale-aware.

#### Scenario: Every catalog course gets a card
- **WHEN** the catalog resolves two courses
- **THEN** the home renders two course cards, in ascending `Course.sequence` order, each linking to its own course overview

#### Scenario: A card previews what is inside the course
- **WHEN** a course has ten modules
- **THEN** its card lists its leading modules with their ordinals and indicates that the remaining ones exist, rather than listing all ten or none

#### Scenario: The courses section announces itself
- **WHEN** the home renders with a non-empty catalog
- **THEN** an `Available courses` heading precedes the cards and the number of courses is shown

#### Scenario: Ordering is data, not arrival order
- **WHEN** the repository returns courses in an order that does not match their `sequence`
- **THEN** the home still renders them in ascending `sequence` order

#### Scenario: A single-course catalog still renders the ladder
- **WHEN** the catalog resolves exactly one course
- **THEN** the home renders one card under the same heading, with no empty slots and no placeholder for a course that does not exist

#### Scenario: Empty catalog degrades gracefully
- **WHEN** the catalog returns no entries
- **THEN** the home shows a localized empty state instead of a broken or empty ladder

#### Scenario: Home copy is localized
- **WHEN** the locale is `es`
- **THEN** the eyebrow, the section heading, the ordinals, the counts and the calls to action render from `es.json`, not hardcoded English

### Requirement: A course card is clickable across its body

A course card presents itself as one object — a bordered panel with its own glow and a hover-lit title — so a pointer landing anywhere on its **body** SHALL navigate to the course overview, the destination its title already carries.

The card's body is everything except the actions pinned at its foot. Those actions SHALL keep their own hit areas and their own destinations, unreduced and unshifted: on an in-progress card the primary action still resumes the lesson and the secondary action still opens the course overview, and a pointer landing on either SHALL reach that action's destination rather than the body's.

The body's hit area SHALL be an extension of the title's existing link, not a new control. The card SHALL therefore expose no additional link to assistive technology and add no tab stop, and its title link's accessible name SHALL remain the course title rather than the whole panel's text.

#### Scenario: Clicking the card body opens the course overview
- **WHEN** the user clicks the card's description, its module preview list, its `+N more` line or its count pills
- **THEN** they navigate to the course overview for the active locale — the same destination as the card's title

#### Scenario: The actions keep their own destinations
- **WHEN** the user clicks the primary or the secondary action on an in-progress card
- **THEN** they reach that action's destination — the resumed lesson or the course overview — and the body's hit area does not intercept the click

#### Scenario: The body's hit area adds no control
- **WHEN** a screen reader or keyboard user traverses a course card
- **THEN** the same links are announced and reachable as before the hit area was extended, and the card itself is not announced as a link

#### Scenario: The title keeps its accessible name
- **WHEN** assistive technology reports the card's title link
- **THEN** its name is the course title alone, not the description, the module list, the counts or the actions

### Requirement: The course being continued is marked on its card

When a stored continue-watching location resolves to a lesson belonging to one of the catalog courses, that course's card SHALL be marked as in progress and its call to action SHALL invite the learner to continue rather than to start. Every other card SHALL read as not started.

The in-progress card's primary call to action SHALL navigate to **the resolved lesson itself** — the same destination as the `Continue watching` panel's action — not to the course overview. A card that says `Continue course` and lands two clicks short of the video contradicts the panel offering the real thing directly above it.

Because that primary action gives up the course overview, the in-progress card SHALL additionally render a **secondary action beneath it** that navigates to the course overview, so the whole course remains one click away. The two actions SHALL be visually distinguishable, the resume action reading as the primary one.

A not-started card SHALL keep exactly one call to action, to the course overview, and SHALL NOT render the secondary action.

Before the client has read the record, and whenever there is no record, every card SHALL render the not-started state — the honest one — rather than flashing a mark it cannot yet justify. The in-progress state SHALL therefore be asserted only once a lesson href is known, so no card ever offers a resume action with nowhere to resume to.

#### Scenario: The in-progress course is marked
- **WHEN** the stored location points at a lesson of the first course
- **THEN** that course's card shows an in-progress mark and a `Continue course` action, and the other cards show a not-started mark and a `Start course` action

#### Scenario: Continuing goes to the lesson, not the course overview
- **WHEN** the stored location resolves to a lesson of a catalog course
- **THEN** that card's `Continue course` action links to that lesson's locale-aware path — the same href the `Continue watching` panel uses — and not to the course overview

#### Scenario: The in-progress card still reaches the course overview
- **WHEN** a card renders in the in-progress state
- **THEN** a second, secondary action renders beneath the primary one and links to the course overview for the active locale

#### Scenario: A not-started card offers one way in
- **WHEN** a card renders in the not-started state
- **THEN** it renders a single `Start course` action to the course overview and no secondary action

#### Scenario: An unresolvable record leaves every card unmarked
- **WHEN** a location is stored but no longer resolves to a live lesson
- **THEN** every card renders the not-started state, and no card offers a resume action

#### Scenario: No record leaves every card unmarked
- **WHEN** no location is stored
- **THEN** every card shows the not-started state

#### Scenario: The mark resolves after hydration
- **WHEN** the home is server-rendered
- **THEN** the markup contains the not-started state for every card, and the mark appears only after the client has read the record

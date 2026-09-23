# Capability: cinema-home

## Purpose

Define the Immersion Cinema presentation of the locale layout and home route. The locale layout renders a global header that exposes the brand and a route-derived section eyebrow while preserving the existing locale switcher and theme toggle. The home route (`/[locale]`) renders as a streaming cover: a cinema hero with localized copy and CTAs, followed by a featured-course rail that surfaces the real catalog course with module/lesson counts and a compact module index.
## Requirements
### Requirement: Global header shows brand and section chrome

The locale layout SHALL render an Immersion Cinema header containing the `ENGLISH·COURSE` wordmark, a section eyebrow of the form `IMMERSION CINEMA · <SECTION>` where `<SECTION>` derives from the current route (`HOME`, `COURSE`, `MODULE`, `LESSON`, `START`, `MY LEARNING`, `ACHIEVEMENTS`, `PROFILE`), and the existing locale switcher and theme toggle re-styled as chips. The header SHALL remain a landmark, keep locale switching and theme toggling functional, and be localized.

The wordmark SHALL be a link whose destination depends on the session the request carries, because "back to the start" means a different page either side of signing in. Without a session it SHALL link to the locale home (`/[locale]`), which is where a visitor is being sold the course. With a session it SHALL link to My learning (`/[locale]/learning`), the signed-in learner's own first page; the marketing home has nothing left to tell them. Both destinations SHALL be resolved through the locale-aware navigation wrappers, so the active locale is preserved.

The destination SHALL follow the same server-decided session flag that chooses between the **Sign in** link and the learner's menu, so the wordmark and the account control never disagree about whether there is a session.

When the device holds a learner profile, the header SHALL additionally render the learner's avatar as a menu trigger whose accessible name includes the learner's name, opening a menu with **My learning**, **Achievements** and **Profile** links, in that order, for the active locale. Without a profile, and before the profile is known, the trigger SHALL NOT render.

On phone-class viewports (below `sm`) with a learner profile, the wordmark, the locale control and three 44px controls cannot share the width, so the theme control SHALL move out of the header row and into the avatar menu as an item that toggles the theme and names the current theme in its accessible name. From `sm` up, and whenever there is no profile, the theme toggle SHALL stay in the header row and the menu SHALL NOT repeat it.

The wordmark SHALL read `ENGLISH·COURSE` in every supported locale. It is a brand mark, not copy: it is not translated, and it names the same product the site publishes to the outside world through its metadata, so a learner reads one name in the header, the browser tab and a shared link preview.

The header SHALL fit within the viewport at every phone-class viewport width in every supported locale, rather than forcing the document to scroll horizontally. Its contents are not all equally load-bearing, so it sheds them in a fixed order as width runs out:

1. The section eyebrow is the first to go — it restates information the page's own heading already carries.
2. The controls' supporting text goes next: the locale control shows the active locale's short code (`EN`, `ES`, `PT`) in place of its full name, and the theme toggle drops its theme-name text and keeps its icon. Whatever visible text a control drops SHALL NOT change what assistive technology announces — each control's accessible name SHALL name the full concept (`Language: English`, `Theme: Dark`) at every width, and SHALL NOT be derived from the abbreviated visible text.
3. The wordmark is never dropped; it is the header's identity and its way back to the learner's starting page.

The locale control SHALL present the active locale as visible text at every width, so a learner can always see which language they are in without opening anything. Its width SHALL be governed by the label it currently displays rather than by the longest label it could display — a native `<select>`, whose rendered width is set by its widest `<option>`, cannot satisfy this and SHALL NOT be used.

At every width the locale control, the theme control (in the header row, or in the avatar menu on a phone with a profile) and the avatar trigger SHALL remain fully within the viewport and operable. On touch-sized viewports each SHALL present a hit area of at least 44×44 CSS pixels, which may extend beyond its visible chip.

#### Scenario: Section label reflects the route
- **WHEN** the user is on the locale home
- **THEN** the header eyebrow reads `IMMERSION CINEMA · HOME`; on a lesson route it reads `IMMERSION CINEMA · LESSON`; on `/learning` it reads `IMMERSION CINEMA · MY LEARNING`

#### Scenario: Section label names the Achievements route
- **WHEN** the user is on `/en/achievements`
- **THEN** the header eyebrow reads `IMMERSION CINEMA · ACHIEVEMENTS`

#### Scenario: Locale and theme controls remain functional
- **WHEN** the header renders with the chip-styled controls
- **THEN** changing the locale and toggling the theme behave exactly as before the re-skin

#### Scenario: A visitor without a session is sent to the locale home
- **WHEN** the header renders for a request that carries no session
- **THEN** the wordmark links to the locale home for the active locale — `/es/` under `es`

#### Scenario: A signed-in learner is sent to My learning
- **WHEN** the header renders for a request that carries a session
- **THEN** the wordmark links to `/[locale]/learning` for the active locale — `/es/learning` under `es`

#### Scenario: The wordmark agrees with the account control
- **WHEN** the header renders with a session but before the learner's card is known
- **THEN** the wordmark already links to My learning, because it follows the same session flag the account control follows, not the profile

#### Scenario: The avatar menu appears with a profile
- **WHEN** the header renders on a device with a saved learner profile
- **THEN** an avatar trigger renders, and opening it offers My learning, Achievements and Profile links, in that order, for the active locale

#### Scenario: On a phone with a profile, the theme control lives in the avatar menu
- **WHEN** the header renders at a 320px viewport width on a device with a learner profile
- **THEN** the theme toggle is not in the header row, the avatar menu offers a theme item, and the wordmark is not clipped

#### Scenario: Switching the theme from the avatar menu keeps the menu open
- **WHEN** the learner activates the avatar menu's theme item
- **THEN** the menu stays open so the switch's slide is visible, and the theme changes once the slide has played

#### Scenario: The avatar menu keeps its size while the theme switches
- **WHEN** the theme item's label changes from one theme's name to the other's
- **THEN** the item and the menu keep the width of the longer name, so the menu does not resize

#### Scenario: No profile, no avatar trigger
- **WHEN** the header renders on a device without a learner profile
- **THEN** no avatar trigger renders

#### Scenario: The header fits the narrowest phone in every locale
- **WHEN** the header renders at a 320px viewport width in `en`, `es`, or `pt`, with or without a learner profile
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
- **THEN** the `ENGLISH·COURSE` wordmark is still present, is not clipped, and still links to its session-dependent destination

#### Scenario: The wordmark reads the same in every locale
- **WHEN** the header renders under `en`, `es` or `pt`
- **THEN** the wordmark reads `ENGLISH·COURSE` in all three, because the brand mark is not translated copy

### Requirement: The new-visitor hero leads with one action

The locale home SHALL render an editorial hero with a localized eyebrow naming the path from the first sound
to real English, a display heading promising American English learned one sound at a time, an intro that
names the progression — vowels and consonants up to contractions, intonation and fast speech — and the notes
in Spanish and English, and exactly one primary action. On a device without a learner profile the action SHALL be labelled **Start course** and navigate to
`/[locale]/start`; on a device with a profile it SHALL be labelled **Continue** and navigate to
`/[locale]/learning`. During server rendering and hydration, before the profile is known, it SHALL read
**Start course** and link to `/[locale]/start`. The action SHALL be accompanied by a localized note
naming the first course and its video count.

The home SHALL render this hero regardless of any stored continue-watching location.

The hero SHALL place the vowel-length card (`hear-the-difference` variant) beside the copy on wide viewports
and below the primary action on phone-class viewports.

#### Scenario: The hero names the path from the first sound
- **WHEN** the home renders in `es`
- **THEN** the eyebrow reads `Del primer sonido al inglés real` and the heading reads `Aprende el inglés americano sonido por sonido.`

#### Scenario: A first-time visitor starts the onboarding
- **WHEN** the home renders on a device with no learner profile
- **THEN** the hero's Start course action links to `/[locale]/start`

#### Scenario: A learner with a profile goes to My learning
- **WHEN** the home renders on a device with a saved learner profile
- **THEN** after hydration the hero's action reads Continue and links to `/[locale]/learning`

#### Scenario: A returning learner still sees the landing
- **WHEN** a device with a continue-watching record opens the home
- **THEN** the editorial hero renders and no returning-learner content appears

#### Scenario: The hero offers one primary action
- **WHEN** the hero renders
- **THEN** it contains exactly one primary action, and the vowel-length card's controls are the only other interactive elements in it

#### Scenario: The card stacks under the action on a phone
- **WHEN** the home renders at a 390px viewport width
- **THEN** the vowel-length card renders below the primary action and the page does not scroll horizontally

### Requirement: The home answers the questions learners ask first

In the new-visitor state the home SHALL render a localized section of three numbered
questions with their answers, covering why the course starts with sounds, how it fits into
a few minutes a day, and whether it works on a phone.

#### Scenario: Three questions render in order
- **WHEN** the new-visitor home renders
- **THEN** the questions section shows three numbered questions, each with its answer, in the active locale

### Requirement: The home lists every catalog course as a row of an ordered levels table

The home SHALL render an `Available courses` section whose heading states how many levels
there are, followed by one row per catalog course in ascending `Course.sequence` order. No
course SHALL be dropped.

Each row SHALL show the course's localized level ordinal (`Level {number}`), its title, its
description, its lesson and video counts, and one link to the course overview for the
active locale.

When the catalog is empty the section SHALL be replaced by a localized empty state.

#### Scenario: Every catalog course gets a row
- **WHEN** the catalog resolves two courses
- **THEN** the levels table renders two rows in ascending `sequence` order, each linking to its own course overview

#### Scenario: Ordering is data, not arrival order
- **WHEN** the repository returns courses in an order that does not match their `sequence`
- **THEN** the rows still render in ascending `sequence` order

#### Scenario: Empty catalog degrades gracefully
- **WHEN** the catalog returns no entries
- **THEN** the home shows a localized empty state instead of an empty table

#### Scenario: Levels copy is localized
- **WHEN** the locale is `es`
- **THEN** the section heading, the ordinals, the counts and the row links render from `es.json`

### Requirement: The new-visitor home closes by repeating its primary action

The home SHALL end its content with a band that repeats the hero's primary action to the same
destination.

On a device without a learner profile — and before the profile is known — the band SHALL restate the
offer in localized copy sized by the first lesson's runtime.

On a device with a learner profile the offer no longer fits what the action does, so the band SHALL
instead greet the learner by first name with localized copy inviting them to pick up where they left off,
show their learner card with its progress through the first course, and offer **Continue**.

#### Scenario: The band repeats the hero's destination
- **WHEN** the home renders
- **THEN** the closing band's action links to the same destination as the hero's action

#### Scenario: An onboarded learner sees their card in the closing band
- **WHEN** the home renders on a device with a learner profile named `Ana García`
- **THEN** after hydration the band reads `Pick up where you left off, Ana.`, shows the learner card, offers Continue, and no longer states the first lesson's runtime


## MODIFIED Requirements

### Requirement: Global header shows brand and section chrome

The locale layout SHALL render an Immersion Cinema header containing the `LEARN·ENGLISH` wordmark, a section eyebrow of the form `IMMERSION CINEMA · <SECTION>` where `<SECTION>` derives from the current route (`HOME`, `COURSE`, `MODULE`, `LESSON`), and the existing locale switcher and theme toggle re-styled as chips. The header SHALL remain a landmark, keep locale switching and theme toggling functional, and be localized.

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
- **THEN** the `LEARN·ENGLISH` wordmark is still present and still links to the locale home

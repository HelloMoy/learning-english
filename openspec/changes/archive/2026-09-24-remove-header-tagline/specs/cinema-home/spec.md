## MODIFIED Requirements

### Requirement: Global header shows brand and section chrome

The locale layout SHALL render an Immersion Cinema header containing the `ENGLISH·COURSE` wordmark, a section eyebrow that reads the current section alone — `HOME`, `COURSE`, `MODULE`, `LESSON`, `START`, `MY LEARNING`, `ACHIEVEMENTS` or `PROFILE`, derived from the current route — and the existing locale switcher and theme toggle re-styled as chips. The eyebrow SHALL NOT carry a brand tagline or any prefix before the section: the wordmark already names the product, and the eyebrow's only job is to say where the learner is. The header SHALL remain a landmark, keep locale switching and theme toggling functional, and be localized.

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
- **THEN** the header eyebrow reads `HOME`; on a lesson route it reads `LESSON`; on `/learning` it reads `MY LEARNING`

#### Scenario: Section label names the Achievements route
- **WHEN** the user is on `/en/achievements`
- **THEN** the header eyebrow reads `ACHIEVEMENTS`

#### Scenario: Eyebrow carries no tagline
- **WHEN** the header renders on any route in any locale
- **THEN** the eyebrow text is exactly the localized section name, with no brand tagline and no `·` separator before it
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


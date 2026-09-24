# Delta: cinema-home — theme control leaves the header

## MODIFIED Requirements

### Requirement: Global header shows brand and section chrome

The locale layout SHALL render an Immersion Cinema header containing the `ENGLISH·COURSE` wordmark, a section eyebrow of the form `IMMERSION CINEMA · <SECTION>` where `<SECTION>` derives from the current route (`HOME`, `COURSE`, `MODULE`, `LESSON`, `START`, `MY LEARNING`, `ACHIEVEMENTS`, `PROFILE`), and the existing locale switcher re-styled as a chip. The header SHALL remain a landmark, keep locale switching functional, and be localized.

The header SHALL NOT render a theme control at any viewport width or session state, and the avatar menu SHALL NOT offer a theme item. The theme is changed only from the Profile page's Preferences section (see the `profile-page` capability); the header offers a path there through the avatar menu's **Profile** link.

The wordmark SHALL be a link whose destination depends on the session the request carries, because "back to the start" means a different page either side of signing in. Without a session it SHALL link to the locale home (`/[locale]`), which is where a visitor is being sold the course. With a session it SHALL link to My learning (`/[locale]/learning`), the signed-in learner's own first page; the marketing home has nothing left to tell them. Both destinations SHALL be resolved through the locale-aware navigation wrappers, so the active locale is preserved.

The destination SHALL follow the same server-decided session flag that chooses between the **Sign in** link and the learner's menu, so the wordmark and the account control never disagree about whether there is a session.

When the device holds a learner profile, the header SHALL additionally render the learner's avatar as a menu trigger whose accessible name includes the learner's name, opening a menu with **My learning**, **Achievements** and **Profile** links, in that order, for the active locale. Without a profile, and before the profile is known, the trigger SHALL NOT render.

The wordmark SHALL read `ENGLISH·COURSE` in every supported locale. It is a brand mark, not copy: it is not translated, and it names the same product the site publishes to the outside world through its metadata, so a learner reads one name in the header, the browser tab and a shared link preview.

The header SHALL fit within the viewport at every phone-class viewport width in every supported locale, rather than forcing the document to scroll horizontally. Its contents are not all equally load-bearing, so it sheds them in a fixed order as width runs out:

1. The section eyebrow is the first to go — it restates information the page's own heading already carries.
2. The locale control's supporting text goes next: it shows the active locale's short code (`EN`, `ES`, `PT`) in place of its full name. Whatever visible text the control drops SHALL NOT change what assistive technology announces — its accessible name SHALL name the full concept (`Language: English`) at every width, and SHALL NOT be derived from the abbreviated visible text.
3. The wordmark is never dropped; it is the header's identity and its way back to the learner's starting page.

The locale control SHALL present the active locale as visible text at every width, so a learner can always see which language they are in without opening anything. Its width SHALL be governed by the label it currently displays rather than by the longest label it could display — a native `<select>`, whose rendered width is set by its widest `<option>`, cannot satisfy this and SHALL NOT be used.

At every width the locale control and the avatar trigger SHALL remain fully within the viewport and operable. On touch-sized viewports each SHALL present a hit area of at least 44×44 CSS pixels, which may extend beyond its visible chip.

#### Scenario: Section label reflects the route
- **WHEN** the user is on the locale home
- **THEN** the header eyebrow reads `IMMERSION CINEMA · HOME`; on a lesson route it reads `IMMERSION CINEMA · LESSON`; on `/learning` it reads `IMMERSION CINEMA · MY LEARNING`

#### Scenario: Section label names the Achievements route
- **WHEN** the user is on `/en/achievements`
- **THEN** the header eyebrow reads `IMMERSION CINEMA · ACHIEVEMENTS`

#### Scenario: The locale control remains functional
- **WHEN** the header renders with the chip-styled locale control
- **THEN** changing the locale behaves exactly as before the re-skin

#### Scenario: The header offers no theme control
- **WHEN** the header renders at any viewport width, with or without a session, with or without a learner profile
- **THEN** no theme toggle renders in the header row, and opening the avatar menu offers no theme item — the theme is changed from the Profile page

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

#### Scenario: No profile, no avatar trigger
- **WHEN** the header renders on a device without a learner profile
- **THEN** no avatar trigger renders

#### Scenario: The header fits the narrowest phone in every locale
- **WHEN** the header renders at a 320px viewport width in `en`, `es`, or `pt`, with or without a learner profile
- **THEN** it fits within the viewport and contributes no horizontal document scroll

#### Scenario: The locale control sheds visible text but keeps its accessible name
- **WHEN** the header renders at a phone-class width, showing `ES` in place of `Español`
- **THEN** the locale control still exposes the same accessible name it exposes at desktop widths — `Language: Spanish` — so a screen reader announces the full concept rather than the abbreviation

#### Scenario: The active language is always visible
- **WHEN** the header renders at any width
- **THEN** the locale control displays the active locale as text — its short code on a phone, its full name from `sm` up — without the learner having to open the menu

#### Scenario: Choosing a language from the menu switches locale
- **WHEN** the learner opens the locale control and chooses a different language
- **THEN** they navigate to the same path under the chosen locale, exactly as the previous `<select>` did

#### Scenario: The locale menu is operable by keyboard
- **WHEN** a keyboard user opens the locale control, moves through the options with the arrow keys, and confirms one
- **THEN** the locale changes, and when the menu closes focus returns to the control that opened it

#### Scenario: The locale control stays operable on a phone
- **WHEN** a learner on a 320px viewport reaches for the locale switcher
- **THEN** it is fully on screen and offers a hit area of at least 44×44 CSS pixels

#### Scenario: The wordmark survives the narrowest width
- **WHEN** the header renders at a 320px viewport width
- **THEN** the `ENGLISH·COURSE` wordmark is still present, is not clipped, and still links to its session-dependent destination

#### Scenario: The wordmark reads the same in every locale
- **WHEN** the header renders under `en`, `es` or `pt`
- **THEN** the wordmark reads `ENGLISH·COURSE` in all three, because the brand mark is not translated copy

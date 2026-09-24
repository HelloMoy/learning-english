## MODIFIED Requirements

### Requirement: Global header shows brand and section chrome

The locale layout SHALL render an Immersion Cinema header containing the `ENGLISH·COURSE` wordmark, a section eyebrow that reads the current section alone — `HOME`, `COURSE`, `MODULE`, `LESSON`, `START`, `MY LEARNING`, `ACHIEVEMENTS` or `PROFILE`, derived from the current route — and the existing locale switcher re-styled as a chip. The eyebrow SHALL NOT carry a brand tagline or any prefix before the section: the wordmark already names the product, and the eyebrow's only job is to say where the learner is. The header SHALL remain a landmark, keep locale switching functional, and be localized.

The header SHALL NOT render a theme control at any viewport width or session state, and the avatar menu SHALL NOT offer a theme item. The theme is changed only from the Profile page's Preferences section (see the `profile-page` capability); the header offers a path there through the avatar menu's **Profile** link.

The wordmark SHALL be a link whose destination depends on the session the request carries, because "back to the start" means a different page either side of signing in. Without a session it SHALL link to the locale home (`/[locale]`), which is where a visitor is being sold the course. With a session it SHALL link to My learning (`/[locale]/learning`), the signed-in learner's own first page; the marketing home has nothing left to tell them. Both destinations SHALL be resolved through the locale-aware navigation wrappers, so the active locale is preserved.

The destination SHALL follow the same server-decided session flag that chooses between the **Sign in** link and the learner's menu, so the wordmark and the account control never disagree about whether there is a session.

When the device holds a learner profile, the header SHALL additionally render the learner's avatar as a menu trigger whose accessible name includes the learner's name, opening a menu with **My learning**, **Achievements** and **Profile** links, in that order, for the active locale. Without a profile, and before the profile is known, the trigger SHALL NOT render.

The wordmark SHALL read `ENGLISH·COURSE` in every supported locale. It is a brand mark, not copy: it is not translated, and it names the same product the site publishes to the outside world through its metadata, so a learner reads one name in the header, the browser tab and a shared link preview.

The header SHALL fit within the viewport at every phone-class viewport width in every supported locale, rather than forcing the document to scroll horizontally. Its contents are not all equally load-bearing, so it sheds them in a fixed order as width runs out:

1. The section eyebrow is the first to go — it restates information the page's own heading already carries.
2. The controls' visible text goes next. The locale control shows the active locale's short code (`EN`, `ES`, `PT`) in place of its full name. The account control — the **Sign in** link without a session, the **Sign out** button with a session but no learner card — gives up its text entirely below `sm`: it renders as a 44×44 icon trigger that opens a menu holding that same action, written out in full, in the shape the learner's avatar menu already uses. Without a session that menu SHALL also offer **Create account**, after **Sign in**, which navigates to the sign-up route for the active locale: the menu costs the row no width for a second item, and a newcomer on a phone otherwise has no path to an account from the header. From `sm` up both controls render their full text as before. Whatever a control drops SHALL NOT change what assistive technology announces — each control's accessible name SHALL name the full concept (`Language: English`; an account menu that names itself as such) at every width, and SHALL NOT be derived from abbreviated visible text.
3. The wordmark is never dropped or clipped; it is the header's identity and its way back to the learner's starting page.

The locale control SHALL present the active locale as visible text at every width, so a learner can always see which language they are in without opening anything. Its width SHALL be governed by the label it currently displays rather than by the longest label it could display — a native `<select>`, whose rendered width is set by its widest `<option>`, cannot satisfy this and SHALL NOT be used.

At every width the locale control, the account control and the avatar trigger SHALL remain fully within the viewport and operable. On touch-sized viewports each SHALL present a hit area of at least 44×44 CSS pixels, which may extend beyond its visible text.

#### Scenario: Section label reflects the route
- **WHEN** the user is on the locale home
- **THEN** the header eyebrow reads `HOME`; on a lesson route it reads `LESSON`; on `/learning` it reads `MY LEARNING`

#### Scenario: Section label names the Achievements route
- **WHEN** the user is on `/en/achievements`
- **THEN** the header eyebrow reads `ACHIEVEMENTS`

#### Scenario: Eyebrow carries no tagline
- **WHEN** the header renders on any route in any locale
- **THEN** the eyebrow text is exactly the localized section name, with no brand tagline and no `·` separator before it

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

#### Scenario: On a phone the account control is an icon that opens a menu
- **WHEN** the header renders at a phone-class width for a visitor without a session
- **THEN** no Sign in text renders in the header row; an account icon trigger of at least 44×44 CSS pixels renders in its place, and activating it opens a menu offering **Sign in**, which navigates to the sign-in route for the active locale

#### Scenario: On a phone the signed-out account menu also offers Create account
- **WHEN** a visitor without a session opens the phone account trigger
- **THEN** the menu offers exactly two items, **Sign in** then **Create account**, and **Create account** navigates to the sign-up route for the active locale — `/es/sign-up` under `es`

#### Scenario: The same trigger serves a session with no learner card
- **WHEN** the header renders at a phone-class width for a request that carries a session on a device with no learner card
- **THEN** the same account icon trigger renders, and its menu offers **Sign out** alone, with neither Sign in nor Create account

#### Scenario: The account control keeps its desktop form
- **WHEN** the header renders from `sm` up for a visitor without a session
- **THEN** the **Sign in** link renders with its full label, exactly as it did before the phone trigger existed, and neither the icon trigger nor a Create account link is shown

#### Scenario: The trigger names itself as a menu, not as the action
- **WHEN** assistive technology reads the phone account trigger
- **THEN** its accessible name identifies it as the account menu rather than claiming to be Sign in, and the action's own name is carried by the menu item, which is also its visible text

#### Scenario: A signed-out visitor still reads the whole wordmark
- **WHEN** the header renders at a 320px viewport width for a visitor without a session, in `en`, `es` or `pt`
- **THEN** the `ENGLISH·COURSE` wordmark is rendered whole rather than clipped, alongside the locale chip and the Sign in control

#### Scenario: A session without a learner card does not clip the wordmark either
- **WHEN** the header renders at a 320px viewport width for a request that carries a session on a device with no learner card, so the Sign out button takes the account control's place
- **THEN** the wordmark is rendered whole rather than clipped

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

## Why

The Profile page repeats itself and runs long. The learner's name appears three times on the first
screen (the `h1`, the card and the name field), the progress appears twice (the card's own line and a
separate panel with its own ring), and the change-password and change-email forms stay open, so about
half of the page is empty fields most learners never use. On a phone the card scrolls away before the
avatar picker is reached, so the live preview the page promises is off screen while it is being used.

The design study "Estudios del Perfil" compared five layouts; the recommended one keeps every existing
capability and fixes these problems by rearranging, not by adding features.

## What Changes

- The page's `h1` becomes the localized title **Your profile** instead of the learner's stored name.
  The card is where the name lives. **BREAKING** for anything that finds the page by the learner's
  name as its heading (one e2e check does).
- On a wide viewport the page becomes two columns: the learner card on the left, held in view while
  the page scrolls, and the sections on the right. On a narrow viewport the card comes first and the
  sections follow, as today.
- The separate progress panel and its ring are removed. The card's footer gains a progress bar at the
  completed share, and the tickets and prizes counts move under the card as two ticket-shaped stubs.
- Save and Discard sit under the card on a wide viewport, next to what they save. On a narrow viewport
  they stay in the bar docked to the bottom of the viewport.
- Sections are renamed and reordered: **Your card** (was Identity), **Sign-in and security** (was
  Account), **Preferences**, **Delete account**.
- The email address and the password each become a row that shows the current value and opens its
  change form on demand. Both rows start closed. A Google-only account keeps its plain address row and
  the note that Google manages it.
- The delete-account section is drawn as a bordered, destructive-tinted panel so it reads as a danger
  zone. The confirmation dialog is unchanged.

## Non-goals

- No change to the theme control. The app deliberately has only light and dark
  (`enableSystem={false}`), and the Preferences row keeps using the header's `ThemeToggle`.
- No change to what saving, changing the password, changing the email or deleting the account do,
  nor to their server calls, validation or messages.
- No change to the learner card anywhere except the Profile page: the progress bar is opt-in.
- No "continue" call to action, streaks or distinction track on this page.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `profile-page`: the opening band becomes a card column (bar in the card, ticket stubs, no ring
  panel); the `h1` becomes a localized title; sections are renamed and reordered; the save controls
  move under the card on wide viewports; the email and password forms open from collapsed rows; the
  delete section becomes a danger panel.

## Impact

- `src/components/profile-view/`, `profile-card-band/`, `profile-save-bar/`, `account-section/`,
  `learner-card/` (opt-in bar), `profile-section/`, plus one new component for the collapsible
  account row.
- `src/messages/{en,es,pt}.json`: `Profile.title`, renamed section headings, and the row labels.
- Stories and unit tests for each touched component.
- `e2e/account-identity.spec.ts` and `e2e/account-deletion.spec.ts`, which open the forms and find
  the page by its heading.

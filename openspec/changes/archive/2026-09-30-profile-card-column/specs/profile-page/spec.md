## MODIFIED Requirements

### Requirement: The Profile page opens with the learner's card and their progress

The Profile page SHALL hold the large learner card in a column of its own. On a wide viewport that
column SHALL sit to the left of the page's sections and SHALL stay in view while the sections scroll;
on a narrow viewport it SHALL come before the sections, in the same vertical order.

The card's footer SHALL carry the card level's progress once: the completed-of-total video count and,
under it, a bar filled to the completed share. The page SHALL NOT show a second progress panel or a
progress ring beside the card.

Under the card, the column SHALL show two ticket-shaped counts: the tickets the learner has earned
and the prizes they have claimed, across the whole catalog. Each count SHALL be a link to the
Achievements page (`/[locale]/achievements`), where those tickets are spent and those prizes live,
named by its count and label, and SHALL show that it is interactive on hover and keyboard focus.

Until the page knows this learner's progress, the bar and both counts SHALL show their zero state
rather than a figure they would have to correct, and SHALL NOT shift the layout when the figures
arrive.

Every string SHALL come from `Profile.progress.*` and `Components.LearnerCard.*` in `en`, `es` and
`pt`.

#### Scenario: The column names the progress
- **WHEN** a learner who has finished 12 of the level's 48 videos opens `/en/profile`
- **THEN** the card's footer shows `12 of 48 videos` and a bar filled to a quarter, and under the card
  the column shows the tickets earned and the prizes claimed

#### Scenario: The counts lead to the prizes
- **WHEN** the learner on `/en/profile` activates the tickets count or the prizes count
- **THEN** they land on `/en/achievements`

#### Scenario: Progress appears once
- **WHEN** `/en/profile` renders
- **THEN** there is no progress ring on the page and the completed-of-total count appears only in the
  card

#### Scenario: A learner with nothing watched
- **WHEN** a learner who has watched nothing opens `/en/profile`
- **THEN** the bar is empty, the card shows `0 of 48 videos`, both counts are `0`, and the page does
  not shift once progress is read

#### Scenario: The card stays in view on a wide viewport
- **WHEN** a learner on a wide viewport scrolls down to the avatar picker
- **THEN** the card is still visible beside it

#### Scenario: The counts in Portuguese
- **WHEN** `/pt/profile` renders
- **THEN** the counts' labels render from `pt.json`

### Requirement: The Profile page groups its content into named sections

Beside the card column the Profile page SHALL present its content as sections, each under a heading of
its own, in this order: **Your card** (the name field and the avatar picker), **Sign-in and security**,
**Preferences**, and **Delete account**. Each heading SHALL be a level-2 heading, so the page's
headings read as an outline under the page's `h1`.

The page's `h1` SHALL be the localized title **Your profile**, with the eyebrow naming the page and one
line under it saying what the page holds. The learner's name SHALL appear on the card and in the name
field, not in the `h1`.

#### Scenario: The page reads as an outline
- **WHEN** a learner named `Ana García` opens `/en/profile`
- **THEN** the page's only `h1` is `Your profile`, and the level-2 headings are Your card, Sign-in and
  security, Preferences and Delete account, in that order

#### Scenario: The sections in Portuguese
- **WHEN** `/pt/profile` renders
- **THEN** the eyebrow, the `h1`, the intro line and every section heading render from `pt.json`

### Requirement: The Profile page sets the interface language and the theme

The Profile page SHALL hold a **Preferences** section, between the Sign-in and security section and
the delete-account section, that offers the interface language and the theme. Both SHALL use the same
controls the site header uses, so a choice made here and a choice made there behave identically, and
each SHALL be labelled with what it changes.

Changing the language SHALL navigate to the same page in the chosen locale. Changing the theme SHALL
apply it immediately.

Every string SHALL come from `Profile.preferences.*` in `en`, `es` and `pt`.

#### Scenario: Changing the language keeps the page
- **WHEN** a learner on `/en/profile` chooses Spanish in the Preferences section
- **THEN** the page becomes `/es/profile`

#### Scenario: Changing the theme applies at once
- **WHEN** a learner chooses the light theme in the Preferences section
- **THEN** the page renders in the light theme without a reload

#### Scenario: The section in Portuguese
- **WHEN** `/pt/profile` renders
- **THEN** the section's heading and both labels render from `pt.json`

### Requirement: The Profile page edits name and avatar with a live card

The route `/[locale]/profile` SHALL render the name field and the avatar picker in its **Your card**
section, and the learner card in the card column, as a live preview with the learner's progress. Every
edit SHALL update the card immediately without saving. After hydration the route SHALL replace itself
with `/[locale]/start` when no profile exists.

The card SHALL NOT be labelled as a preview: it is the card itself, and the Your card section SHALL say
that what is typed there appears on it.

#### Scenario: Editing updates the card only
- **WHEN** the learner changes the name to `Ana María López`
- **THEN** the card shows `Ana María López`, the `h1` still reads `Your profile`, and the stored profile
  is unchanged

#### Scenario: No profile sends the learner to onboarding
- **WHEN** a device without a profile opens `/en/profile`
- **THEN** it lands on `/en/start`

### Requirement: Saving and discarding are explicit

Save and Discard SHALL live in a save bar that exists only while the edited name or avatar differs
from the stored profile. With nothing edited there SHALL be no bar and no disabled buttons. On a wide
viewport the bar SHALL sit in the card column, directly under the card and its counts, so it stays in
view beside whatever section is being edited. On a narrow viewport it SHALL be docked to the bottom
edge of the viewport, above the page's content. There SHALL be one bar, never both at once.

**Save** SHALL be unavailable while the trimmed name is empty or a save is in flight. Pressing Save
SHALL store the edited profile; the bar's controls SHALL then give way to a localized confirmation,
announced as a status, which stays in the bar until the next edit raises the controls again.
**Discard** SHALL restore the field, the picker and the card to the stored profile, which takes the
bar away at once.

The bar SHALL say that there are unsaved changes, so it is never a pair of buttons with no
explanation.

#### Scenario: No bar until something changes
- **WHEN** the Profile page opens and nothing has been edited
- **THEN** there is no save bar, and neither Save nor Discard is on the page

#### Scenario: Editing raises the bar
- **WHEN** the learner types a different name
- **THEN** exactly one bar appears, says there are unsaved changes, and offers Discard and Save

#### Scenario: The bar sits under the card on a wide viewport
- **WHEN** the learner edits the name on a wide viewport
- **THEN** the bar appears in the card column under the card, not docked to the viewport's edge

#### Scenario: The bar docks on a phone
- **WHEN** the learner edits the name on a narrow viewport
- **THEN** the bar appears docked to the bottom edge of the viewport

#### Scenario: Saving confirms and persists
- **WHEN** the learner picks `Plum` and presses Save
- **THEN** the profile's avatar becomes Plum, the bar carries the announced confirmation instead of
  its controls, and the header shows the Plum avatar

#### Scenario: A blank name cannot be saved
- **WHEN** the learner clears the name field
- **THEN** the bar is there and Save is unavailable

#### Scenario: Discarding restores the stored profile
- **WHEN** the learner edits the name and presses Discard
- **THEN** the field and the card show the stored name again and the bar leaves

### Requirement: Profile copy is localized

Every string on the Profile page SHALL come from the active locale's messages in `en`, `es` and `pt`,
including the `h1`.

The learner's own name is not one of those strings: the card and the name field print the name as
stored, in every locale.

#### Scenario: Profile in Portuguese
- **WHEN** `/pt/profile` renders
- **THEN** the eyebrow, the `h1`, the intro line, every section heading, the row labels, Discard, Save
  and the confirmation render from `pt.json`, and the card shows the learner's own name

### Requirement: The Profile page offers to delete the account behind a confirmation

The Profile page SHALL end with a "Delete account" section, the last of the page's sections, drawn as
a panel set apart from the sections above it by a destructive-tinted border and ground, holding a line
that says what deletion removes and a destructive-styled button. Activating it SHALL open a dialog
that names what will be deleted (progress, tickets, prizes and the learner card), says the deletion
cannot be undone, and says a confirmation email will be sent. The dialog SHALL offer Cancel, focused
by default, and a destructive "Send confirmation email". Confirming SHALL request deletion, close the
dialog and show in the section, announced as a status, that an email was sent to the learner's
address. A refused request SHALL show a localized error in the section.

The section SHALL NOT sit next to the save bar's controls: on a wide viewport the bar lives in the
card column, and on a narrow one it is docked to the viewport while the section ends the page's
content.

Every string SHALL come from `Profile.deleteAccount.*` in `en`, `es` and `pt`.

#### Scenario: The section reads as a danger zone
- **WHEN** `/en/profile` renders
- **THEN** the Delete account section is the last section and is drawn as a bordered panel apart from
  the sections above it

#### Scenario: Cancel is the safe default
- **WHEN** the learner opens the delete dialog
- **THEN** focus is on Cancel, and pressing Enter closes the dialog without sending anything

#### Scenario: Confirming reports the email
- **WHEN** the learner confirms in the dialog
- **THEN** the dialog closes and the section announces that a confirmation email was sent to their address

#### Scenario: The section in Portuguese
- **WHEN** `/pt/profile` renders
- **THEN** the section heading, the button and the dialog copy render from `pt.json`

### Requirement: The Profile page names the address and the sign-in methods

The Profile page SHALL hold a **Sign-in and security** section, between the Your card section and the
Preferences section, that names the email address the learner's account is registered with and how
they sign in: with an email and a password, with Google, or with both. The address SHALL come from the
server's session, so the page never guesses it, and it SHALL be rendered as text rather than in a
field the learner might mistake for an editable one.

For a learner whose account has a password, the address and the password SHALL each be a row naming
what it holds (the address, or a masked password) with a control to change it. Each row SHALL start
closed; opening it SHALL reveal its change form in place, and the control SHALL expose whether the row
is open. Closing a row SHALL keep what was typed in its form.

A learner whose only sign-in method is Google SHALL be told, in that section, that their address is
managed by Google, SHALL see the address as a plain row with nothing to open, and SHALL be offered
neither the change-password form nor the change-email form.

Every string SHALL come from `Profile.account.*` in `en`, `es` and `pt`.

#### Scenario: The section names the address
- **WHEN** a learner registered as `ana@example.com` opens `/en/profile`
- **THEN** the Sign-in and security section shows `ana@example.com` and says they sign in with an
  email and a password

#### Scenario: The forms start closed
- **WHEN** a learner with a password opens `/en/profile`
- **THEN** the address row and the password row are closed, their controls say they are collapsed,
  and no password or new-address field is shown

#### Scenario: Opening a row reveals its form
- **WHEN** the learner opens the password row
- **THEN** the change-password form appears under it and the row's control says it is expanded

#### Scenario: A Google account is named as such
- **WHEN** a learner who only ever signed in with Google opens `/en/profile`
- **THEN** the section shows their Google address, says the address is managed by Google, and shows no
  row to open and no password or email form

#### Scenario: A linked account names both methods
- **WHEN** a learner who has both a password and a linked Google account opens `/en/profile`
- **THEN** the section says they sign in both ways, and both rows are offered

#### Scenario: The section in Portuguese
- **WHEN** `/pt/profile` renders
- **THEN** the section's heading, row labels, the change control and the method names render from
  `pt.json`

### Requirement: The Profile page changes the password behind the current one

For a learner whose account has a password, the password row of the Sign-in and security section SHALL
open to a change-password form with two labelled fields — the current password and the new one — and a
submit action. Both fields SHALL be password inputs with the autocomplete the browser expects
(`current-password` and `new-password`). The new password's rule SHALL be stated under its field.
Submitting SHALL validate the length in the browser first, then ask the server, as the
`learner-account` capability's "A learner changes their password from a signed-in session" defines.

A successful change SHALL clear both fields and announce, as a status, that the password changed and
that other devices were signed out. A refusal SHALL be shown as an alert in the form, and the fields
SHALL keep what the learner typed. The submit action SHALL be unavailable while a request is in flight.

Every string SHALL come from `Profile.password.*` in `en`, `es` and `pt`.

#### Scenario: Changing the password confirms and clears
- **WHEN** the learner opens the password row and submits the correct current password and a valid
  new one
- **THEN** both fields are empty and the form announces that the password changed and other devices
  were signed out

#### Scenario: A refusal keeps what was typed
- **WHEN** the current password is wrong
- **THEN** the form shows the localized refusal as an alert and both fields still hold what the
  learner typed

#### Scenario: The form in Portuguese
- **WHEN** `/pt/profile` renders and the password row is opened
- **THEN** the form's heading, both labels, the rule and the button render from `pt.json`

### Requirement: The Profile page changes the email address behind a confirmation

For a learner whose account has a password, the address row of the Sign-in and security section SHALL
open to a change-email form with one labelled field for the new address and a submit action, and SHALL
say before submitting that a link will go to the address on file first. Submitting SHALL validate the
address in the browser, then ask the server, as the `learner-account` capability's "A learner changes
their email address by confirming on the old address and verifying on the new one" defines.

An accepted request SHALL replace the form with a confirmation, announced as a status, that names the
address the link was sent to — the one on file, not the requested one — and says the address does not
change until both links are followed. A refusal SHALL be shown as an alert, and the field SHALL keep what
the learner typed.

Every string SHALL come from `Profile.email.*` in `en`, `es` and `pt`.

#### Scenario: The confirmation names the address on file
- **WHEN** a learner registered as `ana@example.com` opens the address row and submits
  `ana.g@example.com`
- **THEN** the form announces that a link was sent to `ana@example.com` and that the address changes
  only after both links are followed

#### Scenario: An invalid address is refused before submitting
- **WHEN** the field holds `not-an-address`
- **THEN** the form shows the address error and sends nothing

#### Scenario: The form in Portuguese
- **WHEN** `/pt/profile` renders and the address row is opened
- **THEN** the form's heading, label, the note about the link, the button and the confirmation render
  from `pt.json`

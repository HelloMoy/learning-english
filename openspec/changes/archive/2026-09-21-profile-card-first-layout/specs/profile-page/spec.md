## ADDED Requirements

### Requirement: The Profile page opens with the learner's card and their progress

The Profile page SHALL open with a band holding the large learner card and, beside it, a progress
panel for the card's level. The panel SHALL show the completed share as a ring labelled with its
percentage, the completed-of-total video count, a bar at the same share, and two counts: the tickets
the learner has earned and the prizes they have claimed, across the whole catalog.

On a wide viewport the card and the panel SHALL sit side by side; on a narrow one the panel SHALL
follow the card in the same vertical order.

Until the page knows this learner's progress, the panel SHALL show its zero state rather than a
figure it would have to correct — the same rule the card's own progress line already follows — and
SHALL NOT shift the layout when the figures arrive.

Every string SHALL come from `Profile.progress.*` in `en`, `es` and `pt`.

#### Scenario: The panel names the progress
- **WHEN** a learner who has finished 12 of the level's 48 videos opens `/en/profile`
- **THEN** the band shows the card, a ring labelled `25%`, `12 of 48 videos`, and the counts of
  tickets earned and prizes claimed

#### Scenario: A learner with nothing watched
- **WHEN** a learner who has watched nothing opens `/en/profile`
- **THEN** the panel shows `0%`, `0 of 48 videos`, no tickets and no prizes, and the page does not
  shift once progress is read

#### Scenario: The panel in Portuguese
- **WHEN** `/pt/profile` renders
- **THEN** the panel's labels and counts render from `pt.json`

### Requirement: The Profile page groups its content into named sections

Below the card band the Profile page SHALL present its content as a single column of sections, each
under a heading of its own, in this order: **Identity** (the name field and the avatar picker),
**Account**, **Preferences**, and **Delete account**. Each heading SHALL be a level-2 heading, so the
page's headings read as an outline under the page's `h1`.

The page's `h1` SHALL be the learner's name, with the eyebrow naming the page, and one line under it
saying what the page holds.

#### Scenario: The page reads as an outline
- **WHEN** a learner named `Ana García` opens `/en/profile`
- **THEN** the page's only `h1` is `Ana García`, and the level-2 headings are Identity, Account,
  Preferences and Delete account, in that order

#### Scenario: The sections in Portuguese
- **WHEN** `/pt/profile` renders
- **THEN** the eyebrow, the intro line and every section heading render from `pt.json`

### Requirement: The Profile page sets the interface language and the theme

The Profile page SHALL hold a **Preferences** section, between the Account section and the
delete-account section, that offers the interface language and the theme. Both SHALL use the same
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

## MODIFIED Requirements

### Requirement: Profile copy is localized

Every string on the Profile page SHALL come from the active locale's messages in `en`, `es` and `pt`.

The learner's own name is not one of those strings: the page's `h1` prints the name as stored, in
every locale.

#### Scenario: Profile in Portuguese
- **WHEN** `/pt/profile` renders
- **THEN** the eyebrow, the intro line, every section heading, Discard, Save and the confirmation
  render from `pt.json`, and the `h1` is the learner's own name

### Requirement: The Profile page edits name and avatar with a live card

The route `/[locale]/profile` SHALL render the name field and the avatar picker in its **Identity**
section, and the learner card in the band that opens the page, as a live preview with the learner's
progress label. Every edit SHALL update the card immediately without saving. After hydration the
route SHALL replace itself with `/[locale]/start` when no profile exists.

The card SHALL NOT be labelled as a preview: it is the card itself, and the Identity section SHALL
say that what is typed there appears on it.

#### Scenario: Editing updates the card only
- **WHEN** the learner changes the name to `Ana María López`
- **THEN** the card at the top of the page shows `Ana María López` and the stored profile is unchanged

#### Scenario: No profile sends the learner to onboarding
- **WHEN** a device without a profile opens `/en/profile`
- **THEN** it lands on `/en/start`

### Requirement: Saving and discarding are explicit

Save and Discard SHALL live in a bar docked to the bottom edge of the viewport, above the page's
content, which SHALL exist only while the edited name or avatar differs from the stored profile. With
nothing edited there SHALL be no bar and no disabled buttons.

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
- **THEN** the bar appears, says there are unsaved changes, and offers Discard and Save

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

### Requirement: The Profile page offers to delete the account behind a confirmation

The Profile page SHALL end with a "Delete account" section, the last of the page's sections, set
apart from and quieter than the sections above it, holding a destructive-styled button. Activating it
SHALL open a dialog that names what will be deleted (progress, tickets, prizes and the learner card),
says the deletion cannot be undone, and says a confirmation email will be sent. The dialog SHALL offer
Cancel, focused by default, and a destructive "Send confirmation email". Confirming SHALL request
deletion, close the dialog and show in the section, announced as a status, that an email was sent to
the learner's address. A refused request SHALL show a localized error in the section.

The section SHALL NOT sit next to the save bar's controls: the bar is docked to the viewport and the
section is the end of the page's content.

Every string SHALL come from `Profile.deleteAccount.*` in `en`, `es` and `pt`.

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

The Profile page SHALL hold an **Account** section, between the Identity section and the Preferences
section, that names the email address the learner's account is registered with and how they sign in:
with an email and a password, with Google, or with both. The address SHALL come from the server's
session, so the page never guesses it, and it SHALL be rendered as text rather than in a field the
learner might mistake for an editable one.

A learner whose only sign-in method is Google SHALL be told, in that section, that their address is
managed by Google, and SHALL be offered neither the change-password form nor the change-email form.

Every string SHALL come from `Profile.account.*` in `en`, `es` and `pt`.

#### Scenario: The section names the address
- **WHEN** a learner registered as `ana@example.com` opens `/en/profile`
- **THEN** the Account section shows `ana@example.com` and says they sign in with an email and a password

#### Scenario: A Google account is named as such
- **WHEN** a learner who only ever signed in with Google opens `/en/profile`
- **THEN** the section shows their Google address, says the address is managed by Google, and shows no password or email form

#### Scenario: A linked account names both methods
- **WHEN** a learner who has both a password and a linked Google account opens `/en/profile`
- **THEN** the section says they sign in both ways, and both forms are offered

#### Scenario: The section in Portuguese
- **WHEN** `/pt/profile` renders
- **THEN** the Account section's heading, labels and method names render from `pt.json`

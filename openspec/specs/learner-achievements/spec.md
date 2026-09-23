# learner-achievements Specification

## Purpose
TBD - created by archiving change learner-achievements. Update Purpose after archive.
## Requirements
### Requirement: A lesson earns its ticket the first time it counts as complete, and keeps it

The application SHALL treat a lesson as having earned its ticket the first time the lesson counts as
complete for the signed-in learner, decided by the same rule every progress surface uses: the lesson is marked
complete, or its saved playback position has crossed the finish threshold.

An earned ticket SHALL be stored per learner and lesson through the `EarnedTicketRepository` port and SHALL be kept from then on: un-marking the lesson SHALL
NOT take its ticket away, and completing it again SHALL NOT earn a second one. A lesson that counts as
complete SHALL read as having earned its ticket even when no ticket was stored for it, so lessons
completed before tickets were stored still count. Tickets SHALL follow the learner to every device they sign in on.

#### Scenario: Marking a lesson complete earns its ticket
- **WHEN** the learner marks `The Vowel Sound /ɪ/ (e corta)` complete
- **THEN** that lesson's ticket is earned

#### Scenario: Watching a lesson to the end earns its ticket
- **WHEN** a lesson's saved position has crossed its finish threshold and it was never marked
- **THEN** that lesson's ticket is earned

#### Scenario: Un-marking keeps the ticket
- **WHEN** the learner un-marks a lesson that had earned its ticket and whose saved position has not crossed the finish threshold
- **THEN** that lesson's ticket is still earned and its module's tickets do not drop

#### Scenario: Completing a lesson again earns no second ticket
- **WHEN** the learner un-marks a lesson that had earned its ticket and marks it complete again
- **THEN** the module's tickets are unchanged and no ticket is announced

#### Scenario: A kept ticket follows the learner
- **WHEN** the learner earns a ticket on one device, un-marks the lesson, and signs in on another device
- **THEN** the other device still counts that ticket

### Requirement: A ticket carries the lesson's sound

A ticket SHALL show the text between the first pair of slashes in the lesson title, trimmed, when that
text is not empty. Otherwise it SHALL show the lesson's position within its module, counted from 1 in
sequence order.

#### Scenario: A title naming one sound
- **WHEN** the lesson is titled `The Vowel Sound /ɪ/ (e corta)`
- **THEN** its ticket shows `ɪ`

#### Scenario: A title naming two sounds uses the first
- **WHEN** the lesson is titled `Schwa /ə/ or Strut /ʌ/ ?`
- **THEN** its ticket shows `ə`

#### Scenario: A title without a sound uses the position
- **WHEN** the fifth lesson of a module is titled `The weak-vowel merger`
- **THEN** its ticket shows `5`

### Requirement: Every module has a prize from the catalog

The application SHALL assign each module a prize by its slug from a fixed catalog of arcade toys:

| Module slug | Prize |
| --- | --- |
| `1-introduction` | whistle |
| `2-vowels` | harmonica |
| `3-consonants` | megaphone |
| `4-ejercicios-para-dominar-el-ritmo-en-ingles` | drum |
| `5-fluidez-y-velocidad` | race car |
| `1-advanced-pronunciation-course` | microphone |
| `2-advanced-vowel-pronunciation-in-american-english` | kazoo |
| `3-contractions-reductions` | spring |
| `4-key-sound-patterns-and-features` | kaleidoscope |
| `5-sound-natural-american-intonation-essentials` | yo-yo |
| `6-rules-for-speaking-fast-natural-in-english` | spinning top |
| `7-everyday-english-phrases-part-1-master-them` | walkie-talkie |
| `8-everyday-english-phrases-part-2-master-them` | tin-can phone |
| `9-speak-with-confidence-in-30-days` | crown |
| `10-the-practice-zone-sharpen-your-skills` | wind-up robot |

A module whose slug is not in the catalog SHALL receive a gift box. Each prize SHALL have a localized
name and an illustration that can be drawn in full colour or as a single-colour silhouette.

#### Scenario: Vowels redeems a harmonica
- **WHEN** the prize for the module `2-vowels` is looked up
- **THEN** it is the harmonica

#### Scenario: An unknown module still has a prize
- **WHEN** a module with the slug `11-bonus-module` is looked up
- **THEN** its prize is the gift box

### Requirement: A module's tickets ready its prize, and the learner claims it

A module SHALL be in one of four prize states:

- `claimed` — the learner has claimed the prize on the prize counter;
- `ready` — every lesson in the module has earned its ticket and the prize has not been claimed;
- `collecting` — at least one lesson has earned its ticket, and at least one has not;
- `locked` — no lesson has earned its ticket.

The claim SHALL be stored per learner and module through the `PrizeClaimRepository` port, beside the earned tickets. A claimed prize SHALL
stay claimed for good: the tickets were exchanged for it. A claim SHALL follow the learner to every device they sign in on.

A module with no lessons SHALL have no prize and SHALL NOT be counted.

#### Scenario: Every ticket readies the prize
- **WHEN** all 17 lessons of `Vowels` have earned their tickets and the prize has not been claimed
- **THEN** the `Vowels` prize is ready to claim and is not counted among the prizes redeemed

#### Scenario: A claimed prize survives an un-mark
- **WHEN** the learner has claimed the `Vowels` prize and un-marks one of its lessons
- **THEN** the `Vowels` prize is still claimed and its module still holds 17 of 17 tickets

#### Scenario: Some tickets leave the prize collecting
- **WHEN** 12 of the 17 lessons of `Vowels` have earned their tickets
- **THEN** the `Vowels` prize is collecting with 12 of 17 tickets

#### Scenario: An empty module has no prize
- **WHEN** a module holds no lessons
- **THEN** no prize is shown for it and the prize total does not include it

#### Scenario: A claim follows the learner
- **WHEN** the learner claims the `Vowels` prize on one device and opens Achievements on another
- **THEN** the `Vowels` prize is claimed there too

### Requirement: Completing courses earns a distinction

A course SHALL count as complete when it holds at least one lesson and every one of its lessons has
earned its ticket. The learner's distinction SHALL be:

- `student` while no course is complete;
- `bronze` once at least one course is complete and not every course holding lessons is;
- `gold` once every course holding lessons is complete.

The distinction SHALL follow tickets alone: claiming a prize SHALL NOT change it.

#### Scenario: A new learner is a student
- **WHEN** no course is complete
- **THEN** the distinction is `student`

#### Scenario: Finishing one of two courses earns bronze
- **WHEN** every lesson of `Basic Course` has earned its ticket and `Advanced Intermediate Course` has not
- **THEN** the distinction is `bronze`

#### Scenario: Finishing every course earns gold
- **WHEN** every lesson of every course has earned its ticket
- **THEN** the distinction is `gold`

### Requirement: Achievements is the learner's own page

The route `/[locale]/achievements` SHALL render the learner's achievements. After hydration it SHALL
replace itself with `/[locale]/start` when no profile exists. Until storage has been read it SHALL
render a placeholder of the page's shape and assert no counts.

The page SHALL NOT repeat the Profile's card editor or link to it; the avatar menu already reaches the
Profile.

#### Scenario: No profile sends the learner to onboarding
- **WHEN** a device without a profile opens `/en/achievements`
- **THEN** it lands on `/en/start`

### Requirement: The prize counter presents the learner's collection

The Achievements page SHALL show:

- the learner card with the finish and label of the learner's distinction;
- how many tickets are earned out of every lesson in the catalog, and how many prizes are claimed out
  of every module that holds lessons;
- a prize counter: for each course, in catalog order, a shelf holding every module's prize in module
  sequence order.

Each prize on a shelf SHALL show:

- when claimed, its illustration in colour, its name, and a tag reading `Redeemed`;
- when ready to claim, its silhouette, no name, and a **Claim prize** control naming its module;
- otherwise, its illustration as a silhouette, no name, and a tag reading the tickets earned out of the
  module's lessons (`12 / 17`).

Each prize SHALL be announced to assistive technology with its state in words: the prize name and that
it is claimed, that a hidden prize of the named module is ready to claim, or that a hidden prize of the
named module has the given tickets. States SHALL NOT be told apart by colour alone.

#### Scenario: Counts span the whole catalog
- **WHEN** a learner has completed the one lesson of `Introduction`, claimed its prize, and completed 12 lessons of `Vowels`
- **THEN** the page shows 13 tickets earned out of 155 and 1 prize redeemed out of 15

#### Scenario: A claimed prize is named
- **WHEN** the learner has claimed the `Introduction` prize
- **THEN** its shelf shows the whistle in colour, named, tagged `Redeemed`, with no Claim prize control

#### Scenario: A prize holding every ticket waits to be claimed
- **WHEN** `Introduction` is complete and its prize has not been claimed
- **THEN** its shelf shows a silhouette with a Claim prize control naming Introduction, and the page counts 0 prizes redeemed

#### Scenario: A prize still collecting stays hidden
- **WHEN** 12 of 17 `Vowels` lessons are complete
- **THEN** its shelf shows the harmonica's silhouette, no name, tagged `12 / 17`, and assistive technology hears that the hidden prize of Vowels has 12 of 17 tickets

#### Scenario: The card shows the distinction
- **WHEN** a learner with the `bronze` distinction opens the Achievements page
- **THEN** the learner card carries the bronze finish and the bronze label

### Requirement: The Achievements page explains how rewards are earned

The Achievements page SHALL offer a **How do they work?** action that opens a dialog. The dialog SHALL
explain, in the active locale:

- a ticket is earned by completing a lesson, and carries the lesson's sound;
- a module's tickets ready its prize, which stays hidden until the learner claims it on the counter;
- the distinction is bronze once one course is complete and gold once every course is.

It SHALL show each level beside an example drawn with the real pieces, and the prize example SHALL be a
prize the learner can recognise — not a silhouette, which is what a prize looks like when it is not
theirs yet.

The dialog SHALL be a modal dialog with an accessible name, SHALL be dismissable by its close control and
by Escape, and SHALL return focus to the action that opened it. It SHALL NOT change any progress.

#### Scenario: The explanation opens from the page
- **WHEN** the learner activates How do they work? on `/en/achievements`
- **THEN** a dialog named after how rewards work opens and describes tickets, prizes and distinctions

#### Scenario: Escape closes the explanation
- **WHEN** the dialog is open and the learner presses Escape
- **THEN** the dialog closes and focus returns to How do they work?

### Requirement: Earning a ticket is announced on the lesson page

The lesson page SHALL show a ticket notification when the lesson it shows becomes complete while the
page is open, including the completion that collects the module's last ticket. The notification SHALL
appear at the top of the viewport at every width, and SHALL show the lesson's ticket, the tickets
earned out of the module's lessons, and the module prize's silhouette.

When the learner is watching in fullscreen, the notification SHALL be drawn inside the element the
browser is presenting, so it reaches them there too.

The notification SHALL be announced as a status without taking focus, SHALL NOT block any control, and
SHALL leave on its own after about five seconds. It SHALL NOT appear when the page opens on a lesson
that was already complete, when the lesson is un-marked, or more than once for the same completion.

#### Scenario: Completing a lesson drops a ticket
- **WHEN** the learner marks `The vowel sound /i/` complete and 11 other Vowels lessons are complete
- **THEN** a ticket notification appears reading that it holds 12 of 17 tickets for the Vowels prize, and it disappears on its own

#### Scenario: Watching to the end drops a ticket too
- **WHEN** playback crosses the lesson's finish threshold and the finish rule marks it
- **THEN** the same ticket notification appears once

#### Scenario: An already complete lesson stays quiet
- **WHEN** the lesson page opens on a lesson completed on an earlier visit
- **THEN** no ticket notification appears

#### Scenario: A ticket earned in fullscreen is still seen
- **WHEN** the learner is watching in fullscreen and the lesson earns its ticket
- **THEN** the notification is drawn inside the element being presented, where the learner can see it

### Requirement: A module's last ticket sends the learner to claim the prize

When the completion collects the module's last ticket, the lesson page SHALL let the ticket
notification play and, once it has left, SHALL open a modal dialog saying a prize is waiting. The
dialog SHALL NOT reveal the prize: it SHALL show the prize's silhouette, name the module and the
tickets collected, and offer **Go and claim the prize** and **Keep learning** (closes the dialog).

**Go and claim the prize** SHALL open `/[locale]/achievements` asking for that module's prize, so the
page knows which one the learner came for.

While the learner is watching in fullscreen, the dialog SHALL wait: it SHALL NOT open until they leave
fullscreen, and it SHALL open once the browser has finished restoring the page. A dialog the learner
cannot see must never be listening for their Escape, and its entrance SHALL be seen rather than spent
behind the browser's own transition.

The dialog SHALL have an accessible name, SHALL close on Escape and on Keep learning, and SHALL return
focus to where it was. It SHALL NOT open when the page opens on a module whose tickets were already
complete.

#### Scenario: The last Vowels lesson announces a prize to claim
- **WHEN** the learner completes the 17th Vowels lesson while the other 16 are complete
- **THEN** the ticket notification appears reading 17 of 17 and, once it has left, a dialog says the Vowels prize is waiting without showing which prize it is

#### Scenario: Go and claim leads to the counter
- **WHEN** the learner activates Go and claim the prize
- **THEN** they land on `/[locale]/achievements`

#### Scenario: The last ticket in fullscreen waits for the learner
- **WHEN** the learner collects the module's last ticket while watching in fullscreen
- **THEN** no dialog opens while they are in fullscreen, and it opens once they leave it

#### Scenario: The dialog is seen arriving
- **WHEN** the learner leaves fullscreen with a prize waiting
- **THEN** the dialog opens after the page has been restored, so its entrance plays where the learner can see it

### Requirement: The counter points out the prize the learner came for

When the Achievements page is opened asking for a module's prize, it SHALL bring that prize into view,
give it focus, and point it out until the learner claims it — so they know which of the shelves' prizes
the dialog sent them to, beyond reading every Claim prize control.

The prize itself SHALL be what moves. Its Claim prize control SHALL stay where it is, so a control that
is about to be pressed never shifts under the pointer.

Pointing a prize out SHALL NOT give it the finish of a claimed prize: the coloured, gold-lit toy is what
claiming reveals, and a prize still waiting SHALL NOT wear it.

The request SHALL be dropped once the learner claims that prize, so the counter points at it for
exactly as long as it is theirs to take. A request naming a module that has no prize to claim SHALL be
ignored.

Pointing a prize out SHALL NOT be the only way to tell it apart: its Claim prize control names its
module, and the focus lands on it.

#### Scenario: Arriving from the dialog lands on the prize
- **WHEN** the learner activates Go and claim the prize for `Introduction`
- **THEN** the Achievements page brings the `Introduction` prize into view, focuses it, and the prize waves while its Claim prize control stays still

#### Scenario: Claiming stops the pointing
- **WHEN** the learner claims the prize they were pointed at
- **THEN** the counter stops pointing at it

#### Scenario: A request for a prize that is not ready is ignored
- **WHEN** the page is opened asking for a module whose tickets are not all earned
- **THEN** nothing is pointed out and the page reads as it always does

### Requirement: Claiming a prize on the counter reveals it

The prize counter SHALL offer a **Claim prize** control on every prize that is ready to claim.
Activating it SHALL record the claim on the device and open a modal dialog that reveals the prize: the
module's tickets fly into the silhouette, it shakes, flashes and turns into the coloured illustration,
naming the prize, the module and how many tickets were redeemed, with a control that closes it.

The claim SHALL be recorded even when the learner closes the dialog before the reveal ends. Once
claimed, the shelf SHALL show the prize in colour with its name, the prize SHALL count among the prizes
redeemed, and the Claim prize control SHALL NOT be offered for it again.

The dialog SHALL have an accessible name, SHALL close on Escape, and SHALL return focus to the prize it
revealed.

#### Scenario: Claiming reveals the harmonica
- **WHEN** the learner activates Claim prize on the ready `Vowels` prize
- **THEN** a dialog opens revealing the harmonica and naming Vowels and 17 tickets

#### Scenario: A claim outlives the dialog
- **WHEN** the learner closes the reveal and opens the Achievements page again
- **THEN** the `Vowels` shelf shows the harmonica in colour, tagged `Redeemed`, with no Claim prize control

### Requirement: Rewards move, and stillness is honoured

The reward surfaces SHALL animate:

- the Achievements page's header, counts and shelves SHALL rise into place in sequence, the counts
  SHALL count up to their values, a redeemed prize SHALL carry a slow gold glow and a collecting prize's
  tag SHALL sway;
- the ticket notification SHALL rise, widen from its ticket slot, drop the ticket out of the slot, and
  collapse and leave;
- a prize ready to claim SHALL draw attention to its Claim prize control, by motion and not by colour
  alone;
- the reveal dialog SHALL fly the module's tickets into the silhouette, shake it, flash, and reveal the
  coloured prize before its copy appears;
- the How do they work? dialog SHALL reveal its explanations one after another.

Every animation SHALL be decorative: the final state SHALL be the state shown without the animation, no
animation SHALL delay a control becoming operable, and assistive technology SHALL read the final values.

When `prefers-reduced-motion: reduce` is set, none of these animations SHALL run: counts show their
values, the notification appears and leaves without movement, and the dialog shows the coloured prize at
once.

#### Scenario: Counts announce their final value
- **WHEN** the page opens for a learner with 13 earned tickets
- **THEN** the count animates up to 13, and its accessible text reads 13 of 155 tickets from the start

#### Scenario: Reduced motion shows the prize at once
- **WHEN** `prefers-reduced-motion: reduce` is set and the learner claims a prize
- **THEN** the dialog shows the coloured prize and its copy with no motion

### Requirement: Reward copy is localized

Every reward string — tickets, prize names, states, notifications and dialogs — SHALL come from the
active locale's messages in `en`, `es` and `pt`, with counts written as ICU plurals.

#### Scenario: Rewards in Spanish
- **WHEN** `/es/achievements` renders for a learner with one earned ticket
- **THEN** the heading, counts, prize tags and distinction label render from `es.json` with the singular form for one ticket

### Requirement: A waiting prize is announced even if the learner moves on

When a completion collects a module's last ticket, the application SHALL record that the prize is
waiting to be announced, on the device.

While such a record exists, the application SHALL open the waiting-prize dialog at the first opportunity:
on the lesson page once the ticket notification has left, or — when the learner has gone elsewhere — on
the next page they open. It SHALL be announced once: showing the dialog SHALL clear the record, and so
SHALL claiming that prize.

A record naming a prize that is no longer waiting — because it has been claimed — SHALL be dropped
without announcing anything.

#### Scenario: Moving on before the dialog opens
- **WHEN** the learner collects the module's last ticket and opens the next lesson before the notification has left
- **THEN** the waiting-prize dialog opens on that next lesson

#### Scenario: Leaving for another section
- **WHEN** the learner goes to My learning in those seconds
- **THEN** the waiting-prize dialog opens there

#### Scenario: Announced once
- **WHEN** the dialog has been shown and the learner opens another page
- **THEN** it does not open again

#### Scenario: Claimed before it was announced
- **WHEN** the learner claims that prize on the counter without ever seeing the dialog
- **THEN** the record is dropped and no dialog opens afterwards

### Requirement: An unclaimed prize is marked wherever the learner is

While at least one prize is ready to claim, the avatar menu's Achievements item SHALL carry a mark
saying how many, and the avatar that opens the menu SHALL carry the same mark, so a closed menu still
shows it.

The mark SHALL be announced in words to assistive technology, SHALL disappear once every ready prize is
claimed, and SHALL NOT count prizes that are still collecting tickets or already claimed.

#### Scenario: One prize waiting
- **WHEN** a module's tickets are all earned and its prize is unclaimed
- **THEN** the avatar and its Achievements item are marked, and the mark says one prize is waiting

#### Scenario: Claiming clears the mark
- **WHEN** the learner claims the last unclaimed prize
- **THEN** the mark is gone

#### Scenario: Nothing waiting
- **WHEN** no module has all its tickets earned
- **THEN** nothing is marked

### Requirement: The Achievements page offers the way back into the course

The Achievements page SHALL offer an action that takes the learner back into the course, using the
device's continue-watching record to decide where.

While the record is being resolved, the action SHALL be reserved — present in the page's shape but
naming no destination — so the learner is never offered a target that changes.

The action SHALL name the course rather than the lesson, so its size does not follow the title it
carries: continuing the course when the record resolves to a lesson in the catalog, and starting the
course when there is no record or it no longer resolves — the learner is told which of the two they are
being offered, not which lesson it happens to be.

When the record resolves to a lesson in the catalog, the action SHALL open that lesson. When there is
no record, or the record no longer resolves to a lesson in the catalog, the action SHALL offer the first
lesson of the first course, so the page is never a dead end.

The action SHALL NOT navigate on the learner's behalf, and its copy SHALL be localized in `en`, `es`
and `pt`.

#### Scenario: Continuing where they left off
- **WHEN** the device's record resolves to `The schwa /ə/` and the learner opens the Achievements page
- **THEN** the page offers an action to continue the course, which opens that lesson

#### Scenario: Nothing started yet
- **WHEN** a learner who has started no lesson opens the Achievements page
- **THEN** the action offers to start the course, and opens the first lesson of the first course

#### Scenario: A record that no longer resolves
- **WHEN** the stored record names a lesson that is no longer in the catalog
- **THEN** the action offers the first lesson of the first course rather than failing

#### Scenario: While the record resolves
- **WHEN** the record exists and the round-trip that resolves it has not answered
- **THEN** the action is reserved and names no lesson

#### Scenario: Nothing moves on its own
- **WHEN** the learner opens the Achievements page and activates nothing
- **THEN** they stay on the page

### Requirement: The prize reveal offers continuing the course

The dialog that reveals a claimed prize SHALL offer, beside the control that closes it, a control that
opens the same destination the Achievements page offers. Activating it SHALL settle the dialog and open
that lesson.

The closing control SHALL remain the dialog's primary action, and closing SHALL continue to leave the
learner on the counter with focus returned to the prize that was revealed. Both controls SHALL have
accessible names, and the dialog SHALL still close on Escape.

#### Scenario: Continuing from the reveal
- **WHEN** the learner claims the `Vowels` prize and activates the control that continues the course
- **THEN** the dialog settles and the lesson they left off in opens

#### Scenario: Closing still stays on the counter
- **WHEN** the learner closes the reveal instead
- **THEN** they remain on the Achievements page with focus on the revealed prize

#### Scenario: Continuing with nothing started
- **WHEN** a learner who has started no lesson claims a prize and continues the course
- **THEN** the first lesson of the first course opens

#### Scenario: Both ways out are named
- **WHEN** assistive technology reads the reveal dialog
- **THEN** it hears a named control that closes it and a named control that continues the course


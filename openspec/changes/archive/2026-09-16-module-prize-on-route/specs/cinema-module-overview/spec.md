## ADDED Requirements

### Requirement: The progress panel shows the module's prize

The module progress panel SHALL show, below its progress figures, the module's prize as assigned by the
`learner-achievements` catalog, in the module's prize state as `learner-achievements` defines it —
tickets earned are kept after an un-mark and a claim is kept for good, so the prize row follows tickets
and claims, not the videos the panel counts as finished now.

The prize SHALL be drawn exactly as the prize counter draws a prize in the same state, keeping the
counter's surprise:

- **locked** or **collecting** — the prize's silhouette, its name withheld as `???`, a ticket tag reading
  the tickets earned out of the module's lessons (`11 / 17`), and a line stating how many tickets are
  still needed;
- **ready** — the silhouette and `???`, a line stating that every ticket is collected, and a **Claim
  prize** text link — underlined, in the muted text colour of the page's other secondary text links
  such as the lesson page's Unmark, never styled as a button — that opens `/[locale]/achievements` asking for this module's prize, the same destination
  the prize-ready dialog opens;
- **claimed** — the coloured illustration, the prize's name, and a tag reading that it was redeemed.

The prize SHALL NOT be drawn in colour, nor named, in any state but claimed. The panel SHALL NOT offer
to share the prize.

The illustration SHALL be decorative. Assistive technology SHALL hear the whole state in one sentence —
the prize's name and that it is redeemed, that the module's hidden prize is ready to claim, or that the
module's hidden prize has the given tickets — and the Claim prize link SHALL be named after the module.
States SHALL NOT be told apart by colour alone.

A module that holds no lessons SHALL show no prize row. Until the learner's progress has been read, the
row SHALL keep its shape with its label, the silhouette and `???` only, and SHALL show no ticket tag, state
line or action, so the first frame asserts nothing and the route below does not jump when progress arrives.

In the panel and in the finale, the Claim prize text link SHALL sit on the same line as the prize's
label (`Prize ready`), at the end of that line, rather than on a line of its own.

#### Scenario: Claim prize shares the label's line
- **WHEN** a ready prize is shown in the panel or the finale
- **THEN** Claim prize sits on the same line as the Prize ready label, after it

#### Scenario: A module still collecting shows the hidden prize and what is left
- **WHEN** 11 of the 17 `Vowels` lessons have earned their tickets and its prize is not claimed
- **THEN** the panel shows the harmonica's silhouette, `???`, a `11 / 17` tag and that 6 tickets are still needed, and assistive technology hears that the hidden prize of Vowels has 11 of 17 tickets

#### Scenario: An untouched module shows its hidden prize
- **WHEN** no `Vowels` lesson has earned its ticket
- **THEN** the panel shows the silhouette, `???` and a `0 / 17` tag

#### Scenario: A ready prize sends the learner to claim it
- **WHEN** every `Vowels` lesson has earned its ticket and the prize is not claimed
- **THEN** the panel still shows the silhouette and `???`, states that every ticket is collected, and offers a Claim prize link named after Vowels that opens `/[locale]/achievements?claim=2-vowels`

#### Scenario: A claimed prize is revealed
- **WHEN** the learner has claimed the `Vowels` prize on the counter
- **THEN** the panel shows the harmonica in colour, named, tagged as redeemed, with no Claim prize link

#### Scenario: Tickets outlive an un-mark
- **WHEN** every `Vowels` lesson has earned its ticket, the prize is not claimed, and the learner un-marks one lesson
- **THEN** the panel's figures state 16 of 17 videos while the prize row still reads ready to claim

#### Scenario: Nothing is shared
- **WHEN** the panel shows a claimed prize
- **THEN** it offers no share action

#### Scenario: The first frame shows no prize state
- **WHEN** the module overview is rendered on the server
- **THEN** the panel's prize row shows only its label, the silhouette and `???`, with no ticket tag, state line or Claim prize link

### Requirement: The route ends at the module's prize

After the module's last step, the route's rail SHALL continue into a **prize finale**: a marker on the rail
and a card presenting the module's prize, in the same state, drawing and wording rules as the progress
panel's prize row — silhouette and `???` until claimed, the ticket tag while locked or collecting, a
**Claim prize** link to `/[locale]/achievements` asking for this module's prize while ready, and the
coloured, named prize once claimed. Its Claim prize link SHALL be the same text link as the panel's.

Once every ticket is collected — ready or claimed — the finale's primary action SHALL be a button
reading **Start Lesson NN →**, where `NN` is the next lesson's ordinal padded to two digits, leading to
the next lesson of the course that holds videos, to the same destination the course overview's tile
for that lesson opens: its only video when it holds one, otherwise its overview. While the prize is
ready, the Claim prize text link SHALL remain on the card, on the prize label's line. A module that is the last of its course to
hold videos SHALL offer no Start Lesson action. While tickets are still being collected the finale
SHALL offer no Start Lesson action.

The finale SHALL NOT be a lesson step: it SHALL NOT be an item of the route's list of steps, SHALL carry
no finished, current or upcoming state, and SHALL NOT change which step is current or how steps are
counted.

The finale's marker SHALL carry a trophy icon, and SHALL tell a prize still collecting apart from one
whose tickets are all collected by shape as well as colour: a dashed ring while collecting, a solid disc
once every ticket is collected. A ready prize's card SHALL be featured like the current step's card; a
collecting or locked prize's card SHALL be visually subordinate to the steps above it. The finale SHALL
NOT offer to share the prize.

Assistive technology SHALL hear the finale's state in one sentence, as for the panel's prize row. The
finale's tabbable controls SHALL be the Start Lesson button and the Claim prize link, each only in
the states above.

A module that holds no lessons SHALL render no finale. Until the learner's progress has been read, the
finale SHALL show no prize state, ticket count or action.

#### Scenario: The route leads to a hidden prize
- **WHEN** 11 of the 17 `Vowels` lessons have earned their tickets
- **THEN** after step 17 the rail ends at a prize finale showing the harmonica's silhouette, `???` and `11 / 17`, and the route still holds exactly 17 steps

#### Scenario: A ready prize is featured at the end of the route
- **WHEN** every `Vowels` lesson has earned its ticket and the prize is not claimed
- **THEN** the finale is featured, shows the silhouette and `???`, offers Start Lesson 03 → opening the `Consonants` overview as its primary button, and a Claim prize text link named after Vowels that opens `/[locale]/achievements?claim=2-vowels`

#### Scenario: A claimed prize closes the route
- **WHEN** the learner has claimed the `Vowels` prize
- **THEN** the finale shows the harmonica in colour, named, tagged as redeemed, offers Start Lesson 03 →, and offers no Claim prize link and no share action

#### Scenario: The next lesson opens where the course overview opens it
- **WHEN** every ticket of `Ejercicios para dominar el ritmo en Inglés` is collected and the next lesson, `Fluidez y Velocidad`, holds a single video
- **THEN** Start Lesson 05 → opens that video's lesson page

#### Scenario: The course's last lesson offers no next lesson
- **WHEN** every ticket of the last lesson of a course is collected
- **THEN** the finale offers no Start Lesson action

#### Scenario: Collecting offers no next lesson
- **WHEN** 11 of the 17 `Vowels` lessons have earned their tickets
- **THEN** the finale offers no Start Lesson action

#### Scenario: Claim prize reads as a text link
- **WHEN** a ready prize is shown in the panel or the finale
- **THEN** Claim prize is an underlined text link in the muted text colour, with no button background

#### Scenario: The finale's marker is a trophy
- **WHEN** the finale renders in any state
- **THEN** its marker carries a trophy icon, inside a dashed ring while collecting and a solid disc once every ticket is collected

#### Scenario: The finale is not counted as a step
- **WHEN** a screen reader lists the route's steps
- **THEN** it finds one item per lesson and the finale outside that list

#### Scenario: The finale waits for progress
- **WHEN** the module overview is rendered on the server
- **THEN** the finale shows no prize state, ticket tag or Claim prize link

#### Scenario: The finale fits a phone
- **WHEN** the module overview renders at 390px wide with a ready prize
- **THEN** the finale's card and its Claim prize link sit within the viewport and the page does not scroll horizontally

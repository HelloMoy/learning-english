## MODIFIED Requirements

### Requirement: The route ends at the module's prize

After the module's last step, the route's rail SHALL continue into a **prize finale**: a marker on the rail
and a card presenting the module's prize, in the same state, drawing and wording rules as the progress
panel's prize row — silhouette and `???` until claimed, the ticket tag while locked or collecting, a
**Claim prize** link to `/[locale]/achievements` asking for this module's prize while ready, and the
coloured, named prize once claimed. Its Claim prize link SHALL be the same text link as the panel's.

Once every ticket is collected — ready or claimed — the finale's primary action SHALL be a button
reading **Start Lesson NN →**, where `NN` is the next lesson's ordinal padded to two digits, leading to
the next lesson of the course that holds videos, to the same destination the course overview's tile
for that lesson opens: that lesson's module overview, however many videos it holds. While the prize is
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
- **THEN** Start Lesson 05 → opens the `Fluidez y Velocidad` module overview, not that video's lesson page

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


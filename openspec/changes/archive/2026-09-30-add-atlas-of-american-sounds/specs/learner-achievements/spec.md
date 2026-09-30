## MODIFIED Requirements

### Requirement: Completing courses earns a distinction

A course SHALL count as complete when it holds at least one lesson and every one of its lessons has
earned its ticket. The learner's distinction SHALL be:

- `student` while no course is complete;
- `bronze` once at least one course — level or reference — is complete and not every **level** course
  holding lessons is;
- `gold` once every **level** course holding lessons is complete.

A reference course SHALL NOT be required for gold, so adding one to the catalog never takes gold away
from a learner who holds it. Its lessons still earn tickets and its modules still ready prizes.

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

#### Scenario: Gold does not wait for a reference course
- **WHEN** every lesson of both level courses has earned its ticket and the Atlas of American Sounds has none
- **THEN** the distinction is `gold`

#### Scenario: A reference course alone earns bronze
- **WHEN** every lesson of the Atlas of American Sounds has earned its ticket and no level course is complete
- **THEN** the distinction is `bronze`

### Requirement: The Achievements page explains how rewards are earned

The Achievements page SHALL offer a **How do they work?** action that opens a dialog. The dialog SHALL
explain, in the active locale:

- a ticket is earned by completing a lesson, and carries the lesson's sound;
- a module's tickets ready its prize, which stays hidden until the learner claims it on the counter;
- the distinction is bronze once one course is complete and gold once every level is.

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

#### Scenario: Gold names the levels
- **WHEN** the dialog renders in `en`
- **THEN** it reads that completing every level turns the card gold

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
| `1-the-vowel-map` | compass |
| `2-front-vowels` | xylophone |
| `3-central-vowels` | maracas |
| `4-back-vowels` | trumpet |
| `5-diphthongs` | boomerang |
| `6-r-colored-vowels` | roller skate |
| `7-stop-consonants` | party popper |
| `8-fricatives` | pinwheel |
| `9-affricates` | jack-in-the-box |
| `10-nasals` | bell |
| `11-liquids` | rubber duck |
| `12-glides` | kite |

A module whose slug is not in the catalog SHALL receive a gift box. Each prize SHALL have a localized
name and an illustration that can be drawn in full colour or as a single-colour silhouette. Every module
the catalog ships SHALL have its own catalogued prize, so no shipped module falls back to the gift box.

Each new illustration SHALL follow the existing prizes' drawing: shapes on the same 64-unit grid, painted
only with the three prize paints, and recognisable by its outline alone when drawn as a silhouette. No two
prizes SHALL share an outline.

#### Scenario: Vowels redeems a harmonica
- **WHEN** the prize for the module `2-vowels` is looked up
- **THEN** it is the harmonica

#### Scenario: An unknown module still has a prize
- **WHEN** a module with the slug `11-bonus-module` is looked up
- **THEN** its prize is the gift box

#### Scenario: Fricatives redeem a pinwheel
- **WHEN** the prize for the module `8-fricatives` is looked up
- **THEN** it is the pinwheel

#### Scenario: Every shipped module has its own prize
- **WHEN** every module slug in the catalog, the Atlas's included, is looked up
- **THEN** none of them receives the gift box

#### Scenario: A new prize is named in every locale
- **WHEN** the kite is claimed and shown under `es` and under `pt`
- **THEN** its name renders from that locale's messages, never as a raw key

### Requirement: The prize counter presents the learner's collection

The Achievements page SHALL show:

- the learner card with the finish and label of the learner's distinction;
- how many tickets are earned out of every lesson in the catalog, and how many prizes are claimed out
  of every module that holds lessons;
- a prize counter: for each course, in catalog order, a shelf holding every module's prize in module
  sequence order. A reference course has its shelf like any other course.

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
- **THEN** the page shows 13 tickets earned out of 218 and 1 prize redeemed out of 27, the totals spanning the Basic Course, the Advanced Intermediate Course and the Atlas of American Sounds

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

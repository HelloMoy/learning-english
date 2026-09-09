## MODIFIED Requirements

### Requirement: Lesson notes bodies carry explicit language sections

A lesson `readme.md` that presents its content in more than one language SHALL mark each
language with a level-2 heading naming that language (for example `## Español`,
`## English` and `## Português`), placed after the lesson's `#` title heading. All of that
language's content — descriptive sub-headings, paragraphs, lists, blockquotes, examples —
SHALL live beneath its language heading, nested at `###` or deeper.

The recognized languages are exactly the application's locales — Spanish, English and
Portuguese — matching `src/i18n/routing.ts`. A lesson notes body SHALL carry **one section
per locale**: `## 🇪🇸 Español`, `## 🇺🇸 English` and `## 🇧🇷 Português`. A locale whose
section is absent leaves that learner reading a language they did not choose, so a missing
section is a content gap, not a style choice.

This shape is what the Lesson Page's Notes tab reads to render the section matching the
learner's active locale (see `cinema-lesson-view`). Notes bodies SHALL NOT rely on
paragraph ordering or on a particular number of blank-line-separated blocks to convey which
language a passage is in.

A lesson whose notes exist in a single language SHALL still mark that language with its own
level-2 heading, so a monolingual lesson is explicit rather than merely ambiguous.

This requirement binds **every course declared in `src/content/<slug>.json`**, not the course
that happened to be imported first. A course whose lesson bodies predate the requirement is
non-conformant content, not an accepted exception: importing a course means bringing its notes
into this shape.

The language sections of a lesson SHALL be mirrors of one another — the same sub-headings,
the same lists, the same examples, the same claims — in every direction, not merely between
the first two. A learner reading in Spanish, in English or in Portuguese SHALL receive the
same lesson, so no language is a reduced version of another.

Mirroring binds the teaching content, not the learner's first language. Where a passage
attributes a difficulty, an interference or a contrast to the learner's own language, each
section SHALL state it for **its own** readers: the Portuguese section SHALL NOT assert about
Portuguese what the Spanish section asserts about Spanish. Where a contrast holds for the
section's language, it SHALL name that language; where it does not, or where it is not
established, the section SHALL state the point without attributing it to a language the
lesson does not cover. A section SHALL NOT invent a phonological claim in order to mirror a
sentence.

#### Scenario: A lesson body is structured by language, one section per locale

- **WHEN** a lesson's `readme.md` presents the lesson to the app's learners
- **THEN** the body carries a `## 🇪🇸 Español` section, a `## 🇺🇸 English` section and a `## 🇧🇷 Português` section, each holding that language's sub-headings, paragraphs and lists

#### Scenario: A monolingual lesson body still names its language

- **WHEN** a lesson's `readme.md` presents content in English only
- **THEN** the body carries a single `## English` section rather than bare paragraphs under the title

#### Scenario: Reformatting a notes body leaves the title heading untouched

- **WHEN** a lesson's `readme.md` body is restructured or gains a language section
- **THEN** the file's first `#` heading is unchanged byte-for-byte, so the title the sync command would propose for a new lesson is unaffected

#### Scenario: Every declared course's lessons carry a section per locale

- **WHEN** the lesson `readme.md` files of every course declared in `src/content/` are inspected
- **THEN** each one that has a body carries a Spanish, an English and a Portuguese level-2 language section, with no course exempt

#### Scenario: All three sections carry the same lesson

- **WHEN** a lesson's Spanish, English and Portuguese sections are compared
- **THEN** they present the same sub-headings in the same order, the same example words and the same guidance, so no language is shorter or poorer than the others

#### Scenario: A first-language claim is restated, not transplanted

- **WHEN** the Spanish section warns about a mistake it attributes to Spanish speakers
- **THEN** the Portuguese section addresses Portuguese speakers in its own terms rather than repeating the claim about Spanish, and asserts nothing about Portuguese phonology that the lesson does not teach

#### Scenario: The shape check reads Portuguese as a language section

- **WHEN** the notes shape check inspects a body containing a `## 🇧🇷 Português` section
- **THEN** that section is validated for its `###` sub-heading and its prose like the Spanish and English sections, and is compared against them for mirroring, rather than being ignored as an unrecognized heading

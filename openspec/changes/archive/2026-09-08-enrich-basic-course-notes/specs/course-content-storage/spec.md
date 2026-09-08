## MODIFIED Requirements

### Requirement: Lesson notes bodies carry explicit language sections

A lesson `readme.md` that presents its content in more than one language SHALL mark each
language with a level-2 heading naming that language (for example `## Español` and
`## English`), placed after the lesson's `#` title heading. All of that language's content —
descriptive sub-headings, paragraphs, lists, blockquotes, examples — SHALL live beneath its
language heading, nested at `###` or deeper.

This shape is what the Lesson Page's Notes tab reads to render its "Español" / "English"
columns (see `cinema-lesson-view`). Notes bodies SHALL NOT rely on paragraph ordering or on a
particular number of blank-line-separated blocks to convey which language a passage is in.

A lesson whose notes exist in a single language SHALL still mark that language with its own
level-2 heading, so a monolingual lesson is explicit rather than merely ambiguous.

This requirement binds **every course declared in `src/content/<slug>.json`**, not the course
that happened to be imported first. A course whose lesson bodies predate the requirement is
non-conformant content, not an accepted exception: importing a course means bringing its notes
into this shape.

The two language sections of a bilingual lesson SHALL be mirrors of one another — the same
sub-headings, the same lists, the same examples, the same claims. A learner reading the
Spanish column and a learner reading the English column SHALL receive the same lesson, so
neither column is a reduced version of the other.

#### Scenario: A bilingual lesson body is structured by language

- **WHEN** a lesson's `readme.md` presents the same lesson in Spanish and in English
- **THEN** the body carries a `## Español` section and a `## English` section, each holding that language's sub-headings, paragraphs and lists

#### Scenario: A monolingual lesson body still names its language

- **WHEN** a lesson's `readme.md` presents content in English only
- **THEN** the body carries a single `## English` section rather than bare paragraphs under the title

#### Scenario: Reformatting a notes body leaves the title heading untouched

- **WHEN** a lesson's `readme.md` body is restructured into language sections
- **THEN** the file's first `#` heading is unchanged byte-for-byte, so the title the sync command would propose for a new lesson is unaffected

#### Scenario: Every declared course's lessons carry language sections

- **WHEN** the lesson `readme.md` files of every course declared in `src/content/` are inspected
- **THEN** each one that has a body carries at least one level-2 language section heading, with no course exempt

#### Scenario: The two columns carry the same lesson

- **WHEN** a bilingual lesson's Spanish and English sections are compared
- **THEN** they present the same sub-headings, the same example words and the same guidance, so neither language is shorter or poorer than the other

## ADDED Requirements

### Requirement: A lesson notes body describes the lesson, not just names it

A lesson `readme.md` SHALL NOT consist of a `#` title alone. Inside each language section,
the body SHALL open with a `###` descriptive sub-heading and SHALL carry, at minimum, prose
that orients the learner in what the lesson covers and why it matters to their pronunciation.

Where the lesson teaches a specific sound, the body SHALL additionally carry concrete example
words in which that sound occurs, so the learner has something to hear for and repeat rather
than a description in the abstract.

Notes bodies SHALL be written for the learner, in the second person, and SHALL stay within
what the lesson itself teaches — a notes body SHALL NOT introduce material the lesson does not
cover.

#### Scenario: A title-only notes file is completed

- **WHEN** a lesson's `readme.md` contains only its `#` title heading
- **THEN** it is treated as an incomplete notes body and given language sections with descriptive content, rather than shipped as-is

#### Scenario: A sound lesson names the words the sound lives in

- **WHEN** a lesson teaches a specific vowel or consonant sound
- **THEN** its notes body lists concrete English words containing that sound

#### Scenario: Notes stay inside the lesson's own subject

- **WHEN** a notes body is written or enriched for an existing lesson
- **THEN** it elaborates only on what that lesson teaches and introduces no new claims the lesson does not make

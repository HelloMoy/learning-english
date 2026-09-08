## ADDED Requirements

### Requirement: A course tree has one canonical on-disk shape

Every declared course SHALL present the same shape under the content root, so the
generator walks one layout and only one:

```
<content-root>/<course-folder>/<module-folder>/<lesson-folder>/
    <video>.mp4            — optional; its presence makes the lesson a video lesson
    <poster>.jpeg          — optional; the first image becomes the poster
    readme.md              — optional; the lesson's notes, opening with a `#` heading
    <resource>.pdf         — zero or more; resources sit beside the media, never below it
```

Exactly three folder levels separate the content root from a lesson's files. A module
folder SHALL contain lesson folders and nothing else that the walk depends on; a lesson
folder SHALL hold its media, poster, notes and resources as **direct children**, with no
intervening subfolder. Notes SHALL be named `readme.md`, and a lesson whose title cannot
be recovered from its slug SHALL carry that title as the first `#` heading of that file.

Course content that arrives in a different shape — an extra grouping level, a lesson's
files loose at module level, notes under another filename, resources in a subfolder —
SHALL be migrated to this shape before the course is declared in `courses.manifest.json`.
The generator SHALL NOT be taught to recognize alternative shapes, and the manifest SHALL
NOT gain fields describing them: one contract keeps every course's content keys derivable
from its path, and a second shape would double the surface every future content change is
verified against.

#### Scenario: A grouping level between module and lesson is flattened, not accommodated

- **WHEN** an imported course nests lesson folders under `<module>/<group>/<lesson>/`
- **THEN** each `<group>` is promoted to a sibling module of `<module>` before the course
  is declared, and the generator's walk is unchanged

#### Scenario: A lesson's files loose at module level are wrapped in a lesson folder

- **WHEN** an imported module folder holds `lesson.mp4` and `thumbnail.jpeg` as direct
  children, with no lesson folder around them
- **THEN** those files are moved into a lesson folder inside that module before the course
  is declared, so the module holds lesson folders only

#### Scenario: Resources in a subfolder are hoisted beside the media

- **WHEN** an imported lesson folder holds its PDFs under `<lesson>/resources/`
- **THEN** those files are moved into `<lesson>/` before the course is declared, and the
  generator emits one resource row per file exactly as it does for any other course

#### Scenario: Notes under another filename are renamed

- **WHEN** an imported lesson carries its notes as `description.md`
- **THEN** the file is renamed `readme.md` before the course is declared, so the notes are
  emitted as inline notes and a notes Resource rather than as an unnamed `other` resource

### Requirement: Reshaping an imported course tree is a dry-runnable, plan-driven step

The system SHALL provide `scripts/reshape-course-tree.ts`, a build-time step that brings
one imported course folder to the canonical shape defined above. It SHALL:

- Take a declarative plan naming the course folder and the moves it needs — module
  promotions with their new ladder positions, lesson folders to create around loose files,
  subfolders to hoist, and the notes filename to adopt. A course with no plan SHALL be left
  untouched, so running the step can never disturb a course that is already canonical.
- Default to a **dry run** that prints the `old → new` plan and mutates nothing. Renames
  SHALL happen only under `--apply`, mirroring `normalize-content-disk.ts`.
- Move files with `rename`, never copy, so a multi-gigabyte tree is reshaped without
  duplicating a byte.
- Be **idempotent**: re-running it against an already-reshaped tree SHALL make no changes
  and exit zero.
- Abort with a non-zero status, before mutating anything in the affected directory, when a
  move would overwrite an existing entry or when two sources would land on one target.

Reshaping SHALL run BEFORE `normalize-content-disk.ts`: the reshape decides where a folder
lives, normalization decides what it is called. Running them in the other order would
rename folders the plan still refers to by their raw names.

#### Scenario: A dry run mutates nothing

- **WHEN** the step runs without `--apply`
- **THEN** it prints every move it would make and no file or folder on disk has changed

#### Scenario: Re-running after a completed reshape is a no-op

- **WHEN** the step runs a second time with `--apply` against a tree it has already reshaped
- **THEN** it reports nothing to move and exits zero

#### Scenario: A colliding move aborts before touching the directory

- **WHEN** a planned move would land on a path that already exists
- **THEN** the step exits non-zero naming both paths, and no move in that directory is performed

#### Scenario: An undeclared course folder is not reshaped

- **WHEN** the step runs with a plan naming one course folder, and the content root holds others
- **THEN** only the named folder is touched

### Requirement: Module titles may be overridden per course

A course entry in `courses.manifest.json` SHALL be able to declare `moduleTitleOverrides`, a
table of hand-written module titles that the generator SHALL prefer over the derived one.

The generator derives a module's title with `humanize(moduleSlug)`, which strips accents and
title-cases every word. That is adequate for English module names and wrong for any other
language: `Ejercicios para dominar el ritmo en Inglés` becomes `Ejercicios Para Dominar El
Ritmo En Ingles`.

The table SHALL be keyed by **module slug** — not course-prefixed, because the course is already the entry
the table lives under. An override SHALL take precedence over the derived title. A module with
no entry SHALL keep the derived title, so an absent entry stays a deliberate acceptance of the
automatic value rather than an oversight.

Override values SHALL be validated, not repaired, on the same terms as `lessonTitleOverrides`:
a value SHALL be non-empty, SHALL be trimmed, and SHALL NOT contain the straight apostrophe
`'` (U+0027). A key naming a module the course does not hold SHALL NOT be silently ignored.

Overriding a title SHALL NOT change the module's slug, id, sequence, or any content key: ids
derive from the course and module slugs, never from the title.

#### Scenario: An accented Spanish module title survives

- **WHEN** a course entry maps `4-ejercicios-para-dominar-el-ritmo-en-ingles` to
  `Ejercicios para dominar el ritmo en Inglés`
- **THEN** the emitted module's title is that string verbatim, not the `humanize`-derived one

#### Scenario: A module with no override keeps the derived title

- **WHEN** a course declares `moduleTitleOverrides` for one of its modules
- **THEN** every other module of that course is emitted with its `humanize(slug)` title, unchanged

#### Scenario: An override applies only to its own course

- **WHEN** two courses each hold a module slugged `1-intro` and only one declares an override for it
- **THEN** only that course's module adopts the override

#### Scenario: A straight apostrophe in an override is rejected

- **WHEN** a `moduleTitleOverrides` value contains `'` (U+0027)
- **THEN** the manifest fails validation, naming the offending key, and generation aborts

#### Scenario: Module identity survives a title override

- **WHEN** the generator is re-run after adding a module title override
- **THEN** that module's id, slug and sequence are unchanged, and no lesson or resource key moves

## MODIFIED Requirements

### Requirement: Course metadata is declared in an untracked content manifest

The system SHALL read course declarations from a manifest at
`public/local-filesystem-lesson/courses.manifest.json`. The manifest is the single
place where everything that cannot be inferred from the content tree is declared.

The manifest SHALL be a JSON document of the shape:

```jsonc
{
  "version": 1,
  "courses": [
    {
      "folder": "advanced-intermediate-course",  // required: directory under the content root
      "slug": "advanced-intermediate-course",    // optional: defaults to slugify(folder)
      "title": "Advanced Intermediate Course",   // optional: defaults to humanize(slug)
      "description": "…",                        // optional: defaults to the generated sentence
      "language": "en",                          // optional: defaults to "en"
      "sequence": 2,                             // required: position in the home ladder
      "slugOverrides": { "1 Day#1": "1-day-01" },
      "titleFromNotesModules": ["3-contractions-reductions"],
      "moduleTitleOverrides": { "3-contractions-reductions": "Contractions & Reductions" },
      "lessonTitleOverrides": { "3-contractions-reductions/6-i-d": "I’d …" }
    }
  ]
}
```

`slugOverrides` is keyed by the RAW on-disk name; `titleFromNotesModules` lists
module slugs; `moduleTitleOverrides` is keyed by module slug; `lessonTitleOverrides`
is keyed by `moduleSlug/lessonSlug` relative to the course, because scoping each
override map inside its course entry makes a cross-course key collision unrepresentable.

The manifest SHALL be untracked by git. `public/local-filesystem-lesson/` is
already ignored in full, so no new `.gitignore` rule is required; a comment SHALL
be added there recording that the manifest is deliberately covered by it. The
manifest describes ~15 GB of untracked content and is only meaningful on a machine
that has it, so the two are present and absent together.

The manifest SHALL be optional. When the file is absent, the generator SHALL behave
exactly as it did before this change: one course, taken from the first folder under
the content root, with a slug-derived title, a generated description, `language:
"en"`, and `sequence: 2`.

The manifest SHALL be validated with a Zod schema before use. A manifest that is
malformed JSON, fails the schema, names a `folder` that does not exist under the
content root, or declares two courses with the same `slug` or the same `sequence`
SHALL abort generation with a non-zero exit status and a message naming the
offending entry, WITHOUT writing a partial `seed-content.ts`. A malformed manifest
SHALL NOT silently fall back to the no-manifest defaults — a present-but-wrong
manifest is an error, an absent one is a default.

#### Scenario: A new course is added without touching any code

- **WHEN** a developer drops a new course folder under the content root in the canonical
  shape, adds an entry naming that folder with a `sequence` of `3` to
  `courses.manifest.json`, and runs `pnpm generate:content-seed`
- **THEN** `seed-content.ts` contains that course, its modules, lessons and
  resources, and no file under `scripts/` was edited

#### Scenario: An absent manifest reproduces the pre-change output

- **WHEN** the generator runs against a content root with no `courses.manifest.json`
- **THEN** it emits exactly one course, from the first folder, with the slug-derived
  title, the generated description, `language: "en"` and `sequence: 2`

#### Scenario: Declared metadata overrides every derived default

- **WHEN** a course entry declares `title`, `description`, `language` and `sequence`
- **THEN** the emitted `Course` carries those four values verbatim, not the derived ones

#### Scenario: A manifest naming a missing folder fails loudly

- **WHEN** a course entry names `folder: "does-not-exist"`
- **THEN** the generator exits non-zero, names that folder, and leaves the existing
  `seed-content.ts` untouched

#### Scenario: Malformed JSON is an error, not a fallback

- **WHEN** `courses.manifest.json` exists but is not valid JSON, or omits a required
  field such as `sequence`
- **THEN** the generator exits non-zero with a message identifying the problem and
  does NOT fall back to the no-manifest defaults

#### Scenario: Two courses claiming the same ladder position fail loudly

- **WHEN** two course entries declare the same `sequence`, or the same `slug`
- **THEN** the generator exits non-zero and names both entries

#### Scenario: The manifest is not tracked by git

- **WHEN** a developer creates `public/local-filesystem-lesson/courses.manifest.json`
  and runs `git status`
- **THEN** the file is not listed as untracked-and-addable content, because the
  content root is already ignored in full

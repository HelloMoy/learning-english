## ADDED Requirements

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
      "lessonTitleOverrides": { "3-contractions-reductions/6-i-d": "I’d …" }
    }
  ]
}
```

`slugOverrides` is keyed by the RAW on-disk name; `titleFromNotesModules` lists
module slugs; `lessonTitleOverrides` is keyed by `moduleSlug/lessonSlug` relative
to the course, because scoping each override map inside its course entry makes a
cross-course key collision unrepresentable.

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

- **WHEN** a developer drops a new course folder under the content root, adds an
  entry naming that folder with a `sequence` of `3` to `courses.manifest.json`,
  and runs `pnpm generate:content-seed`
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

### Requirement: A tracked example manifest is the template and the reviewed record

The repository SHALL commit `scripts/courses.manifest.example.json`: a complete,
schema-valid manifest carrying the real current values for the shipped course,
including every slug override, notes-heading module and lesson-title override that
`scripts/slug-overrides.ts`, `scripts/title-from-notes-modules.ts` and
`scripts/title-overrides.ts` held before this change.

The example SHALL be a working manifest, not a stub: copying it to
`public/local-filesystem-lesson/courses.manifest.json` on a machine that has the
content SHALL regenerate the committed `seed-content.ts` byte-for-byte.

A test SHALL assert that the example file parses against the manifest schema, so
the committed template cannot drift out of shape.

This mirrors the repository's existing `.env` / `.env.example` split: the live file
carries machine-local truth and stays untracked, the example is the one artifact a
fresh clone needs in order to know what the live file must contain.

#### Scenario: A fresh clone learns the manifest's shape

- **WHEN** a developer clones the repo, obtains the content root out of band, and
  copies `scripts/courses.manifest.example.json` to
  `public/local-filesystem-lesson/courses.manifest.json`
- **THEN** `pnpm generate:content-seed` succeeds and produces no diff against the
  committed `seed-content.ts`

#### Scenario: The example manifest is schema-checked in CI

- **WHEN** `pnpm test:run` executes
- **THEN** a test parses `scripts/courses.manifest.example.json` with the manifest
  schema and fails if it no longer validates

## MODIFIED Requirements

### Requirement: Content seed is generated at build time, not at runtime

The system SHALL provide a build-time script `scripts/generate-course-content-seed.ts` that:

- Reads `public/local-filesystem-lesson/courses.manifest.json` when present and walks the folder named by EACH course entry, in `sequence` order. With no manifest, it walks the single first folder under the content root, as before.
- Emits `src/adapters/persistence/in-memory/seed/seed-content.ts` containing `seedContentCourses`, `seedContentModules`, `seedContentLessonRows`, and `seedContentResourceRows`, PLUS the original pre-normalization names (see "Generated seed preserves the original pre-normalization names"). The module, lesson and resource exports aggregate across every course; each row already carries the `courseId` or `moduleId` that owns it, so no consumer needs a per-course export.
- Emits `seedContentCourses` and `seedContentModules` as parsed domain entities, because neither carries a content key. Emits lessons and resources as **raw rows** — plain objects whose `source`, `poster` and `url` fields hold content KEYS, not URLs — because a bare key does not satisfy `urlOrRelativePath()` and therefore cannot be parsed into a domain entity until an adapter has resolved it.
- Computes slugs for every folder using (a) the `slugOverrides` map of the owning course's manifest entry if present, otherwise (b) automatic kebab-case ASCII normalization.
- Slugifies EVERY path segment of each content key — the course, module, and lesson folder names AND the media/resource file basenames — using the same override + normalization logic, so the emitted key is kebab-case ASCII end to end.
- Extracts `durationSeconds` for each `.mp4` via `ffprobe`. If `ffprobe` is not on `PATH`, the script exits with a non-zero status and a message instructing the developer to install it.
- Emits content KEYS for every `VideoLesson.source`, `VideoLesson.poster` and `Resource.url`. The generator SHALL NOT resolve keys to URLs and SHALL NOT contain a base-URL literal; the public URL prefix is not knowable at generation time because it is a deployment concern.
- Validates every emitted key via `BlobStore.exists(key)` and fails non-zero without a partial write if any key is unresolved (see "Generator validates that every emitted key resolves on disk"). The generator MAY construct a `BlobStore` for this existence check alone; it MUST NOT use it to bake URLs into the output.

The generator SHALL NOT silently discard a course folder. Every folder under the content root is either declared in the manifest and emitted, or absent from it and skipped; when a manifest is present and an undeclared folder exists, the generator SHALL report the skipped folder by name on stderr and continue with exit status zero, because an undeclared folder is a staging area, not an error.

The generated file MUST be committed to git. The script MAY be re-run by hand (`pnpm generate:content-seed`) when content is added or removed; CI does not run it.

#### Scenario: A new lesson is added by dropping files in the content folder

- **WHEN** a developer adds a new folder under `public/local-filesystem-lesson/<course>/<new-lesson>/` containing `lesson.mp4` and `notes.pdf`, then runs the normalization step and `pnpm generate:content-seed`
- **THEN** `seed-content.ts` contains a new video lesson row with a stable slug and a new resource row for the PDF, both with fully-slugified keys that resolve on disk, and both visible in the git diff

#### Scenario: Two declared courses are both emitted

- **WHEN** the manifest declares two course entries and both folders exist under the content root
- **THEN** `seedContentCourses` holds both courses in `sequence` order, and `seedContentModules`, `seedContentLessonRows` and `seedContentResourceRows` each hold the union of both courses' rows

#### Scenario: An undeclared folder is skipped with a named warning

- **WHEN** a manifest is present and a folder exists under the content root that no course entry names
- **THEN** the generator names that folder on stderr, emits nothing for it, and exits zero

#### Scenario: The generated seed contains no base-URL prefix

- **WHEN** `pnpm generate:content-seed` completes
- **THEN** no `source`, `poster` or `url` value in `seed-content.ts` begins with `/local-filesystem-lesson` or any other base-URL prefix — each is a bare content key beginning with the course slug

#### Scenario: A folder name with special characters gets a clean slug

- **WHEN** the script encounters folder `"5 Sound Natural: American Intonation Essentials"`
- **THEN** the generated module slug is `"5-sound-natural-intonation-essentials"` (automatic normalization) UNLESS an entry in the owning course's `slugOverrides` maps the raw name to a different slug

#### Scenario: A media file basename is slugified into the key

- **WHEN** a lesson folder contains `"Aprende Inglés Americano con Fluidez desde Cero.mp4"`
- **THEN** the emitted `source` key ends in `"aprende-ingles-americano-con-fluidez-desde-cero.mp4"`, and the same slug is the file's name on disk after normalization

#### Scenario: A duplicate `.mp4` filename inside the same section still produces unique keys

- **WHEN** two lesson folders in the same section each contain a file that slugifies to `aprende-ingles-americano-con-fluidez-desde-cero.mp4`
- **THEN** the generated keys are different because each lesson key includes the lesson slug, not the bare filename

#### Scenario: Missing ffprobe fails loudly

- **WHEN** the developer runs `pnpm generate:content-seed` and `ffprobe` is not on `PATH`
- **THEN** the script exits non-zero with stderr "ffprobe not found; install ffmpeg or set FFPROBE_PATH" and does not write a partial `seed-content.ts`

### Requirement: Lesson titles come from the notes heading for allowlisted modules

The generator SHALL derive a lesson's title from the first Markdown `#` heading of that lesson's `readme.md`, but only for modules named in that course's `titleFromNotesModules` allowlist in the manifest. For every module not in that allowlist, the title SHALL continue to be derived from the lesson slug, unchanged.

The allowlist SHALL be per-module, not per-lesson, and SHALL live under the owning course's manifest entry, so enabling a module is a single visible edit scoped to the course it belongs to.

The heading SHALL be adopted only when it carries information the slug could not: if the heading equals the slug-derived title ignoring case, the slug-derived title SHALL be kept. A lesson whose `readme.md` is absent, or whose `readme.md` has no `#` heading, SHALL keep the slug-derived title.

The generator SHALL additionally consult the owning course's `lessonTitleOverrides` table, keyed by the `moduleSlug/lessonSlug` path within that course. An override SHALL take precedence over both the heading and the slug, and SHALL apply whether or not its module is in the allowlist — it is already a per-lesson reviewed decision. The override table exists for lessons whose real name cannot be recovered automatically, such as a lesson with no `readme.md` at all.

The resolved title SHALL be applied once and used for both the lesson and its notes Resource, so the two can never disagree.

When a title is adopted from a heading, apostrophes SHALL be normalized to `’` (U+2019), so a module reads consistently regardless of which character its author typed. No other normalization SHALL be applied — not case, not punctuation spacing, not `&`/`and`. Override values SHALL be written correctly rather than normalized; a test SHALL fail an override value containing `'` (U+0027).

These rules SHALL apply to both video and reading lessons.

Reading the heading SHALL NOT change how lessons are classified, how slugs, sequences, ids, posters or resources are derived, or the contents of the notes Resource.

#### Scenario: A heading recovers notation the slug lost
- **WHEN** a lesson in an allowlisted module sits in a folder slugged `4-fast` and its `readme.md` opens with `# Fast /æ/`
- **THEN** the emitted lesson's title is `Fast /æ/`, not `Fast`

#### Scenario: Sibling folders that slugged identically become distinguishable
- **WHEN** several lessons in an allowlisted module occupy folders that all slug to the same human name, and each `readme.md` opens with a different heading
- **THEN** each emitted lesson carries its own heading as its title, so no two rows in the module display the same name

#### Scenario: A module outside the allowlist is untouched
- **WHEN** a lesson in a module absent from the allowlist has a `readme.md` whose heading differs from the slug-derived title
- **THEN** the emitted title is the slug-derived one, and the generated seed for that module is unchanged

#### Scenario: An allowlist entry applies only to its own course
- **WHEN** two courses each contain a module whose slug is `1-intro`, and only one course's manifest entry allowlists `1-intro`
- **THEN** only that course's module adopts its headings, and the other course's module keeps slug-derived titles

#### Scenario: A heading that differs only in case is not adopted
- **WHEN** a lesson in an allowlisted module has the slug-derived title `Intro` and its `readme.md` opens with `# INTRO`
- **THEN** the emitted title remains `Intro`, because capitalization is not information the slug lost

#### Scenario: A lesson with no heading keeps the slug-derived title
- **WHEN** a lesson in an allowlisted module has no `readme.md`, or has one with no `#` heading
- **THEN** the emitted title is the slug-derived one and no error is raised

#### Scenario: An override supplies a title no automatic source can produce
- **WHEN** a lesson has no `readme.md`, so neither a heading nor anything but the mangled slug is available, and the manifest's `lessonTitleOverrides` has an entry for its `moduleSlug/lessonSlug`
- **THEN** the emitted title is the override value

#### Scenario: An override outranks a heading
- **WHEN** a lesson in an allowlisted module has both a `readme.md` heading and an override entry
- **THEN** the override value wins, because it is the more specific reviewed decision

#### Scenario: The override reaches the notes Resource too
- **WHEN** an overridden lesson also emits a notes Resource
- **THEN** that Resource is titled from the same resolved title, so the lesson and its notes never show different names

#### Scenario: Apostrophes in an adopted heading are normalized
- **WHEN** one lesson's heading uses `'` (U+0027) and a sibling's uses `’` (U+2019)
- **THEN** both emitted titles use `’`, so the module does not mix the two characters

#### Scenario: Normalization does not reach beyond apostrophes
- **WHEN** an adopted heading contains mixed case, an ampersand, or irregular spacing around punctuation
- **THEN** those are emitted unchanged — only the apostrophe character is normalized

#### Scenario: Lesson identity survives a title change
- **WHEN** the generator is re-run after enabling a module or adding an override, and titles change
- **THEN** every lesson's id, slug, sequence, `source` and `poster` are unchanged, because ids are derived from the course, module and lesson slugs and never from the title

### Requirement: On-disk content layout is normalized to match slug keys

The system SHALL provide a build-time normalization step that renames every folder AND every media/resource file under `public/local-filesystem-lesson/` to its kebab-case slug form, using the SAME slug resolution as the seed generator (the owning course's `slugOverrides` map from `courses.manifest.json` first, then `scripts/slug.ts` automatic normalization). When no manifest is present, or when the entry being renamed sits outside any declared course folder, automatic normalization alone applies. After normalization, the physical path of each asset (relative to the content root) SHALL be byte-for-byte equal to the content key the generator emits, so `blobStore.url(key)` resolves against Next.js `/public`.

The normalization step SHALL NOT rename `courses.manifest.json` or `rename-manifest.json`; both are generator inputs living at the content root, not content.

Normalization SHALL be idempotent (`slugify(slugify(x)) === slugify(x)`), so re-running it against an already-normalized tree makes no changes. If two distinct raw names within the same parent directory normalize to the same slug, the step SHALL abort with a non-zero status and name the colliding entries, without performing a partial rename of that directory.

#### Scenario: A folder with spaces, capitals, and special characters is renamed

- **WHEN** normalization encounters the folder `"8 Everyday English Phrases PART 2 Master Them!"`
- **THEN** it is renamed on disk to `"8-everyday-english-phrases-part-2-master-them"`

#### Scenario: A media file basename with spaces and accents is renamed

- **WHEN** normalization encounters the file `"Aprende Inglés Americano con Fluidez desde Cero.mp4"`
- **THEN** it is renamed on disk to `"aprende-ingles-americano-con-fluidez-desde-cero.mp4"` (extension preserved, stem slugified)

#### Scenario: The manifests at the content root are never renamed

- **WHEN** normalization runs against a content root holding `courses.manifest.json` and `rename-manifest.json`
- **THEN** both keep their exact filenames and neither appears in the rename manifest's entries

#### Scenario: Re-running normalization on an already-normalized tree is a no-op

- **WHEN** normalization runs a second time against a tree whose every entry is already its slug
- **THEN** no rename occurs and the step exits zero

#### Scenario: A slug collision aborts without partial renames

- **WHEN** two sibling folders `"Intro"` and `"intro!"` both normalize to `"intro"`
- **THEN** the step exits non-zero, reports both colliding raw names, and leaves that directory unchanged

## REMOVED Requirements

### Requirement: Slug overrides are explicit and per-folder

**Reason**: The override map moves from a tracked TypeScript module
(`scripts/slug-overrides.ts`) into the `slugOverrides` field of the owning course's
entry in `courses.manifest.json`, so that a course's identity and its per-folder
corrections are declared in one place instead of two. Keying overrides globally by
raw folder name also could not survive a second course, where two unrelated courses
may legitimately hold sibling folders with the same raw name.

**Migration**: Move each entry of `SLUG_OVERRIDES` into the `slugOverrides` object
of the manifest entry for the course it belongs to; the key stays the raw on-disk
name and the value stays the desired slug. The current entries are carried into the
tracked `scripts/courses.manifest.example.json` as part of this change.
`scripts/slug-overrides.ts` is deleted and `scripts/resolve-slug.ts` takes the
override map as an argument instead of reading a module-level constant. The
"reviewed in code review" guarantee is now carried by the committed
`seed-content.ts` diff, which shows every slug the override produced, and by the
tracked example manifest.

## ADDED Requirements

### Requirement: The course catalog is declared in tracked per-course manifests

The system SHALL read the complete course catalog from one manifest per course at
`src/content/<course-slug>.json`, enumerated by an index module at
`src/content/courses.ts`. Together these manifests are the single source of truth
for the catalog: every course, module, lesson and resource the application serves
is declared there. Nothing about the catalog SHALL be inferred from the content
tree at build or run time.

One course SHALL be one file. A course's manifest SHALL be editable without
touching any other course's, so that the file is both the unit of editing and the
unit of merge conflict.

The manifests SHALL live outside `public/`, so they are neither served at a public
URL nor dependent on the multi-gigabyte content tree being present on the machine.

The manifests SHALL live under `src/`, where the project's existing `@/*` path
alias already resolves them. No new path alias SHALL be introduced: the alias is
declared independently in `tsconfig.json` and `vitest.config.ts`, and a second one
would be two places to keep in sync for no gain.

The manifests SHALL be tracked by git. A fresh clone SHALL obtain a working
catalog from the repository alone, without the content bytes.

A manifest SHALL declare, for every lesson, the fields the domain's `Lesson`
requires and that were previously derived from the filesystem: `id`, `slug`,
`title`, `kind`, `sequence`, `source`, `durationSeconds`, and `poster` when one
exists. It SHALL likewise declare every resource with its `id`, `lessonId`,
`title`, `url` and `kind`.

A lesson's `source` and `poster`, and a resource's `url`, SHALL each be either a
content key resolved through `BlobStore` or an absolute `http(s)` URL used
verbatim. Which one it is SHALL be decided by the value's own shape, exactly as
it is today.

Every manifest SHALL be validated against a Zod schema. A manifest that is
malformed JSON or fails the schema SHALL fail loudly rather than fall back to any
default. Because `slug` and `sequence` must be unique across the whole ladder,
that check SHALL run over the full set after each file is parsed. There SHALL NOT
be a no-manifest fallback: the manifests are required, and an absent one is an
error.

#### Scenario: A fresh clone serves the catalog without the content tree

- **WHEN** a developer clones the repository, installs dependencies, and starts
  the app without ever obtaining the content root
- **THEN** the catalog renders every course, module and lesson declared under
  `src/content/`, and only the locally-stored assets 404

#### Scenario: The manifests are tracked by git

- **WHEN** a developer clones the repository and runs `git ls-files src/content/`
- **THEN** one `.json` manifest per course is listed, alongside the index module

#### Scenario: The manifests are not served publicly

- **WHEN** the app is running and a client requests
  `/local-filesystem-lesson/courses.manifest.json` or `/content/basic-course.json`
- **THEN** the request 404s, because the manifests live outside `public/`

#### Scenario: One course is edited without touching another

- **WHEN** a developer changes a lesson title in `src/content/basic-course.json`
- **THEN** `src/content/advanced-intermediate-course.json` is byte-identical, and
  the change touches exactly one manifest file

#### Scenario: A lesson declares its own duration

- **WHEN** a manifest declares a lesson with `durationSeconds: 663` and no
  `.mp4` exists anywhere under the content root for that lesson
- **THEN** the lesson is served as a video lesson reporting 663 seconds, and no
  filesystem access is attempted to determine its duration

#### Scenario: A missing manifest is an error, not a default

- **WHEN** a manifest named by `src/content/courses.ts` is absent or is not valid
  JSON
- **THEN** the failure is surfaced with a message identifying the problem, and
  the application does NOT fall back to a derived or empty catalog

#### Scenario: Two courses claiming the same ladder position fail loudly

- **WHEN** two manifests declare the same `sequence`, or the same `slug`
- **THEN** validation fails and names both files

### Requirement: The application reads the catalog without a code-generation step

The adapters SHALL consume the manifests directly. The repository SHALL NOT
contain a generated TypeScript catalog, and there SHALL NOT be a command whose
job is to turn content into application code.

The manifests SHALL be consumed by static import, so their data is resolved at
build time and lands in the server bundle. Reading the catalog SHALL NOT touch
the filesystem at run time and SHALL NOT cost anything per request. The catalog
SHALL NOT be shipped to the client: the pages that read it are Server
Components, which send only the lesson they rendered.

Adding a course SHALL mean adding its manifest and one import line to
`src/content/courses.ts`. Static import cannot enumerate a directory, so the index
is explicit by necessity; it SHALL contain nothing but those imports and the
exported list.

The rows handed to `resolveLessonRow` and `resolveResourceRow` SHALL keep their
current shape, so `BlobStore` remains the single point of URL resolution and the
adapters below it are unchanged.

#### Scenario: No generated catalog remains in the repository

- **WHEN** a developer searches the repository for a generated seed module or a
  `generate:content-seed` script
- **THEN** neither exists, and no source file imports a generated catalog

#### Scenario: Serving a lesson touches no filesystem for catalog data

- **WHEN** a lesson page renders
- **THEN** the lesson's identity, title, source, duration and poster come from
  the imported manifest, and the only filesystem access is for the asset bytes
  themselves

#### Scenario: Editing a manifest changes the catalog

- **WHEN** a developer edits a lesson's `title` in `src/content/basic-course.json`
  and reloads the app
- **THEN** the new title renders, with no generation command run in between

### Requirement: A maintenance command appends undescribed lessons without overwriting declarations

The system SHALL provide a command that scans the content tree and appends to a
course's manifest only those lessons and resources it does not already describe.
It exists so that adding a lesson does not require hand-writing a UUIDv5.

The command SHALL NOT overwrite, reorder or remove any existing manifest entry,
in any course's file. A hand-edited title, source or duration SHALL survive every
subsequent run. The manifest, not the command's output, is the source of truth.

The command SHALL derive a new lesson's `id` with the same UUIDv5 scheme used
today, so an entry it appends is indistinguishable from one migrated from the
previous generator.

When a lesson folder holds no video file, the command SHALL append the lesson
with a `durationSeconds` of `null` and report it, rather than guessing a
duration or skipping the lesson silently.

#### Scenario: A new lesson folder is appended

- **WHEN** a developer drops a new lesson folder into a declared module and runs
  the maintenance command
- **THEN** the manifest gains an entry for that lesson with its derived id, slug,
  title, source key and duration, and every pre-existing entry is byte-identical

#### Scenario: A hand-edited entry survives the command

- **WHEN** a developer overrides a lesson's `title` and `source` by hand, then
  runs the maintenance command
- **THEN** both edited values are still present and unchanged afterwards

#### Scenario: A lesson with no local video is reported, not guessed

- **WHEN** the command encounters a lesson folder with a `readme.md` but no video
  file
- **THEN** it appends the lesson with `durationSeconds: null` and reports it as
  needing a declared duration

### Requirement: Lesson identity is preserved across the migration

Lesson and resource ids SHALL be migrated into the manifest byte-for-byte from
the catalog they replace.

Saved progress and playback positions are keyed by lesson id in
`browser-local-storage`. A changed id silently discards a learner's history, so
the migration SHALL be verified id-by-id against the previous catalog before that
catalog is deleted.

#### Scenario: Every migrated id matches the previous catalog

- **WHEN** the migrated manifest is compared against the catalog it replaces
- **THEN** the set of course, module, lesson and resource ids is identical, with
  no additions, removals or changes

#### Scenario: A learner's progress survives the migration

- **WHEN** a learner who had completed lessons and saved playback positions loads
  the app after the migration
- **THEN** the same lessons read as complete and the same positions resume

### Requirement: Video bytes are never tracked by git

The repository SHALL refuse to track video files under the content root,
whichever course they belong to. This SHALL hold independently of which parts of
the content tree are tracked, so that un-ignoring a course's text assets cannot
pull gigabytes of video into the repository.

The Basic Course's non-video assets — lesson notes, posters and PDFs — SHALL be
tracked, because they are the part of its content tree that cannot be
regenerated and are small enough to version.

#### Scenario: A video file under a tracked course is still ignored

- **WHEN** a `.mp4` sits inside the Basic Course's tracked content folder and a
  developer runs `git status`
- **THEN** the video is not listed as addable content

#### Scenario: The Basic Course's text assets are tracked

- **WHEN** a developer clones the repository
- **THEN** the Basic Course's `readme.md`, `thumbnail.jpeg` and PDF files are
  present, and its video files are not

### Requirement: Declared assets are checked against the catalog

`pnpm verify:content` SHALL additionally report every `assets` entry whose key is
absent from the course manifests, and SHALL exit non-zero when there is one.

An exhaustive `assets` block goes stale the moment content is renamed or removed
and the manifests are edited. Without this check the location manifest would
accumulate entries for keys nothing asks for any more, and a reader could no
longer tell which placements are real.

#### Scenario: A stale asset entry is named

- **WHEN** the location manifest declares an `assets` entry for a key the course
  manifests no longer contain
- **THEN** `pnpm verify:content` exits non-zero and names that key as stale

#### Scenario: A location manifest matching the catalog passes

- **WHEN** every `assets` entry names a key the course manifests contain, and every
  key resolves
- **THEN** `pnpm verify:content` exits zero

### Requirement: The declared catalog is the whole catalog

`src/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies.ts` SHALL
build the catalog from the course manifests alone. There SHALL be no hand-written course
seed and no configuration that selects between catalog sources: the courses the manifests
declare are the courses the application serves.

The lesson and resource ports SHALL bind directly to `LocalFilesystemLessonRepository` and
`LocalFilesystemResourceRepository`. No composite adapter SHALL sit between a port and its
single source — an indirection that fans one read out over one delegate hides the wiring
without buying anything back. Should a second content source return, the composite is a
change to make then, not machinery to keep unused now.

Catalog order SHALL come from `Course.sequence`, which each course declares in its own
manifest. The ladder therefore has exactly as many rungs as there are manifests, and moving
a course between rungs is a one-line manifest edit.

Booting without the content root SHALL fail visibly through the assets it cannot serve,
never by silently substituting different courses. A developer who has not obtained the
content sees the declared courses with unresolvable media, which names the real problem.
Lessons whose `source` is an external URL play regardless, because they need nothing from
the content root.

#### Scenario: The catalog holds exactly the declared courses

- **WHEN** the app boots
- **THEN** it serves exactly the courses the manifests under `src/content/` declare, in
  `sequence` order, with no placeholder or fallback course

#### Scenario: A clone without the content root still serves the catalog

- **WHEN** a developer clones the repository and starts the app without the content root
- **THEN** every course, module and lesson renders, locally-stored assets 404, and lessons
  served by an external URL still play

## MODIFIED Requirements

### Requirement: A lesson's video source may be declared as an external URL

The manifest SHALL support declaring a lesson's `source` as an absolute `http(s)`
URL rather than a content key, for lessons whose video is served by someone else
— the Basic Course's lectures stream from YouTube.

A value that is neither an absolute `http(s)` URL nor a well-formed content key
SHALL be rejected.

A declared external source SHALL affect `source` only. `poster`,
`Resource.url` and lesson notes keep their content keys and their existing
resolution, so a lesson served from YouTube still carries a locally-stored
thumbnail and locally-stored resources.

A lesson whose `source` is an external URL SHALL NOT require a local video file
to exist. Its `durationSeconds` is declared in the manifest like every other
lesson's, so the local `.mp4` may be deleted without changing what the
application serves. This replaces the previous rule, under which the on-disk
`.mp4` remained the source of `durationSeconds` via `ffprobe` and therefore could
not be removed.

#### Scenario: A declared lesson serves its external URL

- **WHEN** the manifest declares lesson `2-vowels/1-the-vowel-sound-schwa` with
  `source` `https://www.youtube.com/embed/27WXXMFimvE`
- **THEN** that lesson is served with exactly that `source`, and its `poster` is
  still the content key resolved through `BlobStore`

#### Scenario: A lesson keeping a content key is unaffected

- **WHEN** a lesson declares a `source` that is a content key rather than a URL
- **THEN** the key resolves through `BlobStore` exactly as it does today

#### Scenario: Deleting a hosted lesson's local video changes nothing

- **WHEN** every `.mp4` under the Basic Course is deleted and the app is restarted
- **THEN** all 48 lessons still serve their YouTube `source`, their declared
  duration and their locally-stored poster

#### Scenario: A value that is neither a URL nor a valid key is rejected

- **WHEN** the manifest declares a `source` that is an empty string or a
  site-relative path such as `/videos/x.mp4`
- **THEN** validation fails with a message naming the offending lesson

### Requirement: Lesson-vs-Resource discrimination uses file presence, not folder name

The manifest sync command SHALL classify each lesson folder as follows:

- If the folder contains an `.mp4` file, the lesson is `kind: "video"` with `source` set to the video's content KEY.
- If the folder contains a `readme.md` AND no `.mp4`, the lesson is `kind: "reading"` with `body` set to the file's contents.
- If the folder contains BOTH an `.mp4` and a `readme.md`, the lesson is `kind: "video"` and the `readme.md` becomes its `notesKey` and a resource entry `{ kind: "other", title: "<lesson-title> notes", url: <readme-key> }`.
- Any other file (PDF, DOCX, image) in a lesson folder becomes a resource entry whose `kind` is derived from the file extension: `.pdf` → `"pdf"`, `.pptx`/`.key` → `"slides"`, anything else → `"other"`.
- The first `.jpeg`/`.jpg`/`.png` in a video lesson folder becomes the entry's `poster` KEY. Subsequent images are ignored for poster purposes (they are not surfaced in v1).

These rules SHALL apply only to lessons the manifests do not already describe.
They PROPOSE an entry; they never decide what the application serves, and they
never revise a declaration. A lesson whose folder no longer matches its
declaration keeps the declaration.

#### Scenario: A video lesson with a PDF and a thumbnail

- **WHEN** an undescribed lesson folder contains `video.mp4`, `thumbnail.jpeg`, and `handout.pdf`
- **THEN** the sync command appends a video lesson entry with `source` set to the video key and `poster` set to the thumbnail key, AND a resource entry `{ kind: "pdf", title: "handout", url: <pdf-key> }`

#### Scenario: A reading-only lesson with a readme and a docx

- **WHEN** an undescribed lesson folder contains `notes.md` (no video) and `exercise.docx`
- **THEN** the sync command appends a reading lesson entry with `body` set to the markdown contents, AND a resource entry `{ kind: "other", title: "exercise", url: <docx-key> }`

#### Scenario: A bimodal lesson (video + readme) collapses the readme into a resource

- **WHEN** an undescribed lesson folder contains both `lesson.mp4` and `notes.md`
- **THEN** the sync command appends a video lesson entry (NOT a new bimodal kind) AND a resource entry `{ kind: "other", title: "<lesson-title> notes", url: <notes-key> }`

#### Scenario: An already-declared lesson is not reclassified

- **WHEN** a lesson the manifests declare as `video` with a YouTube `source` has no
  `.mp4` on disk at all
- **THEN** the sync command leaves it untouched, because classification applies only
  to folders no declaration covers

## REMOVED Requirements

### Requirement: Course metadata is declared in an untracked content manifest

**Reason**: The manifest is no longer an untracked overlay of overrides on top of
a filesystem walk. It is now the tracked, complete declaration of the catalog and
lives outside the content tree. Its replacement is the ADDED requirement "The
course catalog is declared in a tracked content manifest", which inverts both the
tracking status and the location, and drops the no-manifest fallback along with
the generator that gave it meaning.

**Migration**: The existing manifest at
`public/local-filesystem-lesson/courses.manifest.json` is split into one file per
course under `src/content/`, each enriched with the lesson and resource rows taken
from the catalog being deleted. The override tables it carried
(`slugOverrides`, `titleFromNotesModules`, `moduleTitleOverrides`,
`lessonTitleOverrides`, `lessonVideoSources`) are resolved during migration and
their results written as the declared values, so no override layer survives.

### Requirement: A tracked example manifest is the template and the reviewed record

**Reason**: The example existed only because the real manifest was untracked,
mirroring the `.env` / `.env.example` split. Now that the real manifest is tracked
it is itself the reviewed record, and a second copy could only drift out of sync.

**Migration**: `scripts/courses.manifest.example.json` is deleted along with the
test that schema-checked it. The tracked manifests under `src/content/` replace it
as the artifact a fresh clone reads to learn the shape, and the schema that
validates them replaces the drift test.

### Requirement: Content seed is generated at build time, not at runtime

**Reason**: The generator no longer exists. The catalog is declared in tracked
per-course manifests rather than derived from the content tree, so there is no
build-time script and no generated `seed-content.ts` to produce.

**Migration**: `scripts/generate-course-content-seed.ts` and
`src/adapters/persistence/in-memory/seed/seed-content.ts` are deleted, along with
the `generate:content-seed` script. The ADDED requirements "The course catalog is
declared in tracked per-course manifests" and "The application reads the catalog
without a code-generation step" replace it. `pnpm sync:manifest` covers the one
job worth keeping — proposing entries for lesson folders nothing describes yet.

### Requirement: Generated seed preserves the original pre-normalization names

**Reason**: The seed's `seedContentSourceNames` map had exactly one consumer, the
generator itself, and both are gone. Nothing in the application ever read it.

**Migration**: None needed. The raw on-disk names remain recoverable from
`rename-manifest.json`, which the normalization step still writes; they simply no
longer round-trip through a generated module.

### Requirement: Generator validates that every emitted key resolves on disk

**Reason**: There is no generator to run the check. Its purpose — catching
slug↔disk drift before it ships — is served by `pnpm verify:content`, which walks
the same inventory, and by the manifest schema, which rejects a malformed key at
load.

**Migration**: `scripts/content-keys/content-keys.ts` now builds its inventory
from the course manifests instead of the deleted seed, so `pnpm verify:content`
and `pnpm move:content` keep checking the same set. Absolute URLs stay excluded,
as before.

### Requirement: Lesson titles come from the notes heading for allowlisted modules

**Reason**: A lesson's title is now declared data. The manifest carries the final
title, so there is no derivation to allowlist and no override table to consult —
`titleFromNotesModules` and `lessonTitleOverrides` no longer exist in any manifest.

**Migration**: Every title those rules produced was resolved during the migration
and written into the manifests verbatim, so no title changed. `sync:manifest`
still reads the first `#` heading when PROPOSING an entry for an undescribed
lesson, but the proposal is a starting value a human may edit, not a rule the
catalog re-applies.

### Requirement: Module titles may be overridden per course

**Reason**: Same as lesson titles: a module's title is declared, not derived, so
`moduleTitleOverrides` has nothing left to override.

**Migration**: Each override was resolved into the module's declared `title`
during the migration. Correcting a module title is now an edit to that one line.

### Requirement: Declared assets are checked against the seed

**Reason**: Renamed and rewritten as "Declared assets are checked against the
catalog": the inventory `pnpm verify:content` compares against is now the course
manifests, not a generated seed.

**Migration**: None. `scripts/content-keys/content-keys.ts` sources the same
inventory from the manifests, so the check covers the same keys it always did.

### Requirement: The generated content seed is the whole catalog

**Reason**: Renamed and rewritten as "The declared catalog is the whole catalog".
The invariant it protects — one catalog source, no fallback, ports bound directly
to their single adapter — is unchanged; only the source is, from a generated
module to the tracked manifests.

**Migration**: None. `use-case-dependencies.ts` reads `contentCatalog` instead of
the `seedContent*` arrays; its existing tests pass unchanged, which is the proof
the rows kept their shape.

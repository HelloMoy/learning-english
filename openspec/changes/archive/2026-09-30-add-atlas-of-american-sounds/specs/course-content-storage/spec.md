## MODIFIED Requirements

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

A manifest MAY declare the course's `track` as `level` or `reference`. A manifest
that declares no `track` SHALL be read as `level`, so every course declared before
tracks existed keeps its meaning without being edited. Any other value SHALL fail
the manifest parse, naming the course.

A lesson's `source` and `poster`, and a resource's `url`, SHALL each be either a
content key resolved through `BlobStore` or an absolute `http(s)` URL used
verbatim. Which one it is SHALL be decided by the value's own shape, exactly as
it is today.

Every manifest SHALL be validated against a Zod schema. A manifest that is
malformed JSON or fails the schema SHALL fail loudly rather than fall back to any
default. Because `slug` and `sequence` must be unique across the whole catalog,
level and reference courses alike, that check SHALL run over the full set after
each file is parsed. There SHALL NOT be a no-manifest fallback: the manifests are
required, and an absent one is an error.

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

#### Scenario: A manifest without a track is a level

- **WHEN** a manifest declares no `track`
- **THEN** it parses and its course's track is `level`

#### Scenario: An unknown track fails the parse

- **WHEN** a manifest declares `"track": "elective"`
- **THEN** `parseCourseManifests` throws `InvalidCourseManifestError` naming that course

### Requirement: The declared catalog is the whole catalog

`src/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies.ts` SHALL
build the catalog from the course manifests alone. There SHALL be no hand-written course
seed and no configuration that selects between catalog sources: the courses the manifests
declare are the courses the application serves.

A course MAY withhold itself from being served by declaring `draft: true` in its own
manifest, in which case it is excluded when the environment hides drafts — see the
`draft-course-visibility` capability. That is a visibility filter over the one source, not
a second source: there is still exactly one place courses are declared, the filter reads
only the manifests' own `draft` field, and no configuration can introduce a course the
manifests do not declare. A course that declares no `draft` field is served in every
environment.

The lesson and resource ports SHALL bind directly to `LocalFilesystemLessonRepository` and
`LocalFilesystemResourceRepository`. No composite adapter SHALL sit between a port and its
single source — an indirection that fans one read out over one delegate hides the wiring
without buying anything back. Should a second content source return, the composite is a
change to make then, not machinery to keep unused now.

Catalog order SHALL come from `Course.sequence`, which each course declares in its own
manifest. The ladder therefore has exactly as many rungs as there are **level** manifests
it serves; a reference course is ordered by its `sequence` but is not a rung. Moving a
course between positions is a one-line manifest edit. Withholding a draft course SHALL
leave the remaining courses in ascending `sequence` order with no renumbering of the
manifests: level numbers are derived from the level courses' order, so a gap in
`sequence` values is not a gap in the rendered ladder.

Booting without the content root SHALL fail visibly through the assets it cannot serve,
never by silently substituting different courses. A developer who has not obtained the
content sees the declared courses with unresolvable media, which names the real problem.
Lessons whose `source` is an external URL play regardless, because they need nothing from
the content root.

#### Scenario: The catalog holds exactly the declared courses

- **WHEN** the app boots with drafts shown, as it does in development
- **THEN** it serves exactly the courses the manifests under `src/content/` declare, in
  `sequence` order, with no placeholder or fallback course

#### Scenario: A draft course is withheld without a second source appearing

- **WHEN** the app boots with drafts hidden and one manifest declares `draft: true`
- **THEN** it serves exactly the remaining declared courses, in `sequence` order, and no
  course is served that the manifests do not declare

#### Scenario: A clone without the content root still serves the catalog

- **WHEN** a developer clones the repository and starts the app without the content root
- **THEN** every served course, module and lesson renders, locally-stored assets 404, and
  lessons served by an external URL still play

#### Scenario: A reference course is not a rung

- **WHEN** the manifests declare two level courses and one reference course
- **THEN** the catalog serves three courses and the ladder has two rungs

### Requirement: Video bytes are never tracked by git

The repository SHALL refuse to track video files under the content root,
whichever course they belong to. This SHALL hold independently of which parts of
the content tree are tracked, so that un-ignoring a course's text assets cannot
pull gigabytes of video into the repository.

The non-video assets of every course whose lectures stream from YouTube — lesson
notes, posters, PDFs and the other files its manifest references — SHALL be
tracked, because they are the part of its content tree that cannot be
regenerated and are small enough to version. Today that is the Basic Course, the
Advanced Intermediate Course and the Atlas of American Sounds.

#### Scenario: A video file under a tracked course is still ignored

- **WHEN** a `.mp4` sits inside the Basic Course's or the Advanced Intermediate
  Course's tracked content folder and a developer runs `git status`
- **THEN** the video is not listed as addable content

#### Scenario: The Basic Course's text assets are tracked

- **WHEN** a developer clones the repository
- **THEN** the Basic Course's `readme.md`, `thumbnail.jpeg` and PDF files are
  present, and its video files are not

#### Scenario: The Advanced Intermediate Course's text assets are tracked

- **WHEN** a developer clones the repository
- **THEN** every poster, notes file and resource the Advanced Intermediate
  Course's manifest references is present, and none of its video files are

#### Scenario: The Atlas's text assets are tracked

- **WHEN** a developer clones the repository
- **THEN** every `thumbnail.jpeg` and `readme.md` the Atlas of American Sounds'
  manifest references is present

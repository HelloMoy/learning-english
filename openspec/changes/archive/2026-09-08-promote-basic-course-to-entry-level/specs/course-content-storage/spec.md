## ADDED Requirements

### Requirement: The generated content seed is the whole catalog

`src/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies.ts` SHALL
build the catalog from `seed-content.ts` alone. There SHALL be no hand-written course seed
and no configuration that selects between seed sources: the courses the manifest declares
are the courses the application serves.

The lesson and resource ports SHALL bind directly to `LocalFilesystemLessonRepository` and
`LocalFilesystemResourceRepository`. No composite adapter SHALL sit between a port and its
single source — an indirection that fans one read out over one delegate hides the wiring
without buying anything back. Should a second content source return, the composite is a
change to make then, not machinery to keep unused now.

Catalog order SHALL come from `Course.sequence`, which each course declares in
`courses.manifest.json`. The ladder therefore has exactly as many rungs as the manifest has
entries, and moving a course between rungs is a manifest edit and a regeneration.

Booting without the content root SHALL fail visibly through the assets it cannot serve,
never by silently substituting different courses. A developer who has not obtained the
content sees the declared courses with unresolvable media, which names the real problem —
the earlier fallback answered a missing content root with a catalog of placeholder
material, which does not.

#### Scenario: The catalog holds exactly the declared courses

- **WHEN** `getCoursePlatformDeps()` is called
- **THEN** `courses.listAvailable()` returns exactly the courses in `seedContentCourses`, in
  `Course.sequence` order, and no other

#### Scenario: No environment variable selects a seed source

- **WHEN** the application boots with no `USE_COURSE_CONTENT_SEED` set, and again with it
  set to any value
- **THEN** the catalog is identical in both cases, because no code reads that variable

#### Scenario: A lesson resolves through the adapter that owns it

- **WHEN** `LessonRepository.byId` is called with an id from the content seed
- **THEN** the lesson comes back with its content keys resolved through the `BlobStore`, and
  an id belonging to no course returns `null`

#### Scenario: Ladder position follows the manifest

- **WHEN** a course's `sequence` is changed in `courses.manifest.json` and the seed is
  regenerated
- **THEN** the home ladder renders that course at its new rung, and no other course's id,
  slug, title or content key changes

## MODIFIED Requirements

### Requirement: Lesson and resource adapters resolve content keys at read time

`LocalFilesystemLessonRepository` and `LocalFilesystemResourceRepository` SHALL accept raw seed rows and a `BlobStore` in their constructors. For every row they return, they SHALL resolve the key-bearing fields through `BlobStore.url(key)` and THEN parse the result with the domain schema (`Lesson.parse` / `Resource.parse`), so a row that resolves to an invalid URL is rejected at the adapter boundary rather than reaching the UI.

These two adapters SHALL be the ones wired for the content seed, and — because the content seed is the whole catalog — the only lesson and resource adapters the dependency graph builds.

Resolution SHALL be applied to `VideoLesson.source`, `VideoLesson.poster` (when present) and `Resource.url`. A `ReadingLesson` row has no key-bearing field and SHALL be parsed unchanged.

#### Scenario: A video lesson row is resolved and parsed on read

- **WHEN** `LocalFilesystemLessonRepository` is constructed with a row whose `source` is the key `course/module/lesson/video.mp4` and a `BlobStore` returning `https://cdn.example.com/<key>`, and `byId` is called for that lesson
- **THEN** the returned `VideoLesson` has `source` equal to `https://cdn.example.com/course/module/lesson/video.mp4` and is a fully parsed domain entity

## REMOVED Requirements

### Requirement: The content seed is opt-in via env var

**Reason**: The flag chose between the hand-written A1 seed and the generated one. The A1
seed is deleted, so the flag's "off" branch would serve an empty catalog — a switch with
one usable position is not a switch. Its second job, keeping a developer without the 15 GB
content root booted onto something, was only ever met by showing placeholder courses.

**Migration**: Remove `USE_COURSE_CONTENT_SEED` from `.env` and `.env.example`; it is no
longer read. `playwright.config.ts` starts its dev server without it. `pnpm dev` now serves
the declared courses unconditionally; obtaining the content root out of band is what makes
their media resolve, and `scripts/README.md` says so.

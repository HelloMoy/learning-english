## Why

There is no single place to declare a course. Adding one today means editing the
generator itself: course metadata is hardcoded in
`scripts/generate-course-content-seed.ts` (`title: humanize(courseSlug)`, a
templated `description`, `language: "en"`, `CONTENT_COURSE_SEQUENCE = 2`), the
walker takes `courseFolders[0]` and discards every sibling with a `console.warn`,
and the per-folder metadata that cannot be inferred from disk is scattered across
three separate maps (`slug-overrides.ts`, `title-overrides.ts`,
`title-from-notes-modules.ts`). A second course is therefore not a content
operation — it is a code change in four files.

## What Changes

- Introduce `public/local-filesystem-lesson/courses.manifest.json`: the one
  declarative file where a course's identity (folder, slug, title, description,
  language, ladder `sequence`) and its slug / lesson-title / notes-heading
  overrides are declared. Adding a course becomes "drop the folder, add an entry,
  regenerate".
- The manifest is **untracked**. `public/local-filesystem-lesson/` is already
  gitignored in full, so the manifest is ignored by the existing rule and sits
  beside the ~15 GB of content it describes — present and absent together with it.
- Commit `scripts/courses.manifest.example.json` as the tracked template and the
  record of the current course's reviewed values, mirroring the repo's existing
  `.env` / `.env.example` split.
- The manifest is **optional**. With no manifest on disk, the generator keeps
  producing exactly today's output, so a machine that has content but not yet a
  manifest is not broken.
- **BREAKING** (build-time only): the generator emits every course listed in the
  manifest instead of silently keeping the first folder. `seed-content.ts` gains
  `seedContentCourses` and drops the singular `seedContentCourse` /
  `SEED_CONTENT_COURSE_ID`. Consumers are four files —
  `use-case-dependencies.ts` (+ its test) and two e2e specs.
- **BREAKING**: `scripts/slug-overrides.ts`, `scripts/title-overrides.ts` and
  `scripts/title-from-notes-modules.ts` are removed; their current entries move
  into the example manifest and, at generation time, are read from the manifest.
- A malformed manifest fails the generator loudly (Zod-validated, non-zero exit,
  no partial write) rather than silently falling back.

## Capabilities

### New Capabilities

None. The manifest is the declaration layer of an existing capability, not a new one.

### Modified Capabilities

- `course-content-storage`: the seed generator gains a manifest as its source of
  course metadata and per-folder overrides; it emits N courses instead of one;
  the three override modules are replaced by manifest fields; the "reviewed in
  code review" guarantee moves from the override files to the committed
  `seed-content.ts` diff plus the tracked example manifest.

## Non-goals

- No runtime read of the manifest. It is build-time input to the generator only;
  the app keeps booting from the committed `seed-content.ts`.
- No change to `BlobStore`, to key resolution, or to how lessons and resources are
  discriminated from file presence.
- No change to `rename-manifest.json` or to `normalize-content-disk.ts` beyond
  sourcing slug overrides from the new manifest.
- No change to the `USE_COURSE_CONTENT_SEED` opt-in, or to the hand-written A1
  seed in `seed.ts`.
- Not a CMS, an authoring UI, or a schema for lesson-level content — lessons and
  resources stay inferred from disk.
- No second real course is added by this change; it makes adding one possible.

## Impact

- **Code**: `scripts/generate-course-content-seed.ts` (manifest load + multi-course
  walk), new `scripts/courses-manifest/` module (Zod schema + loader), deletion of
  `scripts/slug-overrides.ts`, `scripts/title-overrides.ts`,
  `scripts/title-from-notes-modules.ts` and their tests,
  `scripts/normalize-content-disk.ts`, `scripts/resolve-slug.ts`,
  `scripts/discriminate-lesson.ts`.
- **Generated**: `src/adapters/persistence/in-memory/seed/seed-content.ts` is
  regenerated with plural course exports.
- **Consumers**: `use-case-dependencies.ts` and `use-case-dependencies.test.ts`;
  `e2e/home-course-ladder.spec.ts` and `e2e/course-catalog.spec.ts`.
- **Repo**: new tracked `scripts/courses.manifest.example.json`; a comment in
  `.gitignore` documenting why the live manifest is untracked.
- **Risk**: the manifest's values are no longer reviewable as a diff. Mitigated by
  the tracked example manifest and by the fact that every value it produces lands
  in the committed `seed-content.ts`, where a reviewer still sees each title and
  slug change.

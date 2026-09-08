## 1. Schema and flattening (pure logic — no manifest files yet)

- [x] 1.1 Define the per-course manifest Zod schema — course → modules → lessons
      → resources, with `id`, `slug`, `title`, `kind`, `sequence`, `source`,
      `durationSeconds`, optional `poster` and optional `notesKey` per lesson
      (TDD: test → impl). Cover: valid manifest parses; a missing or `null`
      `durationSeconds` is rejected by lesson name; a `source` that is neither an
      absolute `http(s)` URL nor a well-formed content key is rejected;
      `slug`/`sequence` uniqueness is checked across the whole set, not within a
      file, and names both offending courses. Mirror
      `scripts/courses-manifest/courses-manifest.test.ts`.
- [x] 1.2 Implement the flattening functions that turn the nested manifests into
      the row arrays the in-memory repositories expect — courses, modules,
      `LessonRow[]`, `ResourceRow[]`, and the `Record<lessonId, notesKey>` map
      `LocalFilesystemLessonNotesRepository` already takes (TDD: test → impl).
      Assert declaration order is preserved.

## 2. Migration (both artifacts still present)

- [x] 2.1 Write `scripts/migrate-seed-to-manifest.ts`: read `seed-content.ts` and
      the existing `public/local-filesystem-lesson/courses.manifest.json`, resolve
      every override table (`slugOverrides`, `titleFromNotesModules`,
      `moduleTitleOverrides`, `lessonTitleOverrides`, `lessonVideoSources`) into
      concrete declared values, and emit one `src/content/<course-slug>.json` per
      course plus the index (TDD: test → impl).
- [x] 2.2 Run the migration to produce `src/content/basic-course.json` and
      `src/content/advanced-intermediate-course.json`.
- [x] 2.3 Write the migration-fidelity test (temporary, deleted with the script in
      6.2): set equality of every course, module, lesson and resource id between
      the old seed and the new manifest — no additions, removals or changes — plus
      per-lesson equality of `source`, `durationSeconds`, `poster` and `notesKey`
      (TDD: test → impl). This is risk R1's guard and MUST pass before anything is
      deleted.
- [x] 2.4 Confirm both migrated manifests parse against the 1.1 schema with no
      `null` durations. Any lesson the migration could not resolve is fixed here,
      not defaulted.
- [x] 2.5 Write `src/content/courses.ts`: the index that statically imports each
      course manifest and exports the list. No path alias is added and no config
      file is touched — `@/*` already resolves `src/` (design D2).

## 3. Loader and consumers

- [x] 3.0 Create `src/adapters/persistence/content-manifest/content-manifest.ts`:
      reads the manifests through `@/content/courses`, parse-once at module load,
      exports the typed catalog and the flattened rows (TDD: test → impl). Follow
      folder-per-entity; add JSDoc per the project's TypeDoc rules.
- [x] 3.1 Repoint `use-case-dependencies.ts` at the content-manifest loader
      instead of the `seedContent*` arrays (TDD: test → impl). Its existing tests
      must stay green unchanged — that is the proof the rows kept their shape.
- [x] 3.2 Repoint `scripts/content-keys/content-keys.ts` at the manifests, keeping
      absolute URLs out of the inventory so `verify:content` and `move-content`
      still see the same set (TDD: test → impl). Existing tests pin this.
- [x] 3.3 Run `pnpm verify:content` and confirm it reports the same result as it
      does today against the unchanged content tree.

## 4. Maintenance command

- [x] 4.1 Write `scripts/sync-course-manifest.ts` as append-only merge into the
      course's own file: appends lessons and resources whose id is absent, never
      overwriting, reordering or removing an existing entry, and never touching
      another course's manifest (TDD: test → impl). Cover: a new lesson folder is
      appended with its derived UUIDv5 id; a hand-edited `title` and `source`
      survive a run byte-identical; a lesson folder with a `readme.md` but no video
      is appended with `durationSeconds: null` and reported. Mirror the fixtures in
      `scripts/generate-course-content-seed.test.ts`.
- [x] 4.2 Add the `sync:manifest` script to `package.json` — needs explicit
      approval from the human partner before editing that file.

## 5. Delete the videos (only after 2.3 passes)

- [x] 5.1 Verify all 48 Basic Course YouTube URLs resolve before removing any local
      file. A backup of the files exists outside the repo (design R3), so this is
      recoverable — but 2.3 must still be green first, because the seed is the only
      record of the 48 durations.
- [x] 5.2 Delete the 48 `.mp4` files under
      `public/local-filesystem-lesson/basic-course/**`, and only those: every
      `readme.md`, `thumbnail.jpeg` and `.pdf` stays, and
      `advanced-intermediate-course` is untouched. Confirm with a file count by
      extension before and after.
- [x] 5.3 Add the Playwright e2e flow asserting a Basic Course lesson page renders
      the YouTube iframe and its locally-stored poster with the `.mp4` files gone
      (TDD: test → impl). Run per the project's e2e notes: `PLAYWRIGHT_BASE_URL`,
      `--workers=1`.

## 6. Remove the generator

- [x] 6.1 Delete `scripts/generate-course-content-seed.ts`, its two test files, the
      `generate:content-seed` package script (approval needed for `package.json`),
      `scripts/courses.manifest.example.json` and the test that schema-checked it.
- [x] 6.2 Delete `src/adapters/persistence/in-memory/seed/seed-content.ts`,
      `scripts/migrate-seed-to-manifest.ts` and the temporary 2.3 test.
- [x] 6.3 Demote `scripts/discriminate-lesson.ts` to a sync-command input: it no
      longer decides what the application serves. Keep its tests green.
- [x] 6.4 Delete `public/local-filesystem-lesson/courses.manifest.json` and remove
      the now-dead `!public/local-filesystem-lesson/courses.manifest.json`
      negation from `.gitignore` (the manifests now live under `src/`, which was
      never ignored).
- [x] 6.5 Grep for remaining references to the seed in comments and JSDoc
      (`local-filesystem-lesson-repository.ts`,
      `local-filesystem-resource-repository.ts`, `content-locations.ts` all mention
      it) and update the prose to describe the manifest.

## 7. Track the content

- [x] 7.1 Commit the Basic Course's text assets (~25 MB: 49 `readme.md`, 48
      `thumbnail.jpeg`, 40 `.pdf`) and the manifests under `src/content/`. Confirm
      `git add -An` lists zero video files first.

## 8. Verification

- [x] 8.1 Run `pnpm verify` (typecheck, format:check, lint, test:run) and fix any
      failure at its root cause — no `@ts-ignore`, no `eslint-disable`, no
      loosened config.
- [x] 8.2 Run `pnpm test:e2e` for the lesson-view flows per the project's e2e
      notes and confirm the Basic Course plays from YouTube with its videos gone.
- [x] 8.3 Verify the app in the browser with Playwright MCP: a Basic Course lesson
      renders the YouTube iframe, its poster, its notes and its PDF resources, and
      an `advanced-intermediate-course` lesson still plays its local video.
- [x] 8.4 Measure the bundle impact of the imported JSON against the deleted seed
      module (risk R5) and report the delta rather than assuming it is neutral.

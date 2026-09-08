## Context

The catalog is produced by `scripts/generate-course-content-seed.ts`, which walks
the content tree, probes each `.mp4` with ffprobe, and writes a 4,180-line
`src/adapters/persistence/in-memory/seed/seed-content.ts`. That module exports
six arrays (`seedContentCourses`, `seedContentModules`, `seedContentLessonRows`,
`seedContentResourceRows`, `seedContentSourceNames`, `seedContentNotesKeys`)
which `use-case-dependencies.ts` turns into repositories.

Today's manifest (`public/local-filesystem-lesson/courses.manifest.json`, 118
lines) is an override layer, not a catalog: it declares course metadata and four
override tables, and the generator infers everything else from disk.

Current scale: 2 courses, 155 video lessons, 0 reading lessons, 193 resources.

Two couplings block deleting the Basic Course's 8.9 GB of already-on-YouTube
video: `classifyLessonFolder` decides a folder is a video lesson only when it
finds a video file, and `buildLessonRow` reads `durationSeconds` from that file.

Constraints that shape the design:

- **Hexagonal boundaries.** `src/domain/**` may import only `zod` and
  `neverthrow`. The manifest is adapter-layer concern; nothing here reaches the
  domain.
- **Lesson ids are a join key.** `browser-local-storage` stores progress and
  playback positions keyed by lesson id. Ids must survive the migration exactly.
- **The manifest becomes hand-editable.** Whatever shape it takes, a human has to
  read and edit it. That is the point of the change, and it rules out simply
  renaming the generated arrays to `.json`.

## Goals / Non-Goals

**Goals:**

- The manifest is the complete, tracked, hand-editable source of truth for the
  catalog, and lives outside the content tree.
- The application consumes it with no generation step and no runtime filesystem
  access for catalog data.
- The Basic Course's 48 `.mp4` files can be deleted with no observable change.
- Adding a lesson does not require hand-writing a UUIDv5.
- Every existing id, and therefore every learner's saved progress, survives.

**Non-Goals:**

- Changing `BlobStore`, URL resolution, the player, or anything in `src/domain/**`.
- Deleting the `advanced-intermediate-course` videos.
- Migrating content storage to S3/R2.
- Rewriting `normalize-content-disk`, `move-content`, `materialize-content-assets`
  or `reshape-course-tree` beyond their coupling to the deleted seed.

## Decisions

### D1. One manifest per course, nested inside

Each course is one file — `src/content/<course-slug>.json` — enumerated by an
index module `src/content/courses.ts`. Within a file, courses contain modules,
modules contain lessons, lessons contain their resources.

*Why one file per course:* the file is the unit of editing and the unit of merge
conflict. The Basic Course (48 lessons, now stable on YouTube) and the Advanced
Intermediate Course (107 lessons, still moving) have different lifecycles; a
change to one has no business touching the other's file. It also means opening
~60 KB to edit a lesson rather than ~200 KB.

*Alternative considered:* a single `courses.manifest.json`. Rejected — with 155
lessons in one hand-edited file, every content branch conflicts with every other.
Both directions are cheap to reverse, so this is a judgement call, not a
one-way door.

*Cost:* static import cannot enumerate a directory, so adding a course means
adding one import line to the index. Explicit by necessity, and one line.

*Why nested within a file:*

the file's whole purpose is to be read and edited by a person. The
generated seed is flat — four parallel arrays joined by uuid — which is precisely
what makes 4,180 lines unreviewable: you cannot tell which resource belongs to
which lesson without grepping a uuid. Nesting also makes an orphaned `lessonId`
unrepresentable rather than merely invalid.

*Alternative considered:* mirror the seed's flat arrays as JSON. Rejected — it
would be a cheaper migration and a worse artifact, preserving the exact property
we are trying to remove.

*Cost:* the loader must flatten nested lessons and resources into the row arrays
the in-memory repositories expect. That is a pure function, easy to test, and it
keeps the repositories untouched.

### D2. The manifests live under `src/content/`, and no new path alias is added

`src/content/<course-slug>.json` plus `src/content/courses.ts`.

*Why under `src/`:* the alias `@/*` → `./src/*` already resolves there. A
`@content/*` alias would have to be declared twice — `tsconfig.json` declares the
paths and `vitest.config.ts` declares its own `resolve.alias` by hand — giving two
files that can drift apart, both of which the human partner must approve. Putting
the data where the existing alias already points costs nothing and needs no
config change at all.

*Why `src/` is right and not merely convenient:* the manifests are consumed by
static import, so they are resolved at build time and land in the bundle. They are
a data module, exactly like the `seed-content.ts` they replace — which also lived
under `src/`. A root-level `content/` would be the correct home if the catalog
were read at runtime; it is not.

*Alternative considered:* root `content/` with a relative import from the loader.
Rejected — the relative path is not confined to one file, since the sync command,
the migration script and the tests all read the manifests too.

*ESLint:* `local-structure/folder-per-entity` watches `src/domain`, `src/lib`,
`src/hooks` and the three persistence-adapter roots. `src/content/` is not watched,
and the rule only inspects `.ts`/`.tsx`, so a flat `.json` there is not a
violation.

### D3. The loader is an adapter module that validates once at import

A new `src/adapters/persistence/content-manifest/content-manifest.ts` statically
imports the manifests through the index, parses each with a Zod schema, and
exports the typed catalog plus the flattened rows.

*Why validate at all, given TypeScript?* `resolveJsonModule` types the JSON by
its literal shape, which says nothing about whether `durationSeconds` is present
on every lesson or whether two courses share a `sequence`. The file is now
hand-edited, so it needs a guard at the point of use, not only in CI. Parsing 155
lessons costs milliseconds and happens once per process. Uniqueness of `slug` and
`sequence` is checked across the whole set once every file is parsed, since no
single file can see the others.

*Alternative considered:* validate only in a CI test and trust the types at
runtime. Rejected — a manifest edited on a branch would fail at render time with
an unhelpful error instead of at load with a named one.

### D4. Duration is declared, and `null` is a loud failure

The serving schema requires `durationSeconds: number`. The maintenance command
writes `null` when it cannot determine a duration, which then fails validation
with a message naming the lesson.

*Why:* this is the one field with no fallback — the domain requires it, and once
the `.mp4` is gone there is nothing to probe. Making the invalid state
representable in the file but rejected by the schema turns "I added a lesson and
forgot the duration" into a named error rather than a silent zero.

*Alternative considered:* default to `0`. Rejected — a zero-duration lesson
renders as a broken progress bar and looks like a player bug.

### D5. Migration is a one-shot script that is deleted afterwards

`scripts/migrate-seed-to-manifest.ts` imports the existing `seed-content.ts` and
the existing manifest, resolves every override table into concrete declared
values, and writes one `src/content/<course-slug>.json` per course plus the index.
It runs once; the task list deletes it in the same change.

*Why a script rather than hand-authoring:* 155 lessons and 193 resources with
uuid ids. Hand-transcription would guarantee an id typo, and an id typo silently
destroys a learner's progress (see R1).

*Why deleted afterwards:* keeping it implies the seed still exists to migrate
from. It does not.

### D6. The maintenance command merges, never overwrites

`scripts/sync-course-manifest.ts` (exposed as `pnpm sync:manifest`) reuses
`classifyLessonFolder`, `probeDurationSeconds` and the uuid helpers, but its
output is a *merge* into the existing JSON: it appends entries whose id is absent
and touches nothing else.

*Why append-only:* the moment it can overwrite, the disk is the source of truth
again and the change is undone. Append-only is what lets a hand-edited title or a
YouTube `source` survive indefinitely.

*Naming:* `sync`, not `generate`, because it does not produce the catalog — it
fills gaps in one that already exists.

### D7. `discriminate-lesson.ts` survives, demoted

`classifyLessonFolder` stops deciding what the application serves and becomes an
input to the maintenance command only.

*Why keep it:* it encodes real knowledge about the on-disk shape (video/image/
readme conventions, resource classification, title-from-heading rules) that the
sync command still needs. Deleting and rewriting it would discard working,
tested logic to make a point.

### D8. Ordering: migrate and verify before deleting anything

The task list deletes `seed-content.ts` and the 48 `.mp4` files only after the
migrated manifest is verified id-by-id against the seed.

*Why this is a decision and not an obvious step:* the seed is the only remaining
record of the 48 durations once the videos are gone. Deleting either one first
makes the verification impossible and the change irreversible.

### D9. `notesKey` becomes a declared per-lesson field; `sourceNames` is dropped

Of the seed's two lookup maps, only one has a runtime consumer.
`seedContentNotesKeys` is passed to `LocalFilesystemLessonNotesRepository`, which
resolves a lesson's Markdown notes from it — so it survives as an optional
`notesKey` on each lesson, and the loader rebuilds the `Record<lessonId, key>`
that repository already expects. `seedContentSourceNames` is read only by the
generator and its own tests; it is deleted with them.

*Why declare `notesKey` per lesson rather than keep a side table:* the side table
exists because the generator emitted flat arrays. Nested (D1), the notes key
belongs on the lesson it describes, and the flattening step reconstitutes the map
at the adapter boundary without changing the repository's contract.

## Risks / Trade-offs

**R1. An id changes during migration and silently destroys saved progress** →
The migration script copies ids verbatim rather than re-deriving them, and a test
asserts set equality of every course, module, lesson and resource id between the
old seed and the new manifest. That test runs while both artifacts still exist,
which is why D8 orders the deletions last.

**R2. The manifests become merge-conflict magnets** → Addressed by D1: one file
per course bounds a conflict to the course being edited, and nesting bounds it
further to the lesson's own hunk. Residual risk is two people editing the same
course; that is inherent to a single source of truth and is accepted.

**R3. ~~Deleting 8.9 GB is irreversible~~ — retired** → A backup of the 48 files
exists outside the repository, confirmed by the human partner, so the deletion is
recoverable. The task list still verifies all 48 YouTube URLs resolve before the
local files are removed.

**R4. ~~`content/` is outside the `@/*` path alias~~ — resolved by D2** → The
manifests live under `src/content/`, which `@/*` already resolves. No alias is
added, and neither `tsconfig.json` nor `vitest.config.ts` is touched.

**R5. ~~Bundle size~~ — measured, no impact** → 180 KB of JSON replaces a
4,180-line TS module carrying the same data. Measured after the change: the
catalog does not appear in `.next/static` at all, so the client bundle is
unchanged (2.3 MB). The pages that read it are Server Components, which send the
one lesson they rendered rather than the catalog. "Lands in the bundle" in D3
means the server bundle.

**R6. `pnpm verify:content` and `move-content` read the deleted seed** →
`content-keys.ts` is the shared inventory both walk; repointing it at the
manifest fixes both. Its existing tests pin the behavior.

## Migration Plan

1. Write the migration script; run it to produce `src/content/<slug>.json` per
   course plus `src/content/courses.ts`.
2. Verify: id-by-id equality against the seed, plus a rendered-catalog diff.
3. Repoint `use-case-dependencies` and `content-keys` at the manifest loader.
4. Delete `seed-content.ts`, the generator, the example manifest, and the old
   manifest under `public/`.
5. Delete the 48 Basic Course `.mp4` files and remove the now-dead `.gitignore`
   manifest negation.
6. Track the Basic Course's text assets.

**Rollback:** through step 3 the change is a pure addition — the seed still
exists and still serves. After step 4, rollback is `git revert`; after step 5 the
video bytes are gone for good, which is why it is last.

## Testing strategy

Red → Green → Refactor on every task, per `test-driven-development`.

- **Vitest unit — manifest schema and loader** (`content-manifest.test.ts`,
  colocated): valid manifest parses; missing `durationSeconds` is rejected by
  name; `null` duration is rejected; duplicate `slug`/`sequence` across courses
  is rejected; a `source` that is neither absolute URL nor valid key is rejected;
  nested lessons and resources flatten to the row arrays in declaration order.
  Mirrors `scripts/courses-manifest/courses-manifest.test.ts`, which already
  tests this schema's ancestor.
- **Vitest unit — migration fidelity** (temporary, deleted with the script): set
  equality of every id between `seed-content.ts` and the migrated manifest; every
  lesson's `source`, `durationSeconds` and `poster` match. This is R1's guard.
- **Vitest unit — sync command** (`sync-course-manifest.test.ts`): appends an
  undescribed lesson with a derived id; leaves a hand-edited entry byte-identical;
  writes `null` duration and reports when no video file is present. Mirrors
  `scripts/generate-course-content-seed.test.ts` fixtures.
- **Vitest unit — `resolve-content-row`**: unchanged behavior, existing tests must
  stay green; they already cover the absolute-URL bypass.
- **Vitest unit — `content-keys`**: inventory built from the manifest excludes
  absolute URLs, so `verify:content` and `move-content` see the same set. Existing
  tests pin this.
- **Vitest component — none.** No component behavior changes; the rows handed to
  the UI keep their shape.
- **Playwright e2e** (`e2e/`): one flow asserting a Basic Course lesson page
  renders the YouTube iframe and a locally-stored poster *after* the `.mp4` files
  are deleted. This is the end-to-end proof of the change's whole point, and the
  only layer that can catch a regression in the deleted-bytes state. Run per the
  project's e2e notes (`PLAYWRIGHT_BASE_URL`, `--workers=1`).

## Open Questions

None blocking. Resolved during design, kept for the record:

- **`@content/*` path alias?** No. The manifests live under `src/content/`, which
  the existing `@/*` alias already resolves, so no config file is touched. See D2
  and R4.
- **One manifest or one per course?** One per course. See D1.
- **Where do the manifests live?** `src/content/`, not a root-level `content/`,
  because they are a build-time data module. See D2.
- **Command name.** `pnpm sync:manifest`, sitting beside the existing
  `normalize:content` / `verify:content` / `move:content` family. Still open to a
  rename; it changes one line in `package.json`.
- **Backup of the 48 `.mp4` files?** Confirmed to exist outside the repo, so the
  deletion in task group 5 is recoverable and R3 is retired.
- **Does `seedContentSourceNames` still have a consumer?** No — only the generator
  and its own tests read it, so it disappears with the seed. `seedContentNotesKeys`
  is different: `LocalFilesystemLessonNotesRepository` consumes it at runtime, so
  it survives as a per-lesson `notesKey` field. See D9.

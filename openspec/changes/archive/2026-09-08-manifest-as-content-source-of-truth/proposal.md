## Why

The course catalog is derived from the content tree on disk, so the disk is the
source of truth and nothing on it can be deleted. The Basic Course's 48 lectures
already stream from YouTube, but their 8.9 GB of `.mp4` files cannot be removed:
`classifyLessonFolder` only calls a folder a video lesson when it finds a video
file in it, and `buildLessonRow` reads `durationSeconds` out of that same file
with ffprobe. Delete the bytes today and the next `pnpm generate:content-seed`
silently downgrades all 48 lessons to reading lessons — no video, no poster.

That coupling costs more than the disk space. The 15 GB tree slows the dev
server, it cannot be versioned, and the catalog it produces is a 4,180-line
generated TypeScript file that no one can review or hand-edit. The catalog is
data; it should be declared as data.

## What Changes

- **The manifest declares the whole catalog.** Today it carries only metadata
  and per-folder overrides (8 KB) while the generator discovers the rest by
  walking the tree. It gains the full shape: every course, module, lesson
  (id, slug, title, kind, `source`, `durationSeconds`, `poster`) and every
  resource. Nothing about a course is inferred from the filesystem any more.
- **The manifest splits into one file per course under `src/content/` and is
  tracked by git.** `src/content/<course-slug>.json`, enumerated by
  `src/content/courses.ts`. One course is one file, so the file is both the unit
  of editing and the unit of merge conflict. It lives under `src/` because the
  existing `@/*` alias already resolves there — a new `@content/*` alias would
  have to be declared twice, in `tsconfig.json` and again in `vitest.config.ts`.
  It stops living inside `public/`, so it is no longer served at a public URL and
  no longer depends on the 15 GB tree being present. A fresh clone gets a working
  catalog. **BREAKING** — this inverts the current spec requirement that the
  manifest is untracked and lives beside the content.
- **The adapters read the manifests by static import.** `use-case-dependencies`
  consumes the parsed manifests instead of `seedContent*` arrays, with the shape
  validated at load. Data lands in the bundle exactly as it does today —
  no `fs` at runtime, no per-request cost.
- **`seed-content.ts` is deleted**, and with it `generate-course-content-seed.ts`
  and the `generate:content-seed` script. **BREAKING** — adding a lesson is no
  longer "drop files in a folder and regenerate code".
- **A maintenance command replaces the generator.** It scans the content tree
  and appends to the manifest only the lessons it does not already describe,
  never overwriting a hand-edited entry. It exists so that adding a lesson does
  not mean typing a UUIDv5 by hand; the manifest, not the command's output, is
  the source of truth.
- **The Basic Course's 48 `.mp4` files are deleted** — 8.9 GB. Their
  `readme.md`, `thumbnail.jpeg` and PDFs stay, and are tracked by git for the
  first time (~25 MB).
- **Lesson ids are frozen as declared data.** They are UUIDv5 values derived
  from slugs today. Migrating them into the manifest must preserve every current
  id byte-for-byte: `browser-local-storage` keys saved progress and playback
  positions by lesson id, so a changed id silently loses a learner's history.
- **`scripts/courses.manifest.example.json` is removed.** It exists only because
  the real manifest is untracked; once the real one is in git it is the record.

## Capabilities

### New Capabilities

None. This changes how an existing capability sources and stores the catalog.

### Modified Capabilities

- `course-content-storage`: the manifest becomes the complete, tracked,
  code-independent declaration of the catalog rather than an untracked overlay
  of overrides on top of a filesystem walk. This is the capability's largest
  change to date — 7 requirements added, 2 modified, 9 removed:

  **Removed**, because they describe a generator that no longer exists: the
  untracked-manifest requirement, the example-manifest template, "Content seed is
  generated at build time", "Generated seed preserves the original
  pre-normalization names", "Generator validates that every emitted key resolves
  on disk", the two title-derivation requirements (`titleFromNotesModules`,
  `moduleTitleOverrides` — titles are declared data now), and the two renamed in
  place ("Declared assets are checked against the seed", "The generated content
  seed is the whole catalog").

  **Modified**: the declared-video-source rules (the scenario "A declared lesson
  still reports the local file's duration" no longer holds — duration becomes
  declared data), and lesson-vs-resource discrimination, which survives as an
  input to the sync command rather than as the rule that decides what is served.

  The "BlobStore is the single point of URL resolution" requirement is unchanged
  and still governs how a declared key becomes a URL.

## Non-goals

- **Deleting the `advanced-intermediate-course` videos.** That course keeps
  every `.mp4` local and keeps resolving them through the BlobStore.
- **Tracking video bytes in git.** The `.gitignore` refuses `.mp4`/`.mov`/
  `.webm`/`.mkv` under the content root regardless of course.
- **Changing `BlobStore` or URL resolution.** A declared content key resolves
  exactly as it does now, including the absolute-URL bypass for YouTube.
- **Touching the domain.** No entity, port or use case changes; the manifest is
  read in the adapter layer, so the hexagon's boundary rules are unaffected.
- **Migrating content to S3/R2.** Moving the manifest out of `public/` makes
  that migration easier later, but no storage backend changes here.
- **Touching the player, playback, progress or resume behavior.**
- **Re-encoding, re-hosting or changing any video.** The 48 YouTube URLs already
  in the seed are carried over verbatim.
- **Rewriting the other content scripts.** `normalize-content-disk`,
  `move-content`, `materialize-content-assets` and `reshape-course-tree` keep
  operating on the disk tree; only their coupling to the deleted seed changes.

## Impact

**Content data**

- `src/content/<course-slug>.json` — new tracked home of the full catalog, one
  file per course, plus `src/content/courses.ts` enumerating them.
- `public/local-filesystem-lesson/courses.manifest.json` — removed after
  migration.
- `public/local-filesystem-lesson/basic-course/**/*.mp4` — 48 files, 8.9 GB,
  deleted. Every sibling asset stays.
- `.gitignore` — already rewritten to track the Basic Course's text assets and
  refuse video bytes; the manifest negation becomes dead once the file moves out
  of `public/` and must be removed.

**Scripts (`scripts/`)**

- `generate-course-content-seed.ts` (+ its two test files) — deleted.
- `discriminate-lesson.ts` — its ffprobe/classification role moves into the new
  maintenance command; `classifyLessonFolder` stops deciding lesson kind for the
  app.
- `content-keys/content-keys.ts` — reads the manifest instead of importing the
  deleted seed. `verify-content.ts` and `move-content.ts` follow through the
  shared inventory.
- `courses-manifest/courses-manifest.ts` — schema grows from an override table
  to the full catalog shape.
- `courses.manifest.example.json` — deleted.
- New maintenance command (name TBD in design) + its tests.

**Adapters (`src/`)**

- `persistence/in-memory/seed/seed-content.ts` — deleted (4,180 lines).
- `persistence/in-memory/use-case-dependencies/use-case-dependencies.ts` —
  sources the catalog from the parsed manifest.
- A new module that loads, validates and types the manifests for the adapters,
  and flattens them into the row arrays the repositories already take.

**Not affected**

- `src/domain/**`, the BlobStore family, the player, and every repository
  contract. The rows the adapters hand to `resolveLessonRow` keep their shape.

**Risk to call out**

- Lesson ids are the join key for saved progress and playback positions in
  `browser-local-storage`. The migration must be verified id-by-id against the
  current seed before the old one is deleted.

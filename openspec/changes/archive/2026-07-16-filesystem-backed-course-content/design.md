## Context

The codebase implements a course platform on a hexagonal architecture. The domain owns `Course`, `Module`, `Lesson`, `Resource` entities and declares `LessonRepository` / `ResourceRepository` ports. The current adapters (`InMemoryLessonRepository`, `InMemoryResourceRepository`) read from a single hardcoded `seed.ts` containing one fictitious A1 course with three lessons.

`public/local-filesystem-lesson/advanced-intermediate-course/` (~15 GB) holds the real "Advanced Intermediate Pronunciation" course — 10 sections, ~107 lessons with `.mp4` + `readme.md` + thumbnails, ~30 PDFs, ~2 `.docx` files. Folder names contain spaces, `&`, `#`, `:`. Files within lessons are not always uniquely named (multiple folders share a `Aprende Inglés Americano con Fluidez desde Cero.mp4` filename).

The user has stated the local folder is **intentionally temporary**: production will move assets to an S3 or R2 bucket. The local adapter must be designed so the bucket migration is a config swap, not a rewrite.

## Goals / Non-Goals

**Goals:**

- Expose `public/local-filesystem-lesson/` content through the existing `LessonRepository` and `ResourceRepository` ports.
- Introduce a `BlobStore` abstraction that the lesson/resource adapters depend on, so swapping the backing store (local FS → S3 → R2) is a constructor injection, not an adapter rewrite.
- Generate a committed, reproducible seed file from the filesystem so dev builds do not scan 15 GB on every boot and so content additions show up as diffs.
- Compute `durationSeconds` from `ffprobe` at generation time (not runtime) and embed it in the seed.
- Preserve the existing A1 hardcoded seed as the default fixture (tests, Storybook); the new content seed is opt-in via env var.

**Non-Goals:**

- No domain changes — entities, ports, and use cases are untouched.
- No `S3BlobStore` / `R2BlobStore` implementation in this change — those land in a follow-up. The folder structure reserves space for them.
- No signed URL support — R2 public buckets don't need signing; if signed URLs are needed later, the `BlobStore` interface should already accommodate that move (resolve at runtime, not at seed-gen time).
- No CDN / streaming / HLS conversion — those are downstream concerns.
- No renaming or reorganization of the source folder layout — the script must adapt to whatever is on disk.

## Decisions

### 1. `BlobStore` lives under `src/adapters/persistence/blob-store/`, NOT under `src/domain/ports/`

`BlobStore` is a driven-adapter primitive, not a domain port. The domain doesn't know about URLs or blob storage; it only knows about `Resource.url` / `VideoLesson.source` as opaque strings. Putting `BlobStore` under `domain/ports/` would violate `architecture-boundaries` (the domain must not depend on adapter concepts). It belongs next to its implementations under `src/adapters/persistence/blob-store/`.

**Alternatives considered:**

- _Inline the URL logic in each adapter_ — rejected. Duplicates string concatenation in two places and makes the S3 swap involve two files instead of one.
- _Put the BlobStore in a separate `src/lib/` folder_ — rejected. The project organizes by hexagonal layer, not by type.

### 2. `BlobStore` resolves `key → URL` and `key → exists`, not `key → bytes`

The adapter does not stream bytes — Next.js serves files directly from `/public/`, and S3 in production will be served via CDN. `BlobStore` is a URL resolver, not a content fetcher. This keeps the abstraction minimal.

```ts
interface BlobStore {
  url(key: string): string;
  exists(key: string): Promise<boolean>;
}
```

**Alternatives considered:**

- _Add `getBytes(key): Promise<Uint8Array>`_ — deferred. Not needed for v1; can be added without breaking the interface.
- _Add `getMetadata(key)` for size/content-type_ — deferred. The seed generator reads these at build time directly via `fs.stat`, not via the BlobStore.

### 3. URLs are pre-resolved in the seed, not at render time

`VideoLesson.source` and `Resource.url` are opaque strings in the domain. The seed generator calls `blobStore.url(key)` once and bakes the result into `seed-content.ts`. At render time, Next.js / the browser consume the URL directly.

**Why:** R2 with public access has stable URLs and zero egress fees, so pre-resolution is safe. If signed URLs become necessary, the only change is in the BlobStore + a seed re-generation; the domain stays untouched.

**Alternatives considered:**

- _Store `sourceKey` on `VideoLesson` instead of `source` URL, resolve at render time_ — deferred. Adds a field to the domain for a problem we don't have yet.

### 4. The seed generator is a script (`scripts/generate-course-content-seed.ts`), not a build step inside the adapters

The generator runs at dev-machine speed (potentially minutes for 100+ lessons with `ffprobe`), produces a committed file, and the adapters consume that file at runtime like any other in-memory data. The adapters do NOT scan the filesystem at construction.

**Why:**

- Tests don't need 15 GB on disk to instantiate the adapter.
- CI builds don't need `ffprobe` installed.
- Hot reload stays fast.

**Alternatives considered:**

- _Construct the adapter with a directory path; adapter scans at boot_ — rejected. Couples test setup to filesystem fixtures, breaks the existing in-memory pattern, and is slow.

### 5. Slug generation has two layers: automatic kebab-case + manual override map

Folder names are normalized automatically (lowercase, ASCII transliteration, spaces → hyphens, `#`/`&`/`:` removed). Folder names that still don't produce a clean slug — or that the author wants renamed for legibility — are listed in `scripts/slug-overrides.ts`.

**Why:** Two folders in section 9 are `"1 Day#1"` and `"3 Day# 3"` (inconsistent formatting); automatic normalization collapses both to `1-day-1` and `3-day-3`, but the override map lets the author pick `1-day-01` / `3-day-03` for sequence clarity.

**Alternatives considered:**

- _Pure manual mapping_ — rejected. 100+ folders × 1 line each = a tedious file to maintain.
- _Pure automatic_ — rejected. `"5 Sound Natural: American Intonation Essentials"` would slug to `5-sound-natural-american-intonation-essentials` (correct but verbose); the author may want `5-sound-natural-intonation` for URL brevity.

### 6. The `LocalFilesystemLessonRepository` is constructed from a precomputed seed, not from a directory path

```ts
new LocalFilesystemLessonRepository(seedLessons)
new LocalFilesystemResourceRepository(seedResources)
```

This mirrors the `InMemoryLessonRepository` constructor shape (`ReadonlyArray<Lesson>`). The "filesystem-backed" part of the name is historical — it describes where the seed DATA came from, not where the adapter looks at runtime.

**Why:** Symmetric with the existing in-memory adapter. The adapter itself does not need a `BlobStore` at runtime because URLs are pre-resolved at seed-gen time by `scripts/generate-course-content-seed.ts`. The BlobStore is owned by the seed generator, not the adapter. If signed URLs (which expire) are introduced later, the adapter will need to call `BlobStore.url()` at render time — that will be a follow-up change with a domain schema update (a `sourceKey` field on `VideoLesson`). Until then, the adapter is a thin pass-through.

**Alternatives considered:**

- _Take `BlobStore` in the adapter constructor and call `blobStore.url()` at construction_ — rejected. Adding a parameter for a future concern is dead code today; the unused private field would confuse readers. The right time to introduce the parameter is when signed URLs actually land.

### 7. The `readme.md` files map to `ReadingLesson.body` ONLY when a lesson has no `.mp4`. When both exist, the lesson is `kind: "video"` and the `readme.md` is a `Resource { kind: "other" }`

This avoids inventing a new lesson kind for "bimodal" lessons and matches the existing `Lesson` discriminated union without modification.

**Why:** The domain has two lesson kinds. Forcing content into them means choosing. A video+readme pair has the video as the primary content (it's the lesson's source), with the readme as supplementary material — exactly the role `Resource` plays.

**Alternatives considered:**

- _Add a `kind: "video-with-notes"` variant_ — rejected. Avoids domain churn.
- _Always use `kind: "reading"` with a video link in `body`_ — rejected. Loses `durationSeconds`, `poster`, and the `VideoLesson` typed contract.

### 8. Content seed is gated by an env var in `use-case-dependencies.ts`, defaulting OFF

```ts
const useContentSeed = process.env.USE_COURSE_CONTENT_SEED === "1";
```

The A1 hardcoded seed remains the default for tests, Storybook, and local dev unless the env var is set. This lets us merge the change without immediately displacing existing test fixtures.

**Why:** Lower-risk rollout. We can validate the new content in dev before flipping the default.

## Risks / Trade-offs

- **`ffprobe` not installed on dev machines** → The generator checks for `ffprobe` at start and exits with a clear error; the generated `seed-content.ts` already on disk is unaffected. CI does not run the generator (the committed file is the source of truth there).
- **15 GB watched by Next.js dev server** → Follow-up: add `outputFileTrackingExcludes` to `next.config.ts` if HMR becomes slow. Not blocking v1.
- **Duplicate `.mp4` filenames inside a section (e.g., section 7)** → The seed generator must use the full key (`<course-slug>/<module-slug>/<lesson-slug>.mp4`) for URLs, not the bare filename, so two lessons with the same `Aprende...mp4` filename still resolve to distinct URLs.
- **Slug overrides drift if folders are renamed** → Add a smoke test that asserts every folder has an entry in `slug-overrides.ts` OR auto-generates a clean slug. The override map is opt-in; absence means "use automatic".
- **The `LocalFilesystemBlobStore` constructor accepts a `baseUrl`, but Next.js serves `/public/local-filesystem-lesson/` at `/local-filesystem-lesson/` (no `/public/` prefix)** → The constructor takes the public-facing base URL, NOT the filesystem path. Document this clearly in the adapter's JSDoc; it's a footgun.
- **Disk I/O during seed generation is slow** (~100 lessons × ffprobe = minutes) → Cache the generated `seed-content.ts` in git; only re-run when the source changes. Add a `--check` mode that fails CI if the committed file is stale vs. the source folder.

## Migration Plan

This change does NOT migrate to S3/R2 — it sets up the local development experience. The bucket migration is a follow-up change that:

1. Adds `S3BlobStore` (and/or `R2BlobStore`) under `src/adapters/persistence/blob-store/`.
2. Adds `S3LessonRepository` / `S3ResourceRepository` (or just swaps the BlobStore in the existing local adapter's constructor — depends on whether the seed itself is generated from S3 or pre-shipped).
3. Updates `use-case-dependencies.ts` to pick the S3 driver in production.
4. Removes `public/local-filesystem-lesson/` and its `.gitignore` entry.

For now:

1. Land this change with the env-var-gated content seed.
2. Validate locally (`USE_COURSE_CONTENT_SEED=1 pnpm dev`) that the new content renders.
3. Once comfortable, flip the default and archive the A1 hardcoded seed as a "v1 fixture" only.

Rollback: revert the merge. The A1 seed remains the default until the env var is removed, so a partially-broken new adapter has no production blast radius.

## Open Questions

- **Should the A1 hardcoded seed eventually be deleted, or retained as a permanent fixture for Storybook / tests?** Defer until after this change validates.
- **Section 1 (`"1 Advanced Pronunciation Course"`) has no `readme.md` files but has 4 subfolders — is each subfolder a separate `Module` or is section 1 itself a `Module`?** Need user confirmation. The current generator treats each section as a `Module`, but section 1 might be intended as a Course-level wrapper.
- **Section 4 (`"4 Key Sound Patterns and Features"`) has only one lesson folder; is that intentional?** Generator handles it as-is, but worth confirming the content is complete.
- **Should the slug override file be TS or JSON?** TS chosen for type safety + JSDoc comments; switching to JSON would lose the ability to comment why each override exists.
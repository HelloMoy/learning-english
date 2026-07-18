## Why

The "Advanced Intermediate Pronunciation" course content (~15 GB of videos, PDFs, thumbnails, and `readme.md` lessons) currently lives in `public/local-filesystem-lesson/`, but the only existing repository adapters read from a hardcoded `seed.ts` array — the production asset folder is invisible to the application. We need filesystem-backed adapters for `LessonRepository` and `ResourceRepository` that surface this content through the existing domain ports, plus a small `BlobStore` abstraction so that the same domain code can later target an S3/R2 bucket without code changes.

## What Changes

- Add a `BlobStore` port (driven-adapter primitive, NOT a domain port) with a `LocalFilesystemBlobStore` implementation that resolves content keys to URLs served from `/public/local-filesystem-lesson/`.
- Add `LocalFilesystemLessonRepository` and `LocalFilesystemResourceRepository` — driven adapters implementing the existing `LessonRepository` and `ResourceRepository` domain ports, scanning the filesystem at construction time and validating the discovered content against the domain schemas.
- Add `scripts/generate-course-content-seed.ts` — a build-time generator that walks `public/local-filesystem-lesson/`, computes slugs (with a manual override map for folders containing `&`, `#`, `:`), runs `ffprobe` to extract `durationSeconds` for each `.mp4`, and emits `src/adapters/persistence/in-memory/seed/seed-content.ts` (committed to git so diffs are reviewable).
- Add `scripts/slug-overrides.ts` — a hand-maintained map from raw folder names to URL-safe slugs.
- Add unit tests for the new adapters and the seed generator, following the existing folder-per-entity convention.
- Wire the new adapters into `use-case-dependencies.ts` via a feature flag (env var or config switch) so the existing A1 hardcoded seed remains the default until the new content is reviewed.

The existing `InMemoryLessonRepository` / `InMemoryResourceRepository` and the A1 hardcoded seed are NOT removed — they remain as the default fixture for tests and Storybook.

## Capabilities

### New Capabilities

- `course-content-storage`: Defines the `BlobStore` abstraction and the `LocalFilesystemBlobStore` driver. Establishes the URL-resolution pattern that future drivers (S3, R2) must follow. Documents the "key → URL" convention so the future migration is a config swap, not a code rewrite.

### Modified Capabilities

_None._ The domain ports `LessonRepository` and `ResourceRepository` already exist in `course-platform-domain` and their contracts are unchanged. The new adapters are new implementations of those ports; no domain requirement changes.

## Impact

- **New code under `src/adapters/persistence/`**:
  - `blob-store/blob-store.ts` (interface)
  - `blob-store/local-filesystem-blob-store/`
  - `local-filesystem/local-filesystem-lesson-repository/`
  - `local-filesystem/local-filesystem-resource-repository/`
  - `in-memory/seed/seed-content.ts` (generated, committed)
- **New scripts under `scripts/`**:
  - `generate-course-content-seed.ts`
  - `slug-overrides.ts`
- **Modified files**:
  - `src/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies.ts` — adds a switch between the A1 seed and the content seed.
  - `.gitignore` — already ignores `public/local-filesystem-lesson/` (verified).
  - `package.json` — adds an `ffprobe` check and a `generate:content-seed` script (subject to user approval per repo rules).
- **Performance**: 15 GB under `/public` will be watched by Next.js in dev; consider `outputFileTrackingExcludes` in `next.config.ts` as a follow-up if dev-server HMR becomes slow.
- **Build**: a new `pnpm generate:content-seed` step must run before `pnpm dev` / `pnpm build`. The generated `seed-content.ts` is committed so production builds do not require `ffprobe` at build time.
- **Domain**: untouched. ESLint `architecture-boundaries` continues to hold — the new abstractions live entirely under `src/adapters/`.
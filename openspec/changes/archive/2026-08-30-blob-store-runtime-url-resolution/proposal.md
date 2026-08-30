## Why

Content URLs (`VideoLesson.source`, `VideoLesson.poster`, `Resource.url`) are
baked into `seed-content.ts` at generation time with a hardcoded
`/local-filesystem-lesson` prefix. Repointing storage at an S3/R2 bucket
therefore means regenerating the seed — which requires the full 15 GB corpus on
disk plus `ffprobe` — instead of changing configuration. Worse, a **private**
bucket needs per-request signed URLs, which cannot be baked into a committed
file at all, so the current shape is a dead end rather than an inconvenience.

The `BlobStore` abstraction that exists to prevent exactly this is only half
wired: `use-case-dependencies.ts` already constructs a `LocalFilesystemBlobStore`
at runtime, but passes it solely to the notes repository. The lesson and
resource repositories are pass-throughs over pre-resolved data.

This is also a live correctness hazard. `LocalFilesystemLessonNotesRepository`
finds a lesson's notes `Resource` by computing `blobStore.url(key)` and matching
it against the seed's `Resource.url` string. The two agree today only because
both sides hardcode the same prefix. Change the `baseUrl` and lesson notes
silently return `null` — no error, notes just disappear.

Finally, `openspec/specs/course-content-storage/spec.md` already *asserts* that
the repositories resolve URLs via `BlobStore` ("the resulting `source` value is
exactly what `blobStore.url(key)` returns — no path concatenation in the adapter
itself"). The code does not do this. Spec and implementation are out of sync;
this change reconciles them in the direction the spec already points.

## What Changes

- The seed generator emits **content keys** (`advanced-.../lesson.mp4`) instead
  of resolved URLs for `source`, `poster` and `Resource.url`. The
  `/local-filesystem-lesson` literal disappears from
  `generate-course-content-seed.ts`.
- **BREAKING (internal)**: `seed-content.ts` exports raw, unparsed lesson and
  resource rows (`seedContentLessonRows`, `seedContentResourceRows`) instead of
  already-parsed `Lesson[]` / `Resource[]`. Entities are constructed by the
  repository *after* key resolution, because `urlOrRelativePath()` rejects a
  bare key. The A1 seed (`seed.ts`) is untouched and keeps exporting entities.
- `LocalFilesystemLessonRepository` and a new
  `LocalFilesystemResourceRepository` wiring take a `BlobStore`, resolve each
  row's keys through it and parse the result into domain entities on read.
- The `BlobStore` driver is selected by configuration
  (`CONTENT_BLOB_DRIVER` / `CONTENT_BASE_URL`) in `use-case-dependencies.ts`,
  defaulting to the current local behaviour so nothing changes without an
  explicit opt-in.
- `LocalFilesystemLessonNotesRepository` matches its notes `Resource` by **key**
  rather than by reconstructed URL string, removing the silent-null hazard.

## Capabilities

### New Capabilities

_None._ This change tightens an existing capability rather than introducing a
new one.

### Modified Capabilities

- `course-content-storage`: the seed now stores keys rather than resolved URLs;
  URL resolution moves from generation time to read time inside the lesson and
  resource adapters; the `BlobStore` driver becomes configuration-selected; the
  notes adapter matches by key instead of by URL string.

## Impact

**Code**

- `scripts/generate-course-content-seed.ts` — emit keys, drop the two
  hardcoded `baseUrl` literals (`:83-85`, `:174-176`).
- `src/adapters/persistence/in-memory/seed/seed-content.ts` — regenerated;
  exports raw rows plus keys.
- `src/adapters/persistence/local-filesystem/local-filesystem-lesson-repository/`
  — resolve + parse on read.
- `src/adapters/persistence/local-filesystem/local-filesystem-resource-repository/`
  — same, and it becomes the adapter actually wired for the content seed
  (today `InMemoryResourceRepository` is used for both seeds).
- `src/adapters/persistence/local-filesystem/local-filesystem-lesson-notes-repository/`
  — match by key.
- `src/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies.ts`
  — driver selection from env; pass the `BlobStore` to the lesson and resource
  repositories when the content seed is active.

**Behaviour**

No user-visible change. The default boot (A1 seed) and the opt-in content boot
(`USE_COURSE_CONTENT_SEED=1`) must render byte-identical URLs to today.

**Not affected**

The domain (`src/domain/**`) keeps seeing plain URL strings on
`VideoLesson.source` and `Resource.url`; no entity schema changes. No UI
component changes. `BlobStore` itself keeps its current three-method interface.

## Non-goals

- **No `S3BlobStore` implementation.** This change makes the swap *possible*
  (driver behind config, keys in the seed); writing and testing the S3 driver,
  and the URL-signing policy that comes with a private bucket, is a separate
  change.
- **No per-lesson storage provider.** Mixing origins ("this lesson streams from
  YouTube, that one from R2") requires a discriminated `source` in the domain
  and a player abstraction, because `PlaybackPositionedVideoPlayer` is built on
  raw `HTMLVideoElement` events and `video.currentTime` seeks, which a YouTube
  iframe does not expose. Deliberately deferred; the key-based seed this change
  lands makes that a purely additive union member later.
- **No content migration.** The 15 GB corpus stays in
  `public/local-filesystem-lesson/`.
- **No change to slug, title, duration or classification logic** in the
  generator. Only what it *emits* for the three URL fields changes.
- **No caching or signing layer.** `BlobStore.url` stays synchronous and pure;
  an async signing variant is the S3 change's problem.

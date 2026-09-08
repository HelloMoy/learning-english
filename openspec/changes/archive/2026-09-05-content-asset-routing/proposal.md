## Why

The 319 content assets (107 videos, their posters, 105 resources) all resolve
against a single `BlobStore` built from one `CONTENT_BASE_URL`. Storage is
all-or-nothing: either everything is local, or everything is behind one prefix.

That content is about to be spread across S3, GCS and other buckets, and assets
will keep moving between them. Today a move has no representation at all — there
is nowhere to say "this module's videos now live in bucket X".

The architecture already anticipated this. Content keys in `seed-content.ts` are
opaque and store-agnostic, `BlobStore` is the single key→URL resolution point,
and `blob-store.ts` already says "Future drivers: `S3BlobStore`, `R2BlobStore`".
What is missing is the layer that decides **which** store answers for a key.

The invariant that makes this cheap: **a key never changes when its asset moves.**
Only its resolver does. So a migration touches no lesson row, no resource row, and
never regenerates the seed.

## What Changes

- Introduce `content-locations.json`, a **runtime** manifest declaring `stores`
  (driver, bucket, region, `pathPrefix`, visibility, public URL), a `default`
  store, prefix-based `routes` (longest prefix wins) and a per-key `overrides`
  map. Migrating a module is one route; moving one file is one override.
- Add `RoutingBlobStore`, implementing the existing `BlobStore` interface and
  delegating `url`, `exists` and `readText` to the store a key routes to. No
  interface change, so the domain and every lesson/resource/notes adapter are
  untouched.
- Add `S3BlobStore` and `GcsBlobStore` drivers alongside the local one.
- Add the route handler `GET /api/content/[...key]` for private stores: it signs
  a URL and answers **302**. It MUST NOT proxy bytes — the browser must fetch and
  range-request directly from the bucket. This is what keeps `BlobStore.url()`
  synchronous instead of rippling `async` through the adapters and entity
  construction.
- Add `scripts/move-content.ts`, which uploads the bytes, verifies them with
  `exists()` at the destination, and rewrites the manifest in the same operation,
  so placement and reality cannot drift apart. Add `pnpm verify:content`, which
  walks every emitted key through the routed store.
- **BREAKING**: `CONTENT_BASE_URL` is removed. The public URL prefix is now a
  property of a store in the manifest. `CONTENT_LOCAL_ROOT` stays an env var —
  it is a machine-specific filesystem path, not placement.
- **BREAKING**: `next.config.ts` derives `images.remotePatterns` from every
  public store in the manifest instead of from the single `CONTENT_BASE_URL`.
  Without this, posters on a bucket 500 with "hostname is not configured".
- The manifest is optional. With none on disk the app behaves exactly as it does
  today: one local store at `/local-filesystem-lesson`.

## Capabilities

### New Capabilities

None. This is the storage-resolution layer that `course-content-storage` already
exists to define; splitting it out would put one concern in two specs.

### Modified Capabilities

- `course-content-storage`: gains a runtime placement manifest and a routing
  `BlobStore` that fans out over several drivers; `The BlobStore driver is
  selected by configuration` becomes manifest-driven rather than
  `CONTENT_BASE_URL`-driven; `The image allowlist is derived from the content
  base URL` becomes derived from every public store; private stores gain a
  signing redirect endpoint; `readText` gains a caching requirement now that it
  can be a network call.

## Non-goals

- No change to the domain, to `LessonRepository` / `ResourceRepository` /
  `LessonNotesRepository`, or to any adapter that consumes `BlobStore`.
- No change to `seed-content.ts`, to the 319 content keys, or to the build-time
  `courses.manifest.json`. A move never regenerates the seed.
- `BlobStore.url()` stays synchronous. Making it `async` is explicitly rejected.
- No byte proxying through the Next.js server, for any store, ever.
- No migration of actual content to a real bucket as part of this change; it
  makes the migration possible and gives it a tool.
- No CDN provisioning, bucket creation, or IAM setup — infrastructure is out of
  band. The manifest describes buckets that already exist.
- No per-user authorization on `/api/content`. The endpoint is the place that
  will host it later; this change does not add entitlement checks.

## Impact

- **New**: `content-locations.json` (tracked, repo root or `config/`);
  `src/adapters/persistence/blob-store/routing-blob-store/`;
  `.../s3-blob-store/`; `.../gcs-blob-store/`;
  `src/app/api/content/[...key]/route.ts`; `scripts/move-content.ts`;
  `scripts/content-locations/` (Zod schema + loader, shared by app and scripts).
- **Modified**: `use-case-dependencies.ts` (`buildBlobStore` returns the routing
  store); `next.config.ts` (allowlist from all public stores);
  `local-filesystem-lesson-notes-repository` gains notes caching;
  `package.json` (`verify:content`, AWS/GCP SDK dependencies).
- **Dependencies**: `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`, and
  `@google-cloud/storage`. First cloud SDKs in the project.
- **Config**: `CONTENT_BASE_URL` removed from `.env.example`; credentials added.
- **Risk — a signed URL expiring mid-playback breaks seeking.** Mitigated by a
  generous TTL (~6 h, longer than any plausible session) and by fronting private
  buckets with a CDN.
- **Risk — `readText` becomes a network call per lesson** for the notes
  `readme.md`. Mitigated by caching, or by routing `.md` keys to the local store.
- **Risk — the manifest claims a placement the bucket does not have.** Mitigated
  by `move-content.ts` doing both halves atomically and by `verify:content`.

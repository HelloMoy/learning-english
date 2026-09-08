## Context

Content resolution today has exactly one degree of freedom:

```ts
// use-case-dependencies.ts
function buildBlobStore(): LocalFilesystemBlobStore {
  return new LocalFilesystemBlobStore({
    baseUrl: process.env.CONTENT_BASE_URL ?? "/local-filesystem-lesson",
    localRoot: ...,
  });
}
```

One store, one prefix, 319 keys. There is no way to say "these keys live
elsewhere", which is precisely what a migration to S3/GCS needs.

What is already right, and must not be disturbed:

- **Keys are opaque and store-agnostic.** `seed-content.ts` holds
  `advanced-intermediate-course/8-everyday-english/1-common/video.mp4`, never a
  URL. The seed's own header says this is what "makes repointing storage a config
  change instead of a regeneration".
- **`BlobStore` is the single resolution point.** The spec forbids any other
  layer from concatenating a base URL onto a key, and forbids a key from reaching
  the domain unresolved.
- **`blob-store.ts` already names the successors**: "Future drivers:
  `S3BlobStore`, `R2BlobStore`."

Constraints that shape the design:

- `BlobStore.url(key)` is **synchronous**, and is called during entity
  construction inside `resolveLessonRow` / `resolveResourceRow`. Signed URLs from
  the AWS/GCP SDKs are async.
- `next.config.ts` derives the `next/image` allowlist from `CONTENT_BASE_URL`. A
  poster on an unlisted host is a hard 500, not a broken image.
- Playwright's `webServer` runs `USE_COURSE_CONTENT_SEED=1 pnpm dev`. Whatever
  lands must leave that boot path working with no new setup.
- This is the **second** manifest in the project. It must not be confusable with
  the build-time `courses.manifest.json`.

## Goals / Non-Goals

**Goals:**

- Declare, in one tracked file, which store answers for which key — by prefix for
  a bulk migration and by single key for a one-off move.
- Move an asset without regenerating `seed-content.ts` or touching a single key.
- Support several stores at once, public and private, in one boot.
- Keep the `BlobStore` interface, the adapters and the domain untouched.
- Absence of the manifest reproduces today's behaviour exactly.

**Non-Goals:**

- Making `url()` async. Explicitly rejected below.
- Proxying bytes through the app server, for any store.
- Per-user entitlement checks on content. The endpoint is where they will live;
  this change does not add them.
- Actually migrating content. This change makes the migration possible.

## Decisions

### 1. Two manifests, deliberately distinct

| | `courses.manifest.json` | `content-locations.json` |
| --- | --- | --- |
| Read | build time, by the generator | runtime, by the dependency graph |
| Declares | what a course **is** | where each blob **lives** |
| Tracked | no (sits in the ignored content root) | **yes** |
| On change | regenerate the seed | nothing — next boot picks it up |

*Why not one file:* they answer to different actors on different clocks. A course
is declared once when it is authored; its bytes may move a dozen times after. And
one is untracked-by-necessity while the other must be reviewable.

*Why tracked:* bucket names, regions and CDN URLs are not secrets — credentials
are, and those stay in the environment. Having lost diff-review on the courses
manifest, losing it again here would mean nobody ever sees where content moved.

### 2. Overrides → longest prefix → default

Resolution order is exact-key override, then the longest matching `routes`
prefix, then `default`.

*Why both layers:* migrations and moves have different shapes. "We moved module 8
to S3" is one prefix; "this one file went to the wrong bucket" is one override.
Expressing a prefix migration as 40 per-key entries is the maintenance burden the
whole change exists to avoid; expressing a single-file exception as a prefix is
impossible.

*Alternative rejected — a flat per-asset table of 319 entries.* Precise, and
unmaintainable by hand. `move-content.ts` would write it, but every diff would be
hundreds of lines and no reader could tell a migration from a typo.

### 3. `pathPrefix` keeps identity separate from placement

A store may hold keys under a prefix of its own: key
`course/module/lesson/video.mp4` in a store with `pathPrefix: "v1/"` is the object
`v1/course/module/lesson/video.mp4`.

*Why:* if the key were forced to equal the object path, then re-organising a
bucket would rewrite keys, which rewrites `seed-content.ts`, which is the exact
coupling this change exists to break. The key is identity and never moves; the
object path is placement and may.

### 4. `url()` stays synchronous; private stores redirect through a route handler

For a `signed` store, `url(key)` returns `/api/content/<key>`. That handler
resolves the key, mints a signed URL, and answers **302**.

*Why not make `url()` async:* it is called inside `resolveLessonRow` /
`resolveResourceRow` while building domain entities. Making it async turns those
into async factories, which turns the repositories' row-mapping into `Promise.all`
fan-outs, and pushes the change into the notes adapter and every test that builds
a row. A large blast radius to solve a problem one redirect solves.

*Why 302 and never a proxy:* a proxy puts 15 GB of video through the Node process
and has to reimplement `Range` handling for seeking. The redirect makes the
browser talk to the bucket directly, which is what buckets and CDNs are for. This
is a hard rule, not a preference.

*Why this and not public buckets:* it is a course platform; gating content on
enrolment is a matter of when, not if. The handler is the seam where that check
belongs. Public stores are still supported — they simply skip the hop.

### 5. Signed URLs get a session-length TTL (6 h default)

*Why so long:* an expired URL mid-playback does not prompt a re-fetch, it breaks
seeking — the `<video>` element's range request to a dead URL fails. The TTL has
to outlast the longest plausible viewing session, and a leaked URL to one lesson
video is a far smaller risk than a broken player. A CDN in front of the bucket is
the real mitigation for both.

### 6. The manifest loader lives in `src/`, not `scripts/`

`src/adapters/persistence/blob-store/content-locations/`. Both the app and
`scripts/move-content.ts` consume it; scripts already import from `../src/...`,
and the reverse direction would put runtime code behind a build-tooling folder.

### 7. Notes are cached; `.md` may simply stay local

`readText` is the one `BlobStore` method on a per-request path. A
process-lifetime cache is safe because notes only change when the seed is
regenerated.

The cheaper option remains available and is worth stating: notes are kilobytes,
so routing `*.md` keys to the local store while videos move to buckets is a valid
configuration, expressible in the manifest with no code.

## Risks / Trade-offs

- **A signed URL expires mid-playback → seeking breaks.** → 6 h TTL plus a CDN.
  Revisit only if a real session can exceed it.
- **The manifest claims a placement the bucket does not have** → 404s in
  production. → `move-content.ts` writes the manifest only after the destination
  verifies, and `pnpm verify:content` walks all 319 keys on demand.
- **`next.config.ts` reading the manifest.** It is loaded by Next's config
  loader, where the `@/` alias may not resolve and pulling in Zod is heavy. →
  Import the loader by relative path; if that proves brittle during apply, fall
  back to a plain `readFileSync` + narrow shape check in the config, keeping the
  Zod validation for the runtime path. Either way the allowlist is derived, never
  hand-maintained.
- **The allowlist is computed once at config load**, so editing the manifest in a
  running dev server repoints URLs but not the allowlist. → Documented; restart
  required. Same caveat the current `CONTENT_BASE_URL` already carries.
- **Two cloud SDKs enter the dependency tree.** → Both are used only inside their
  driver; the routing store depends on the `BlobStore` interface alone, so a
  driver can be dropped without touching anything else.
- **Removing `CONTENT_BASE_URL` is breaking for any deployment that sets it.** →
  Nothing in the repo sets it today; the equivalent is a two-line manifest.

## Migration Plan

1. Schema + loader + routing resolution (pure, no I/O). Nothing consumes it.
2. `RoutingBlobStore` over the existing local driver only — provably identical
   output to today with a single-store manifest, and with no manifest at all.
3. Swap `buildBlobStore()` to return it. Full suite and e2e must stay green with
   no manifest present.
4. `S3BlobStore`, then `GcsBlobStore`, each behind its own tests.
5. `/api/content/[...key]` and `signed` visibility.
6. `next.config.ts` allowlist from all public stores; remove `CONTENT_BASE_URL`.
7. `move-content.ts` and `verify:content`.
8. Commit `content-locations.json` declaring the single local store — today's
   behaviour, now written down.

Rollback: no data migration and no content is moved by this change, so reverting
the commit restores the single local store. Content already moved to a bucket
would need `move-content.ts` run in reverse first.

## Testing strategy

Everything here is adapter and tooling code — no React. **Vitest** carries it;
Playwright only proves the default boot path did not regress.

| Behavior | Layer | File / pattern mirrored |
| --- | --- | --- |
| Manifest schema: valid parse, bad JSON, unknown store in a route, public store with no `publicUrl`, defaults | Vitest unit | new `src/adapters/persistence/blob-store/content-locations/content-locations.test.ts`, mirroring `scripts/courses-manifest/courses-manifest.test.ts` |
| Routing: exact override wins, longest prefix wins, fall to default, `pathPrefix` composition | Vitest unit | same file — pure resolution, no I/O |
| `RoutingBlobStore` delegates `url` / `exists` / `readText` to the routed driver | Vitest unit, fake in-memory drivers | new `routing-blob-store.test.ts` |
| No manifest ⇒ byte-identical URLs to today | Vitest unit | assert against the current `LocalFilesystemBlobStore` output |
| `S3BlobStore` against a real bucket | Vitest integration, **LocalStack via testcontainers**, `describe.skipIf(!DOCKER_AVAILABLE)` | the repo's persistence-adapter rule; gating mirrors `describe.skipIf(!FFMPEG_AVAILABLE)` in `generate-course-content-seed.test.ts` |
| `GcsBlobStore` against a real bucket | Vitest integration, **fake-gcs-server via testcontainers**, same `skipIf` gate | as above |
| Key safety (`..`, absolute, binary-as-text) holds for every driver | Vitest unit | assertions lifted from `local-filesystem-blob-store.test.ts`, run against each driver |
| `/api/content` answers 302 with a signed `Location`, streams no body, 400s an unsafe key, 404s a missing object | Vitest unit, Web `Request`/`Response` | new `route.test.ts` |
| `next.config.ts` allowlist: one pattern per public store, none for signed or local, none with no manifest | Vitest unit on the exported derivation function | the function is already exported-shaped in `next.config.ts` |
| `move-content.ts` writes the manifest only after the destination verifies | Vitest integration, LocalStack | mirrors `scripts/normalize-content-disk.test.ts`'s tmpdir + apply-flag shape |
| `verify:content` names every unresolved key and exits non-zero | Vitest integration | mirrors the unresolved-key test in `generate-course-content-seed.validation.test.ts` |
| Default boot still renders the app | Playwright e2e, unchanged specs | `home-course-ladder`, `course-catalog`, `lesson-page` run with no manifest |

The Docker-gated suites follow the project's persistence rule (a real ephemeral
backend, not a mocked SDK) while keeping a laptop without Docker able to run
`pnpm test:run` — exactly how the ffmpeg-dependent generator suite already
behaves.

## Open Questions

- **Which cloud comes first?** The manifest supports both, but only one driver
  needs to be production-ready to start migrating. Building S3 first and GCS
  behind it is assumed; say so if the first bucket is GCS.
- **CDN in front of the private buckets?** The 6 h TTL is sized assuming there is
  one. Without a CDN, signed-URL volume goes straight to the bucket and the TTL
  becomes a cost/exposure trade rather than a correctness one.

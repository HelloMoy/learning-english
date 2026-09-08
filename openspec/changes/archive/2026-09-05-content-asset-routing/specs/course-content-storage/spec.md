## ADDED Requirements

### Requirement: Asset placement is declared in a runtime location manifest

The system SHALL read asset placement from a tracked JSON manifest,
`content-locations.json`, that declares which store answers for which content
key. It is read at runtime when the dependency graph is built, NOT at build
time, so moving an asset never regenerates `seed-content.ts`.

The manifest SHALL have the shape:

```jsonc
{
  "version": 1,
  "stores": {
    "local": { "driver": "local", "baseUrl": "/local-filesystem-lesson" },
    "s3-video": {
      "driver": "s3",
      "bucket": "lessons-video",
      "region": "us-east-1",
      "pathPrefix": "v1/",          // optional: where keys sit INSIDE the bucket
      "visibility": "signed",       // "public" | "signed"
      "publicUrl": "https://cdn.example.com/video"  // required when public
    },
    "gcs-docs": { "driver": "gcs", "bucket": "lessons-docs", "visibility": "signed" }
  },
  "default": "local",
  "routes": [
    { "prefix": "advanced-intermediate-course/8-everyday-english/", "store": "s3-video" }
  ],
  "overrides": {
    "advanced-intermediate-course/3-contractions/6-i-d/odd-one.mp4": "gcs-docs"
  }
}
```

A key SHALL be routed by, in order: an exact match in `overrides`; otherwise the
`routes` entry whose `prefix` is the LONGEST match; otherwise `default`. Both
prefix routes and per-key overrides SHALL exist, because migrations happen a
module at a time while individual assets move one at a time, and expressing
either shape through the other is impractical for 319 keys.

A store's `pathPrefix` SHALL be prepended to the key to form the object path
inside that store. The content key SHALL NOT be redefined by a move: the key is
identity, the object path is placement, and conflating them would break the
guarantee that a move leaves `seed-content.ts` untouched.

Credentials SHALL NOT appear in the manifest. Bucket names, regions and CDN URLs
are not secrets and belong in the tracked file; access keys are read from the
environment by the drivers.

The manifest SHALL be validated with a Zod schema. A manifest that is malformed
JSON, fails the schema, names a store that `stores` does not declare, or declares
a public store with no `publicUrl` SHALL abort dependency-graph construction with
a message naming the offending entry. A present-but-invalid manifest SHALL NOT
fall back to defaults.

The manifest SHALL be optional. With no manifest on disk the system SHALL behave
as a single local store at `/local-filesystem-lesson`, which is the pre-change
behaviour.

#### Scenario: A module's videos are migrated with one route

- **WHEN** the operator adds a `routes` entry mapping the prefix
  `advanced-intermediate-course/8-everyday-english/` to the `s3-video` store
- **THEN** every key under that prefix resolves through `s3-video`, every other
  key is unaffected, and `seed-content.ts` is unchanged on disk

#### Scenario: A single asset is moved with one override

- **WHEN** the operator adds one `overrides` entry for a single key whose prefix
  routes elsewhere
- **THEN** that key alone resolves through the override's store, and its
  siblings under the same prefix keep their route

#### Scenario: The longest matching prefix wins

- **WHEN** `routes` holds both `advanced-intermediate-course/` → `local` and
  `advanced-intermediate-course/8-everyday-english/` → `s3-video`, and a key
  under the second prefix is resolved
- **THEN** it resolves through `s3-video`, not `local`

#### Scenario: A key matching no route falls to the default store

- **WHEN** a key matches no `overrides` entry and no `routes` prefix
- **THEN** it resolves through the store named by `default`

#### Scenario: The object path is the store's prefix plus the key

- **WHEN** the key `course/module/lesson/video.mp4` routes to a store whose
  `pathPrefix` is `v1/`
- **THEN** the object fetched from that store is `v1/course/module/lesson/video.mp4`,
  and the key recorded in `seed-content.ts` is still `course/module/lesson/video.mp4`

#### Scenario: A route naming an undeclared store fails loudly at boot

- **WHEN** a `routes` entry or an `overrides` value names a store absent from
  `stores`
- **THEN** building the dependency graph throws, naming that entry, rather than
  silently falling back to `default`

#### Scenario: An absent manifest preserves today's behaviour

- **WHEN** the app boots with no `content-locations.json` on disk
- **THEN** every content URL is byte-identical to the pre-change output, all
  beginning with `/local-filesystem-lesson/`

### Requirement: RoutingBlobStore resolves each key through the store it routes to

The system SHALL provide a `RoutingBlobStore` implementing the existing
`BlobStore` interface, constructed from the resolved location manifest, that
delegates `url(key)`, `exists(key)` and `readText(key)` to the driver the key
routes to.

`RoutingBlobStore` SHALL NOT change the `BlobStore` interface. In particular
`url(key)` SHALL remain **synchronous**, so no change propagates into the lesson,
resource or notes adapters, into entity construction, or into the domain.

The system SHALL provide `S3BlobStore` and `GcsBlobStore` drivers alongside
`LocalFilesystemBlobStore`, each applying the same key-safety rules the local
driver already enforces (no absolute keys, no `..` traversal, no decoding a
binary key as text).

`RoutingBlobStore` SHALL compose the object path from the key and the store's
`pathPrefix` before delegating, so that composition lives in one place rather
than being repeated — and diverging — across three drivers. A driver therefore
resolves a path within its own store and knows nothing about routing.

One `RoutingBlobStore` instance SHALL be shared by the lesson, resource and notes
adapters within a dependency-graph build, so the three can never disagree about
where content lives.

#### Scenario: Two keys in one page resolve through different stores

- **WHEN** a lesson's video routes to `s3-video` and its PDF resource routes to
  `local`
- **THEN** the rendered page carries a bucket-backed URL for the video and a
  site-relative URL for the PDF, from a single `BlobStore` instance

#### Scenario: Existence is checked against the routed store

- **WHEN** `exists(key)` is called for a key that routes to `s3-video`
- **THEN** the S3 driver is asked, the local filesystem is not consulted, and the
  answer reflects the object's presence in that bucket under its `pathPrefix`

#### Scenario: The interface is unchanged

- **WHEN** `RoutingBlobStore` is substituted for `LocalFilesystemBlobStore` in
  the dependency graph
- **THEN** no file under `src/domain/**`, and no lesson, resource or notes
  adapter, requires an edit

### Requirement: Private stores are served through a signing redirect endpoint

For every store whose `visibility` is `signed`, `url(key)` SHALL return a
site-relative URL to `GET /api/content/[...key]` rather than a bucket URL. That
route handler SHALL resolve the key through the same routing rules, mint a signed
URL from the owning driver, and answer **302** with that URL in `Location`.

The route handler SHALL NOT proxy bytes. Streaming a video through the Node
process would put the whole corpus through the app server and break range
requests; the redirect lets the browser fetch and seek directly against the
bucket.

Signed URLs SHALL be minted with a time-to-live long enough to outlast a viewing
session (default 6 hours), because a URL that expires mid-playback breaks seeking
rather than merely re-authenticating.

The handler SHALL reject a key that fails the same safety rules the drivers
enforce, and SHALL answer 404 for a key that resolves to no object.

#### Scenario: A private video is fetched through the redirect

- **WHEN** the browser requests the `source` URL of a lesson whose video routes
  to a `signed` store
- **THEN** `/api/content/...` answers 302 with a signed bucket URL, and the video
  bytes are served by the bucket, not by the Next.js server

#### Scenario: A public store is not routed through the endpoint

- **WHEN** a key routes to a store whose `visibility` is `public`
- **THEN** `url(key)` returns that store's `publicUrl`-based URL directly, with
  no `/api/content` hop

#### Scenario: An unsafe key is rejected before any bucket call

- **WHEN** `/api/content` is requested with a key containing `..` or an absolute
  prefix
- **THEN** it answers 400 and no request is made to any store

### Requirement: Moving an asset updates its placement and its bytes together

The system SHALL provide `scripts/move-content.ts`, which for a given key or key
prefix and a target store: uploads the bytes to the target, verifies them with
`exists()` against the target store, rewrites `content-locations.json` to route
those keys there, and only then offers to delete the source objects.

The script SHALL NOT rewrite the manifest before the destination verifies, so an
interrupted move leaves the manifest pointing at bytes that are still present.

The system SHALL provide `pnpm verify:content`, which walks every content key in
`seed-content.ts` — every `source`, `poster`, `Resource.url` and notes key — and
calls `exists()` on the routed store, failing non-zero and naming every key that
does not resolve.

#### Scenario: A completed move leaves manifest and buckets agreeing

- **WHEN** `move-content.ts` finishes for a prefix
- **THEN** the manifest routes that prefix to the target, every moved key
  resolves there, and `pnpm verify:content` passes

#### Scenario: A move that fails to upload does not rewrite the manifest

- **WHEN** the upload or its `exists()` verification fails partway
- **THEN** `content-locations.json` is unchanged and the source objects are not
  deleted

#### Scenario: A hand-edited manifest that lies is caught

- **WHEN** the manifest routes a prefix to a store whose bucket does not hold
  those objects
- **THEN** `pnpm verify:content` exits non-zero and names the unresolved keys

### Requirement: Lesson notes read from a remote store are cached

The system SHALL cache the Markdown returned by `BlobStore.readText` when the
notes key routes to a non-local store, so repeated views of a lesson do not
re-fetch it.

`LessonNotesRepository.byLesson` calls `readText` for that lesson's `readme.md`.
Against the local driver this is a disk read; against a bucket it is a network
round trip on every lesson view. Notes content changes only when the seed is
regenerated, so the cache MAY be held for the process lifetime.

#### Scenario: A second view of the same lesson does not re-fetch its notes

- **WHEN** the same lesson's notes are requested twice from a store whose driver
  is `s3` or `gcs`
- **THEN** the driver performs one object read, and the second call is served
  from cache

## MODIFIED Requirements

### Requirement: The BlobStore driver is selected by configuration

`use-case-dependencies.ts` SHALL build the `BlobStore` from the location manifest
rather than from a single URL prefix:

- `content-locations.json` declares every store, the default, the routes and the
  overrides. It is the source of truth for WHERE content lives.
- `CONTENT_LOCAL_ROOT` remains an environment variable and sets the absolute
  filesystem path the local driver reads from. When unset it SHALL default to
  `public/local-filesystem-lesson` resolved against the process working
  directory. It stays in the environment because it is a machine-specific path,
  not a placement decision.
- Cloud credentials SHALL come from the environment, never from the manifest.

`CONTENT_BASE_URL` is removed; the public URL prefix is now the `baseUrl` (local)
or `publicUrl` (remote) of a store in the manifest.

The same `BlobStore` instance SHALL be shared by the lesson, resource and notes
adapters within one dependency-graph build, so the three can never disagree about
where content lives.

Repointing content storage SHALL NOT require regenerating `seed-content.ts`.

#### Scenario: Default boot preserves today's URLs

- **WHEN** the app boots with `USE_COURSE_CONTENT_SEED=1`, no location manifest,
  and `CONTENT_LOCAL_ROOT` unset
- **THEN** every rendered video, poster and resource URL is byte-identical to the
  pre-change output, all beginning with `/local-filesystem-lesson/`

#### Scenario: A CDN prefix is applied by manifest alone

- **WHEN** the manifest declares one public store with
  `publicUrl: "https://cdn.example.com/course-content"` as the default
- **THEN** every rendered video, poster and resource URL begins with
  `https://cdn.example.com/course-content/`, and `seed-content.ts` is unchanged
  on disk

### Requirement: The image allowlist is derived from every public store

`next.config.ts` SHALL derive one `images.remotePatterns` entry per PUBLIC store
declared in `content-locations.json`, so placing posters in a bucket does not
additionally require editing the Next.js config by hand. Course posters are
rendered through `next/image`, which rejects any remote host absent from that
list.

Stores whose `visibility` is `signed` SHALL contribute no pattern: their URLs are
site-relative `/api/content/...` paths served from the app's own origin.

When no manifest exists, or every store is local or signed, the config SHALL
produce NO remote pattern — images are served from the app's own origin exactly
as before.

Each derived pattern SHALL be scoped to that store's `publicUrl` path prefix
rather than the whole host, so adding one bucket does not implicitly allowlist
every image on that domain.

The config is evaluated once at load. Editing the manifest in a running dev
server repoints URLs but not this allowlist; the server must be restarted.

#### Scenario: A public bucket's posters render instead of erroring

- **WHEN** the manifest declares a public store with
  `publicUrl: "https://cdn.example.com/course-content"` and a page containing a
  `next/image` poster routed there is requested
- **THEN** the page renders and the poster is served through Next's image
  optimizer, rather than failing with "Invalid src prop … hostname is not
  configured"

#### Scenario: Two public stores each contribute a pattern

- **WHEN** the manifest declares two public stores on different hosts
- **THEN** `images.remotePatterns` holds one entry per host, each scoped to that
  store's path prefix

#### Scenario: A signed store adds no remote pattern

- **WHEN** every remote store in the manifest has `visibility: "signed"`
- **THEN** `images.remotePatterns` is empty, because those posters are fetched
  from the app's own origin through `/api/content`

#### Scenario: No manifest adds no remote pattern

- **WHEN** no `content-locations.json` exists
- **THEN** `images.remotePatterns` is empty and image handling is unchanged from
  before this capability existed

## RENAMED Requirements

- FROM: `### Requirement: The image allowlist is derived from the content base URL`
- TO: `### Requirement: The image allowlist is derived from every public store`

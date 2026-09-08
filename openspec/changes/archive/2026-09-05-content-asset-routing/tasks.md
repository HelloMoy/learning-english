## 1. Location manifest: schema, loader, routing

- [x] 1.1 (TDD: test → impl) `src/adapters/persistence/blob-store/content-locations/content-locations.test.ts`:
  a minimal manifest parses; malformed JSON rejects; a `routes` entry or
  `overrides` value naming a store absent from `stores` rejects naming it; a
  `visibility: "public"` store with no `publicUrl` rejects. Then create
  `content-locations.ts` with the Zod schema and `parseContentLocations(text)`.
- [x] 1.2 (TDD: test → impl) `resolveStoreFor(key, manifest)`: exact `overrides`
  hit wins; otherwise the LONGEST matching `routes` prefix; otherwise `default`.
  Pure, no I/O.
- [x] 1.3 (TDD: test → impl) `objectPathFor(key, store)`: prepends the store's
  `pathPrefix` and leaves the key itself untouched.
- [x] 1.4 (TDD: test → impl) `loadContentLocations(path)`: returns `null` when the
  file is absent; throws naming the entry when invalid.
- [x] 1.5 JSDoc per `jsdoc-typescript-docs` on every export, stating why the key
  is identity and the object path is placement.

## 2. RoutingBlobStore over the existing local driver

- [x] 2.1 (TDD: test → impl) `routing-blob-store.test.ts` with fake in-memory
  drivers: `url`, `exists` and `readText` each reach the driver the key routes to,
  and two keys in one call site can reach different drivers. Then implement
  `RoutingBlobStore implements BlobStore`.
- [x] 2.2 (TDD: test → impl) With no manifest, `RoutingBlobStore` produces
  byte-identical output to `LocalFilesystemBlobStore` for the same keys.
- [x] 2.3 (TDD: test → impl) A key routing to a store the manifest does not
  declare throws at construction, not at first use.
- [x] 2.4 (TDD: test → impl) Update `use-case-dependencies.test.ts` for the
  routing store, then change `buildBlobStore()` to return it. The default boot
  (no manifest, `CONTENT_LOCAL_ROOT` unset) must keep every URL unchanged.

## 3. S3 driver

- [x] 3.1 Add `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.
  **Requires approval before editing `package.json`.**
- [x] 3.2 (TDD: test → impl) `s3-blob-store.test.ts` against **LocalStack via
  testcontainers**, gated `describe.skipIf(!DOCKER_AVAILABLE)`: `exists` is true
  for an uploaded object and false otherwise; `readText` returns the object body;
  `pathPrefix` is honoured. Then implement `S3BlobStore`.
- [x] 3.3 (TDD: test → impl) `url()` for a `public` S3 store returns the
  `publicUrl` + key; for a `signed` store it returns the `/api/content/<key>`
  site-relative path, NOT a bucket URL.
- [x] 3.4 (TDD: test → impl) The key-safety rules (`..`, absolute prefixes,
  decoding a binary key as text) reject identically to the local driver.

## 4. GCS driver

- [x] 4.1 Add `@google-cloud/storage`. **Requires approval before editing
  `package.json`.**
- [x] 4.2 (TDD: test → impl) `gcs-blob-store.test.ts` against **fake-gcs-server
  via testcontainers**, same Docker gate, mirroring the S3 driver's cases. Then
  implement `GcsBlobStore`.

## 5. Signing redirect endpoint

- [x] 5.1 (TDD: test → impl) `src/app/api/content/[...key]/route.test.ts`: a key
  routing to a `signed` store answers **302** with a signed URL in `Location` and
  an empty body. Then implement the route handler.
- [x] 5.2 (TDD: test → impl) The handler never streams bytes — assert the response
  body is empty and no `GetObject` body read occurred.
- [x] 5.3 (TDD: test → impl) An unsafe key (`..`, absolute) answers 400 before any
  store call; a key with no object answers 404.
- [x] 5.4 (TDD: test → impl) The signed TTL defaults to 6 hours and is
  configurable per store.

## 6. Image allowlist from every public store

- [x] 6.1 (TDD: test → impl) A unit test on `next.config.ts`'s derivation
  function: one pattern per public store scoped to its `publicUrl` path; no
  pattern for `signed` or local stores; none when no manifest exists. Then rewrite
  the function to read the manifest instead of `CONTENT_BASE_URL`.
- [x] 6.2 Remove `CONTENT_BASE_URL` from `.env.example` and from
  `use-case-dependencies.ts`; add the cloud credential variables. **Requires
  approval before editing `.env.example`.**

## 7. Move and verify tooling

- [x] 7.1 (TDD: test → impl) `scripts/move-content.test.ts` against LocalStack:
  a completed move uploads, verifies with `exists()` at the destination, and only
  then rewrites `content-locations.json`. Then implement `scripts/move-content.ts`.
- [x] 7.2 (TDD: test → impl) A move whose upload or verification fails leaves the
  manifest unchanged and deletes nothing at the source.
- [x] 7.3 (TDD: test → impl) Deleting the source objects is a separate opt-in
  step, never automatic.
- [x] 7.4 (TDD: test → impl) `pnpm verify:content` walks every `source`, `poster`,
  `Resource.url` and notes key in `seed-content.ts`, calls `exists()` on the
  routed store, and exits non-zero naming every key that does not resolve.
  **Adding the script requires approval before editing `package.json`.**

## 8. Notes caching

- [x] 8.1 (TDD: test → impl) `local-filesystem-lesson-notes-repository.test.ts`:
  two `byLesson` calls for the same lesson against a non-local store perform one
  `readText`. Then add the cache.
- [x] 8.2 (TDD: test → impl) The cache is keyed by content key, so two lessons
  sharing a notes key resolve from one read and different keys never collide.

## 9. Commit the initial manifest and document it

- [x] 9.1 Commit `content-locations.json` declaring the single `local` store as
  `default` — today's behaviour, now written down — and assert in a test that it
  parses and resolves every seed key to `local`.
- [x] 9.2 Document the manifest in `scripts/README.md` (or a sibling): its shape,
  the resolution order, how to migrate a module, how to move one file, and the
  distinction from the build-time `courses.manifest.json`.

## 10. Verification

- [x] 10.1 Run `pnpm verify` (typecheck, format:check, lint, test:run) and fix
  every failure at its root cause.
- [x] 10.2 Run the Docker-gated driver suites with Docker running, and confirm
  they skip cleanly with Docker stopped.
- [x] 10.3 Run `USE_COURSE_CONTENT_SEED=1 pnpm test:e2e` for `home-course-ladder`,
  `course-catalog`, `course-overview` and `lesson-page` with NO manifest present,
  confirming the default boot path is unchanged.
- [x] 10.4 Manually verify one lesson end-to-end against a `signed` store: the
  video plays, seeking works, and the network panel shows a 302 from
  `/api/content` followed by a direct bucket fetch.

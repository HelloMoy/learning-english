## 1. Schema

- [x] 1.1 (TDD: test → impl) `content-locations.test.ts`: an `assets` block
  parses; an entry with neither `store` nor `objectPath` is rejected naming the
  key; an entry naming an undeclared store is rejected naming it; an absent
  block yields `{}`. Then add `assets` to the Zod schema and its validation.
- [x] 1.2 JSDoc on the new schema fields per `jsdoc-typescript-docs`, stating why
  `assets` is the only layer that may change the object path.

## 2. Resolution

- [x] 2.1 (TDD: test → impl) `resolveStoreNameFor`: an `assets` entry with a
  `store` outranks an exact `overrides` entry and any `routes` prefix; an entry
  without a `store` leaves routing alone. Then add the layer.
- [x] 2.2 (TDD: test → impl) `objectPathFor` gains an assets-aware form: a
  declared `objectPath` replaces both the key and the store's `pathPrefix`; an
  entry without one falls back to `pathPrefix + key`.
- [x] 2.3 (TDD: test → impl) Full precedence, asserted in one table:
  `assets` → `overrides` → longest prefix → `default`.

## 3. RoutingBlobStore honours the layer

- [x] 3.1 (TDD: test → impl) `url`, `exists` and `readText` each reach the
  declared store at the declared object path. Then thread the manifest through.
- [x] 3.2 (TDD: test → impl) `signedUrlFor` signs the declared object path, not
  the key-derived one.
- [x] 3.3 (TDD: test → impl) With no `assets` block, every resolved URL is
  byte-identical to today's.

## 4. Materialize

- [x] 4.1 (TDD: test → impl) `scripts/materialize-content-assets.test.ts`:
  running against a manifest with no `assets` block writes one entry per seed
  key, each with the store and object path it already resolved to. Then
  implement `scripts/materialize-content-assets.ts`.
- [x] 4.2 (TDD: test → impl) Materializing changes no resolved URL — assert every
  key resolves identically before and after.
- [x] 4.3 (TDD: test → impl) A second run leaves the file byte-identical.
- [x] 4.4 (TDD: test → impl) An entry whose `objectPath` diverges from the
  key-derived one keeps it.
- [x] 4.5 Add `materialize:content-assets` to `package.json`.

## 5. Staleness check

- [x] 5.1 (TDD: test → impl) `verify-content.test.ts`: an `assets` key absent
  from the seed is reported as stale; a manifest matching the seed passes. Then
  add the check and make it exit non-zero.

## 6. Documentation

- [x] 6.1 Document the `assets` block in `scripts/README.md`: its shape, the
  full precedence order, when to declare one asset versus a prefix, and how to
  make the manifest exhaustive with one command.

## 7. Verification

- [x] 7.1 Run `pnpm verify` and fix every failure at its root cause.
- [x] 7.2 Materialize into a scratch manifest against the REAL seed and confirm
  all 319 keys are written and every resolved URL is unchanged; leave the
  committed `content-locations.json` without an `assets` block.
- [x] 7.3 Run the touched e2e specs with the committed manifest and confirm the
  default boot path is unchanged.
- [x] 7.4 Verify one lesson end to end against a signed store whose asset
  declares a divergent `objectPath`: the 302's `Location` must point at the
  declared path, and the video must play and seek.

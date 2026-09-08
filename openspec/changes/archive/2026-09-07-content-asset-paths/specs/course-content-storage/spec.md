## MODIFIED Requirements

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
  },
  "assets": {
    // Per-asset declaration. The only layer that can change the object path.
    "advanced-intermediate-course/1-intro/1-welcome/video.mp4": {
      "store": "s3-video",
      "objectPath": "shared/welcome-2024.mp4"
    }
  }
}
```

A key SHALL be routed by, in order: an exact match in `assets`; otherwise an
exact match in `overrides`; otherwise the `routes` entry whose `prefix` is the
LONGEST match; otherwise `default`. The three layers exist because placement
comes in three shapes: a module migrates as a prefix, a stray file moves as one
key, and an asset whose real path does not follow its key needs that path
declared. Expressing any one through another is impractical for 319 keys.

The `assets` block SHALL be optional, and SHALL map a content key to
`{ store?, objectPath? }`, both optional. A declared `store` overrides routing
for that key; a declared `objectPath` replaces the key-derived object path
within the resolved store, `pathPrefix` included. An entry declaring neither is
a no-op and SHALL be rejected rather than silently ignored.

`assets` SHALL be the ONLY layer that can change the object path. `routes` and
`overrides` move a key between stores while it keeps its key-derived path,
because that is what a bulk migration does.

Absent an `assets` entry, a store's `pathPrefix` SHALL be prepended to the key to
form the object path inside that store. The content key SHALL NOT be redefined
by a move: the key is identity, the object path is placement, and conflating
them would break the guarantee that a move leaves `seed-content.ts` untouched.
That is exactly why an asset whose path diverges is declared here rather than by
rewriting its key.

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

#### Scenario: A declared asset overrides both its store and its object path

- **WHEN** the `assets` block maps a key to `{ store: "s3-video", objectPath: "shared/welcome-2024.mp4" }`
  and a `routes` prefix would otherwise send that key to `local`
- **THEN** the key resolves through `s3-video` at exactly `shared/welcome-2024.mp4`,
  with neither the key nor the store's `pathPrefix` contributing to the path

#### Scenario: A declared asset may redirect only the path

- **WHEN** an `assets` entry declares `objectPath` but no `store`
- **THEN** the key keeps the store its routes give it, and only its object path changes

#### Scenario: A declared asset may redirect only the store

- **WHEN** an `assets` entry declares `store` but no `objectPath`
- **THEN** the key resolves through that store at its normal key-derived path,
  `pathPrefix` included

#### Scenario: An asset entry outranks an override and a route

- **WHEN** the same key appears in `assets`, in `overrides`, and under a `routes` prefix
- **THEN** the `assets` entry decides, because it is the most specific declaration

#### Scenario: An empty asset entry is rejected rather than ignored

- **WHEN** an `assets` entry declares neither `store` nor `objectPath`
- **THEN** the manifest fails validation naming that key, because an entry that
  changes nothing is an authoring mistake, not a default

#### Scenario: An asset entry naming an undeclared store fails loudly

- **WHEN** an `assets` entry names a store absent from `stores`
- **THEN** the manifest fails validation naming that entry, as `routes` and
  `overrides` already do

## ADDED Requirements

### Requirement: Every asset's placement can be materialized into the manifest

The system SHALL provide `pnpm materialize:content-assets`, which writes every
content key in `seed-content.ts` into the manifest's `assets` block with the
store and object path that key currently resolves to.

This exists so that an exhaustive manifest — every asset's placement written
down rather than inferred — is one command instead of 319 hand-typed entries.
Hand-typing them is the erratum risk the inference was avoiding; generating them
is not.

Materializing SHALL be idempotent: running it against an already-materialized
manifest that has not moved any asset SHALL leave the file byte-identical.

Materializing SHALL preserve entries whose `objectPath` diverges from the
key-derived one, because those record a decision the walk cannot rediscover.

The command SHALL be opt-in. An absent `assets` block stays absent unless it is
run, and the system's behaviour is identical either way.

#### Scenario: Every key is written down in one command

- **WHEN** `pnpm materialize:content-assets` runs against a manifest with no `assets` block
- **THEN** the manifest gains one `assets` entry per content key in the seed, each
  naming the store and object path that key already resolved to

#### Scenario: Materializing changes no URL

- **WHEN** the manifest is materialized and the app resolves every key before and after
- **THEN** every resolved URL is byte-identical, because the entries record what
  routing already produced

#### Scenario: Re-materializing an unchanged manifest is a no-op

- **WHEN** the command runs twice with no content or routing change in between
- **THEN** the second run leaves `content-locations.json` byte-identical

#### Scenario: A hand-declared divergent path survives materializing

- **WHEN** an `assets` entry declares an `objectPath` that the key would not
  produce, and the command runs
- **THEN** that entry keeps its declared `objectPath`

### Requirement: Declared assets are checked against the seed

`pnpm verify:content` SHALL additionally report every `assets` entry whose key is
absent from `seed-content.ts`, and SHALL exit non-zero when there is one.

An exhaustive `assets` block goes stale the moment content is renamed or removed
and the seed is regenerated. Without this check the manifest would accumulate
entries for keys nothing asks for any more, and a reader could no longer tell
which placements are real.

#### Scenario: A stale asset entry is named

- **WHEN** the manifest declares an `assets` entry for a key the seed no longer contains
- **THEN** `pnpm verify:content` exits non-zero and names that key as stale

#### Scenario: A manifest matching the seed passes

- **WHEN** every `assets` entry names a key the seed contains, and every key resolves
- **THEN** `pnpm verify:content` exits zero

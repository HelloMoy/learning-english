## Why

The location manifest says which STORE owns a key. It does not say where the
asset is, because the key itself carries that: `<course>/<module>/<lesson>/<file>`
is inferred by walking the content tree, and the 319 resulting keys live in the
generated `seed-content.ts`.

That inference is convenient but it is not a contract. It cannot express an
asset whose real path does not match its key — a video shared by two lessons, a
file renamed inside a bucket, a PDF that lives outside its lesson folder. And it
means the manifest is only half the answer to "where does this course's content
come from", which is the question it was introduced to answer.

## What Changes

- Add an optional `assets` block to `content-locations.json`: content key →
  `{ store?, objectPath? }`. A declared entry OVERRIDES the routing rules and
  the key-derived object path for that one asset.
- Resolution for a key becomes: `assets` entry → `overrides` → longest `routes`
  prefix → `default`. `assets` is the only layer that can change the object path
  as well as the store.
- Add `pnpm materialize:content-assets`, which writes every key currently in
  `seed-content.ts` into the `assets` block with its resolved store and object
  path. This is what makes "all 319 routes are in the manifest" a single command
  instead of hand-typing, for anyone who wants the manifest to be exhaustive
  rather than an exception list.
- `pnpm verify:content` gains a check that no `assets` entry names a key absent
  from the seed, so the block cannot silently accumulate dead entries.
- Nothing becomes required. With no `assets` block the system behaves exactly as
  it does today.

## Capabilities

### New Capabilities

None. This extends the placement layer that `course-content-storage` defines.

### Modified Capabilities

- `course-content-storage`: the location manifest gains a per-asset layer that
  can override both the store and the object path for one key; the resolution
  order gains a step above `overrides`; `verify:content` gains a staleness check
  over declared assets.

## Non-goals

- No change to how keys are generated. The content tree still produces them, and
  `seed-content.ts` remains the inventory of what the app asks for.
- No removal of `routes` or `overrides`. A prefix stays the right way to migrate
  a module; `assets` is for the cases a prefix cannot express.
- `assets` does not become mandatory, and the materialize command is opt-in — an
  exhaustive manifest is a choice, not the default.
- No change to the domain, to any lesson/resource/notes adapter, to the signing
  endpoint, or to the drivers.
- Not a way to add assets the seed does not know about. An `assets` entry
  redirects a key that already exists; it cannot introduce one.

## Impact

- **Modified**: `content-locations.ts` (schema + resolution), `routing-blob-store.ts`
  (object path from the assets layer), `verify-content.ts` (staleness check),
  `scripts/README.md`, `content-locations.json`.
- **New**: `scripts/materialize-content-assets.ts` and its test; a
  `materialize:content-assets` script in `package.json`.
- **Risk — an exhaustive `assets` block goes stale** when content is added or
  renamed and the seed is regenerated. Mitigated by the staleness check in
  `verify:content` and by re-running materialize after a regeneration.
- **Risk — two sources of truth for placement.** Mitigated by a strict
  precedence order, documented and tested, and by `assets` being absent by
  default.

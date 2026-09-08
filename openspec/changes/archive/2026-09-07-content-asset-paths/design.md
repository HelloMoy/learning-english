## Context

`content-locations.json` today answers "which store owns this key". It does not
answer "where is this asset", because the key is the path: the generator walks
`<course>/<module>/<lesson>/<file>` and emits 319 keys into `seed-content.ts`,
and every store resolves `pathPrefix + key`.

That inference is a good default and a bad contract. It cannot express:

- one video shared by two lessons (two keys, one object),
- an object renamed inside a bucket after a migration,
- a resource that lives outside the lesson folder its key names.

It also means the manifest is only half the answer to the question it exists to
answer. The user asked for asset paths in the manifest from the start; routing
delivered placement-by-prefix, which is the bulk case, not the whole case.

Constraints:

- `resolveStoreNameFor` and `objectPathFor` are pure and separately tested;
  `RoutingBlobStore` composes them. The new layer has to slot into both.
- `seed-content.ts` stays the inventory. An `assets` entry redirects a key; it
  cannot invent one.
- The existing default — no `assets` block — must stay byte-identical.

## Goals / Non-Goals

**Goals:**

- Let any asset's real object path be declared, not inferred.
- Make "every route is in the manifest" reachable in one command, not 319 edits.
- Keep the exception case cheap: declaring one asset must not require declaring
  the rest.
- Keep an exhaustive block honest as content changes.

**Non-Goals:**

- Replacing `routes`/`overrides`. A prefix remains the right shape for a bulk
  migration.
- Making `assets` mandatory, or materializing by default.
- Letting the manifest introduce keys the seed does not have.

## Decisions

### 1. `assets` sits ABOVE `overrides` and is the only layer that can change the path

Resolution: `assets` → `overrides` → longest `routes` prefix → `default`.

*Why above:* it is strictly the most specific declaration — an exact key, with an
explicit path. A layer that can say more must win over layers that say less.

*Why only `assets` may change the path:* `routes` and `overrides` describe
migrations, and a migration preserves the object layout. If a prefix could
rewrite paths, a bulk move would become impossible to reason about — you could
no longer predict where a key landed without evaluating every rule. Keeping path
rewriting to the one layer that names a single key keeps the model closed.

*Alternative rejected — folding `objectPath` into `overrides` by widening its
value from a string to an object.* It would collapse three layers into two, but
it would also make the common case (a bare store name) and the rare case share a
shape, and it would let a bulk-ish edit silently change paths. Two names for two
different jobs is clearer than one name doing both.

### 2. An entry declaring neither `store` nor `objectPath` is rejected

*Why not ignore it:* an empty entry is someone starting to write a declaration
and stopping. Ignoring it means the asset silently keeps its inferred placement
while the manifest appears to say otherwise — the exact class of lie
`verify:content` exists to catch.

### 3. Exhaustiveness is generated, never typed

`pnpm materialize:content-assets` writes all 319 entries from what routing
already resolves.

*Why:* the user wants the manifest to carry the routes. The reason I did not put
them there originally was the maintenance cost of hand-writing them — which
disappears when a command writes them. Generating them also guarantees the
materialized manifest changes no URL, which hand-typing cannot.

*Idempotence matters* because otherwise the command is unusable in review: a
no-op run must produce a byte-identical file, or every regeneration looks like a
change.

*Divergent paths are preserved*, because a hand-declared `objectPath` records a
decision the walk cannot rediscover — re-deriving it would silently undo it.

### 4. Staleness is checked, not prevented

An exhaustive block goes stale when content is renamed and the seed regenerates.
Rather than couple the generator to the manifest, `verify:content` reports
`assets` keys the seed no longer has.

*Why report rather than auto-prune:* deleting an entry is a content decision. A
key vanishing from the seed usually means the content moved or was renamed, and
the right fix is often to update the entry, not drop it.

### 5. The layer lives in `content-locations.ts`, beside the rules it extends

`resolveStoreNameFor` gains the `assets` check; `objectPathFor` gains an
`assets`-aware sibling. Both stay pure, so `RoutingBlobStore` needs only to pass
the manifest it already holds.

## Risks / Trade-offs

- **Two sources of placement truth once `assets` is populated.** → A strict,
  tested precedence order, and `assets` absent by default. The materialize
  command makes the two agree by construction.
- **A materialized manifest is a 319-entry diff the first time.** → One commit,
  reviewed once; after that a real move is a small diff inside it. Anyone who
  prefers the exception-list shape simply never runs the command.
- **A stale entry survives until someone runs `verify:content`.** → Accepted; the
  alternative is coupling the seed generator to a runtime manifest, which would
  reintroduce the build-time/runtime confusion the two manifests exist to avoid.
- **`objectPath` bypasses `pathPrefix`,** which could surprise someone who set
  both. → It is documented as a full replacement, and the scenario is tested.

## Migration Plan

1. Schema + resolution (pure, unit-tested). Nothing consumes it.
2. `RoutingBlobStore` honours the layer; every existing test must stay green with
   no `assets` block present.
3. `materialize-content-assets.ts`, asserted to change no URL and to be idempotent.
4. `verify:content` staleness check.
5. Documentation. `content-locations.json` itself is left WITHOUT an `assets`
   block: materializing is the user's call, and doing it for them would put a
   319-entry diff in this change.

Rollback: reverting restores inference-only resolution; no content moves.

## Testing strategy

Pure resolution and tooling — **Vitest** throughout. No component tests; the e2e
suite only proves the default path did not move.

| Behavior | Layer | File / pattern mirrored |
| --- | --- | --- |
| Schema: `assets` optional, entry with neither field rejected, unknown store rejected | Vitest unit | existing `content-locations.test.ts` |
| Resolution: `assets` beats `overrides` beats longest prefix beats default | Vitest unit | same file, extending the existing precedence tests |
| Object path: declared `objectPath` replaces key AND `pathPrefix`; store-only and path-only entries | Vitest unit | same file, beside `objectPathFor` |
| `RoutingBlobStore` honours the layer for `url`, `exists`, `readText`, and signing | Vitest unit, fake drivers | existing `routing-blob-store.test.ts` |
| No `assets` block ⇒ byte-identical URLs | Vitest unit | the existing fallback assertion in `routing-blob-store.test.ts` |
| Materialize: writes one entry per seed key; changes no resolved URL; idempotent; preserves divergent paths | Vitest integration, tmpdir manifests | mirrors `scripts/move-content.test.ts` |
| `verify:content` names stale `assets` keys and exits non-zero | Vitest unit | existing `scripts/verify-content.test.ts` |
| Committed manifest still routes every seed key | Vitest unit | existing `content-locations-manifest.test.ts` |
| Default boot unchanged | Playwright e2e | `home-course-ladder`, `course-catalog`, `lesson-page` |

The signed-store path is already covered end to end by the previous change; this
one re-runs those assertions through a manifest that declares an `objectPath`,
so the redirect is proven to follow the declaration rather than the key.

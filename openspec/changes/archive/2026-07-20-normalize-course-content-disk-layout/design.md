## Context

The content-seed generator reads folders by their raw on-disk names (so `ffprobe` succeeds against real paths) but emits URLs built from kebab-case slugs, and nothing renames the disk to match — a contradiction inherited from the archived `filesystem-backed-course-content` design (design.md line 25: "No renaming or reorganization of the source folder layout"). Result: every `/local-filesystem-lesson/...` URL 404s.

Current state:
- `scripts/generate-course-content-seed.ts` — walks raw folders, slugifies folder segments via a private `resolveSlug` (`SLUG_OVERRIDES` → `slugify`), but builds `videoKey = ${lessonSlug}/${rawFileName}` (basename NOT slugified) in `scripts/discriminate-lesson.ts`.
- `scripts/slug.ts` — `slugify` (idempotent, Spanish transliteration). `scripts/slug-overrides.ts` — empty override map.
- `LocalFilesystemBlobStore` — `url(key)` and `exists(key)`; `exists()` is never called by the generator.
- Assets: `public/local-filesystem-lesson/` — 15 GB, 319 files, **gitignored** (no git safety net for renames).
- The content seed is opt-in (`USE_COURSE_CONTENT_SEED=1`); default dev boot uses the A1 seed and is unaffected.

Constraints: hexagonal + folder-per-entity; `BlobStore` is not a domain port; `architecture-boundaries` keeps `src/domain/**` free of adapter concerns. Repo rule: no `package.json`/tooling changes and no commits without explicit approval.

## Goals / Non-Goals

**Goals:**
- The physical path of every asset equals the content key the generator emits, so seed URLs resolve under Next.js `/public`.
- Content keys are kebab-case ASCII end to end (folders **and** file basenames).
- The original human-readable names survive the rename, stored in the generated seed.
- The slug↔disk drift becomes impossible to ship silently again (loud validation).
- One shared slug implementation drives both renaming and seed generation.

**Non-Goals:**
- No change to default dev boot (A1 seed stays the default; flag stays off).
- No S3/R2 driver work — that remains a future change.
- No new domain entity kinds or lesson/resource behavior changes.
- No CI wiring of the generator (still a manual, committed-output step).
- No re-encoding, moving, or deduplicating the media bytes themselves — only renames.

## Decisions

### 1. A single shared slug resolver drives both rename and generation
Extract the generator's private `resolveSlug` (override-map-then-`slugify`) into a shared module (e.g. `scripts/resolve-slug.ts`) imported by BOTH the rename script and the generator. The path-equality guarantee ("disk name == emitted key segment") only holds if there is exactly one slug function; two copies would reintroduce drift.
- _Alternative rejected_: duplicate the logic in the rename script — this is precisely the two-implementations-drift that caused the bug.

### 2. Renaming lives in a separate script, not inside the generator
Add `scripts/normalize-content-disk.ts` (destructive) distinct from the generator (which stays effectively read-only aside from writing the seed). Rationale: single responsibility, independently testable against a fixture tree, and a destructive one-time operation should be explicit — not a side effect of "generate the seed."
- _Alternative rejected_: fold rename into the generator — couples a one-time destructive op to a routinely-rerun read step and makes dry-run semantics muddy.

### 3. Rename script is dry-run by default, `--apply` to execute, and writes a reversal manifest
Because the tree is gitignored (no `git checkout` to undo), the script defaults to printing the planned `old → new` renames and only mutates disk with `--apply`. On `--apply` it writes a `rename-manifest.json` (old path → new path) enabling a scripted reversal.
- _Alternative rejected_: mutate immediately — too dangerous on 15 GB with no VCS safety net.

### 4. Basename slugification: slugify the stem, lowercase the extension
`normalizeFileName(name) = slugify(stem) + extname.toLowerCase()`. Keeps the extension meaningful while making the whole name URL-safe. `discriminate-lesson.ts` changes `videoKey`/`posterKey`/`resourceKeys` from `${lessonSlug}/${rawFile}` to `${lessonSlug}/${normalizeFileName(rawFile)}`.

### 5. Original names are stored as a side-map in the seed, keyed by entity id — NOT as domain-entity fields
The generator emits an additional export in `seed-content.ts`, e.g. `seedContentSourceNames: Record<EntityId, string>` (course/module/lesson/resource id → original raw folder/file name). This satisfies "store in the seed" while keeping `Course`/`Module`/`Lesson`/`Resource` free of a presentation-irrelevant field that most consumers never read (respects `architecture-boundaries`).
- _Alternative rejected_: add `originalName` to each domain entity — pollutes the domain, forces a schema change across all seeds/tests, and couples the domain to an import concern.

### 5b. Original names reach the generator via a rename manifest (the manifest bridge)
Renaming the disk destroys the original names, and the migration order is normalize-first → regenerate — so at generation time the raw names are already gone from disk. The **only** actor that sees both names is the rename script, at rename time. Therefore `normalize-content-disk.ts --apply` writes a `rename-manifest.json` at the content root recording every `originalRelativePath → slugRelativePath`. The generator reads this manifest and builds a reverse map (`slugRelativePath → original leaf name`) to populate `seedContentSourceNames` keyed by entity id.
- Manifest shape: `{ "version": 1, "entries": [{ "from": "<original rel path>", "to": "<slug rel path>" }, ...] }`.
- Fallback: if no manifest is present (e.g. content already normalized with no history), or an entry has no manifest match, the generator falls back to the current on-disk leaf name as the "original" (best effort, never fails generation on this account).
- _Alternative rejected_: single combined rename+generate script — couples a destructive op with routine regeneration and loses originals on any later re-run over an already-slug disk.

### 6. Rename bottom-up, detect collisions per directory before mutating
Walk deepest-first so renaming a parent never invalidates not-yet-processed child paths. Before renaming entries in a directory, compute all target slugs and abort (non-zero, both names reported) if two distinct raw names collide — no partial rename of that directory.

### 7. Case-only renames go through a temp name
On case-insensitive filesystems (macOS APFS default), `"Intro" → "intro"` is a no-op or errors. Detect case-only differences and perform a two-step rename (`X → X.tmp-<n> → x`).

## Testing strategy

Scripts-only change → no RTL/component and no Playwright e2e. Coverage is **Vitest unit**, mirroring the existing `scripts/generate-course-content-seed.test.ts`, `scripts/discriminate-lesson.test.ts`, and `scripts/slug.test.ts` patterns and their `scripts/__fixtures__` synthetic trees (no 15 GB required — tests build a tmp dir).

- `scripts/resolve-slug.test.ts` — shared resolver returns override-then-slugify; identical output the generator relied on.
- `scripts/normalize-content-disk.test.ts` — folder rename; basename rename (stem slugified, ext lowercased); idempotent re-run is a no-op; collision aborts with both names and no partial rename; case-only rename via temp; dry-run makes no disk changes and prints the plan; `--apply` writes `rename-manifest.json`.
- `scripts/discriminate-lesson.test.ts` (extend) — `videoKey`/`posterKey`/`resourceKeys` now carry slugified basenames.
- `scripts/generate-course-content-seed.test.ts` (extend) — generator calls `exists()` for every emitted key; a missing key exits non-zero with no partial write; `seedContentSourceNames` is emitted with correct id→original mappings.

Manual acceptance (the real 15 GB tree, one-time): run `normalize-content-disk --apply`, regenerate the seed, then `USE_COURSE_CONTENT_SEED=1 pnpm dev` and load a lesson page — the video and resource links resolve (no 404).

## Risks / Trade-offs

- **Destructive rename on 15 GB with no VCS undo** → dry-run default + `--apply` gate + `rename-manifest.json` for scripted reversal; run manually, review the plan first.
- **Case-insensitive FS mishandles case-only renames** → explicit two-step temp rename.
- **Slug resolver drift reappears if copied** → single shared module (Decision 1); a generator `exists()` check (spec: "Generator validates every emitted key") makes any future drift fail loudly instead of 404ing at runtime.
- **`seedContentSourceNames` grows the committed seed file** → it is a flat id→string map, small relative to the entity arrays; acceptable.
- **Extension-only or dotfile names** (e.g. `.DS_Store`) → normalization skips hidden/system files and non-content files; document the skip list so nothing is silently renamed.
- **Two folders differing only by punctuation collide** → collision guard aborts and surfaces both, prompting a `slug-overrides.ts` entry.

## Migration Plan

1. Extract shared `resolveSlug` → `scripts/resolve-slug.ts`; point the generator at it (no behavior change yet).
2. Slugify basenames in `discriminate-lesson.ts` (`normalizeFileName`).
3. Add `exists()` validation + `seedContentSourceNames` emission to the generator.
4. Write `scripts/normalize-content-disk.ts` (dry-run default, `--apply`, writes `rename-manifest.json`).
5. **Manual, one-time**: `tsx scripts/normalize-content-disk.ts` (review plan) → `--apply` on the real tree (produces the manifest).
6. Regenerate: `pnpm generate:content-seed` (reads the manifest for original names) → commit the new `seed-content.ts`.
7. Validate: `USE_COURSE_CONTENT_SEED=1 pnpm dev`, open a lesson, confirm media resolves.

Rollback: re-run the rename script in reverse using `rename-manifest.json`; the generator is deterministic, so regenerating restores the prior seed if the disk is reverted.

## Open Questions

- Exact shape of `seedContentSourceNames`: flat `Record<id, string>` (original leaf name) vs `Record<id, { name: string; path: string }>` (full original relative path). Leaning flat leaf-name; confirm if full original path is wanted for debuggability.
- Do we add `pnpm` scripts (`normalize:content`, and confirm `generate:content-seed` exists)? Adding/editing `package.json` scripts needs explicit approval per repo rule — default to invoking via `tsx` until approved.
- Should the top-level course folder also be normalized (it already slugs cleanly to `advanced-intermediate-course`)? Yes for consistency; confirm no external references assume the raw name.

# Tasks: normalize-course-content-disk-layout

## 1. Shared slug resolver (foundation)

- [x] 1.1 (TDD: test → impl) Add `scripts/resolve-slug.test.ts` asserting override-map-first then `slugify` fallback, and idempotency, matching the generator's current private `resolveSlug` behavior.
- [x] 1.2 Extract `resolveSlug` into `scripts/resolve-slug.ts` (imports `slugify` + `SLUG_OVERRIDES`); make the test pass.
- [x] 1.3 Point `scripts/generate-course-content-seed.ts` at the shared `resolveSlug` (delete the private copy); no behavior change — existing generator tests stay green.

## 2. Slugify media/resource basenames

- [x] 2.1 (TDD: test → impl) Extend `scripts/discriminate-lesson.test.ts`: `videoKey`, `posterKey`, and `resourceKeys` carry a slugified stem + lowercased extension (e.g. `Aprende Inglés...mp4` → `aprende-ingles-...mp4`).
- [x] 2.2 Add `normalizeFileName(name)` (stem via shared slug, ext lowercased) and use it in `classifyLessonFolder` for all key construction; make the test pass.

## 3. Generator: validation + original-name emission

- [x] 3.1 (TDD: test → impl) Extend `scripts/generate-course-content-seed.test.ts`: generator calls `BlobStore.exists()` on every emitted key; a missing key exits non-zero with no partial write.
- [x] 3.2 Implement the `exists()` validation pass in the generator (fail loudly, name the offending key, do not write partial seed).
- [x] 3.3 (TDD: test → impl) Extend the generator test: given a `rename-manifest.json`, a `seedContentSourceNames: Record<EntityId, string>` export maps each course/module/lesson/resource id to its original raw name; missing manifest entries fall back to the on-disk name without failing.
- [x] 3.4 Read `rename-manifest.json` (reverse map slug→original), and emit `seedContentSourceNames` from `renderSeedFile`.

## 4. Disk normalization script

- [x] 4.1 (TDD: test → impl) Add `scripts/normalize-content-disk.test.ts` against a `__fixtures__` tmp tree: folder rename, basename rename (stem slugified / ext lowercased), idempotent re-run no-op.
- [x] 4.2 (TDD: test → impl) Add collision case: two distinct raw names → same slug in one directory aborts non-zero, reports both, performs no partial rename.
- [x] 4.3 (TDD: test → impl) Add case-only rename case (e.g. `Intro` → `intro`) handled via two-step temp rename.
- [x] 4.4 (TDD: test → impl) Add dry-run vs `--apply`: dry-run mutates nothing and prints the `old → new` plan; `--apply` performs renames and writes `rename-manifest.json`.
- [x] 4.5 Implement `scripts/normalize-content-disk.ts` (bottom-up walk, shared `resolveSlug` + `normalizeFileName`, skip hidden/system files like `.DS_Store`, dry-run default) to satisfy 4.1–4.4.

## 5. Apply to real content (manual, one-time)

- [x] 5.1 Run `tsx scripts/normalize-content-disk.ts` (dry-run) against `public/local-filesystem-lesson/`; review the printed rename plan and add any `slug-overrides.ts` entries needed to resolve collisions or ugly slugs.
- [x] 5.2 Run with `--apply`; confirm `rename-manifest.json` is written.
- [x] 5.3 Regenerate the seed (`pnpm generate:content-seed` or `tsx scripts/generate-course-content-seed.ts`); confirm zero `exists()` failures and inspect the `seed-content.ts` diff (fully-slugified keys + `seedContentSourceNames`).

## 6. End-to-end validation

- [x] 6.1 Boot with `USE_COURSE_CONTENT_SEED=1 pnpm dev`, open a lesson page, and confirm the video plays and resource links resolve (no 404) — the acceptance signal for the whole change.
- [x] 6.2 Run `pnpm test:run` for the touched `scripts/**` area and confirm all unit suites pass; confirm the default-boot path (A1 seed) is unchanged.
## 7. Polish (verify suggestions)

- [x] 7.1 (TDD: test → impl) Add a task entry to `tasks.md` documenting the NFD fix done during apply (`slug.ts` normalize + strip combining marks + test). Traceability only.
- [x] 7.2 (TDD: test → impl) Replace the asymmetric POSIX-on-disk / path.sep-on-lookup path handling in `normalize-content-disk.ts` and `loadOriginalNameMap` with a single shared `toPosix(p)` helper in `scripts/resolve-slug.ts`. Cover with a unit test.
- [x] 7.3 (TDD: test → impl) Preserve the raw on-disk filename for every resource/poster/readme in `classifyLessonFolder` so `seedContentSourceNames` for resources carries the original name even when no `rename-manifest.json` entry matches. Extend `discriminate-lesson.test.ts`.
- [x] 7.4 Regenerate the seed after 7.3 and confirm a resource's `seedContentSourceNames[id]` holds the raw original (e.g. `"Day_9_Practice_My_Best_Friend.pdf"`).

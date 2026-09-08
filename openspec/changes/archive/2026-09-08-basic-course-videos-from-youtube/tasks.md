## 1. Manifest schema — `lessonVideoSources`

- [x] 1.1 Add the `lessonVideoSources` field to `CourseDeclaration` in `scripts/courses-manifest/courses-manifest.ts`, accepting a record of `moduleSlug/lessonSlug` → URL (TDD: test → impl, in `courses-manifest.test.ts`)
- [x] 1.2 Reject a key that is not a two-segment `moduleSlug/lessonSlug` pair, via `superRefine`, mirroring `LessonTitleOverrides` — assert on the message, not just the failure (TDD: test → impl)
- [x] 1.3 Reject a value that is not an absolute `http(s)` URL, so a content key or site-relative path cannot be declared here (TDD: test → impl)
- [x] 1.4 Carry the table onto `ResolvedCourse`, defaulting to `{}` in `resolveCourseDeclaration`, so a manifest declaring nothing behaves exactly as before (TDD: test → impl)

## 2. Shared absolute-URL predicate

- [x] 2.1 Export the existing `isAbsoluteHttpUrl` from `src/domain/entities/url-or-path/url-or-path.ts` so the adapter's bypass and the domain's own acceptance rule cannot drift apart (TDD: test → impl, in `url-or-path.test.ts`)

## 3. Adapter — stop resolving values that are already URLs

- [x] 3.1 In `resolveLessonRow`, pass a `source` that is already an absolute `http(s)` URL through untouched instead of calling `blobStore.url()`; assert via the existing `fakeBlobStore.keysAsked` that the store was never consulted (TDD: test → impl, in `resolve-content-row.test.ts`)
- [x] 3.2 Confirm a URL-sourced lesson still resolves its `poster` content key through the store, so only `source` is exempt (TDD: test → impl)
- [x] 3.3 Confirm a key-sourced lesson is unchanged — the existing resolution path still runs (TDD: test → impl)

## 4. Generator — emit the declared URL

- [x] 4.1 In `generate-course-content-seed.ts`, use the course's `lessonVideoSources` entry as the row's `source` when present, falling back to the derived content key; leave `discriminate-lesson.ts` untouched (TDD: test → impl, in `generate-course-content-seed.test.ts`)
- [x] 4.2 Confirm a lesson with no entry emits its content key exactly as before, and that `poster`, resources and titles are unaffected in both cases (TDD: test → impl)
- [x] 4.3 Confirm `durationSeconds` still comes from the local `.mp4` via `probeDurationSeconds` for a declared lesson (TDD: test → impl)

## 5. Generator — exempt URLs from on-disk key validation

- [x] 5.1 Skip the `exists(key)` check for an emitted `source` that is an absolute URL, while still checking that lesson's `poster` and resource keys (TDD: test → impl, in `generate-course-content-seed.validation.test.ts`)
- [x] 5.2 Confirm a genuinely missing content key still fails generation loudly and does not write a partial seed (TDD: test → impl — guards against the exemption widening)

## 6. Content data

- [x] 6.1 Add the 48 verified `lessonVideoSources` entries for `basic-course` to `public/local-filesystem-lesson/courses.manifest.json` (untracked data file; mapping already resolved and verified)
- [x] 6.2 Mirror the new field in `scripts/courses.manifest.example.json`, the tracked record of the manifest's shape
- [x] 6.3 Regenerate `seed-content.ts` and review the diff: exactly 48 `source` values change in `basic-course`, and nothing else moves — no poster, no resource, no title, nothing in `advanced-intermediate-course`

## 7. Verification

- [x] 7.1 Run `pnpm verify` (typecheck, format, lint, `pnpm test:run`) and fix any failure at its root cause
- [x] 7.2 Verify playback in the browser with Playwright MCP for one lesson per module of the Basic Course — confirm the YouTube provider loads, the local poster still paints, and the Notes/Resources tabs are unchanged
- [x] 7.3 Confirm no e2e changes are needed: `e2e/` is untouched by this change, and existing playback specs cover the unchanged player behavior

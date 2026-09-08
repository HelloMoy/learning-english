## Context

`scripts/generate-course-content-seed.ts` walks `public/local-filesystem-lesson/`
and emits `src/adapters/persistence/in-memory/seed/seed-content.ts`. Everything a
course *is* — beyond what a folder tree can express — is currently spread across
four places:

| What | Where today |
| --- | --- |
| `title`, `description`, `language` | derived/templated inline (`generate-course-content-seed.ts:370-383`) |
| `sequence` | `const CONTENT_COURSE_SEQUENCE = 2` (`:138`) |
| slug corrections | `scripts/slug-overrides.ts` (`SLUG_OVERRIDES`) |
| notes-heading allowlist | `scripts/title-from-notes-modules.ts` |
| lesson title corrections | `scripts/title-overrides.ts` |
| second course | impossible — `courseFolders[0]`, siblings dropped with `console.warn` (`:219-228`) |

Constraints that shape the design:

- The content root is ~15 GB and fully gitignored, so the generator already cannot
  run on a fresh clone. Nothing about reproducibility gets *worse* by putting more
  build-time input beside that content.
- `resolveSlug` is deliberately shared by the generator AND
  `normalize-content-disk.ts`; the spec calls two copies of that logic "exactly the
  drift that caused seed URLs to 404". Whatever replaces `SLUG_OVERRIDES` must stay
  shared by both.
- `seed-content.ts` is committed and is the only artifact the app boots from.
- The domain must not learn about the manifest: this is build-time tooling under
  `scripts/`, outside the hexagon.

## Goals / Non-Goals

**Goals:**

- One declarative file per content root where a new course is declared: folder,
  slug, title, description, language, ladder position, and its three override maps.
- The generator emits N courses instead of 1.
- Adding a course touches no `.ts` file.
- Absence of the manifest reproduces today's output exactly; a malformed manifest
  fails loudly.
- The manifest is untracked, per the explicit requirement, with the review loss
  mitigated rather than ignored.

**Non-Goals:**

- Runtime manifest reads. The app still boots from `seed-content.ts`.
- Declaring modules, lessons or resources in the manifest — those stay inferred
  from disk. The manifest only carries what disk cannot express.
- Touching `BlobStore`, key resolution, lesson/resource discrimination, or the
  `USE_COURSE_CONTENT_SEED` opt-in.

## Decisions

### 1. One manifest at the content root, listing courses — not one manifest per course

`public/local-filesystem-lesson/courses.manifest.json` holds a `courses` array.

*Why:* `sequence` uniqueness is a cross-course invariant (two courses cannot share a
rung of the home ladder), and so is slug uniqueness. A single file lets the loader
validate both in one pass. Per-course `course.json` files would push that check into
a directory scan and make "what does this content root contain?" unanswerable
without walking it.

*Alternative rejected:* extending the existing `rename-manifest.json`. That file is
an *output* of `normalize-content-disk.ts`, rewritten on every run; hand-authored
declarations do not belong in a machine-generated file.

### 2. Override maps are nested inside each course entry, keyed relative to the course

`slugOverrides` keys stay raw on-disk names; `lessonTitleOverrides` keys become
`moduleSlug/lessonSlug` instead of today's `courseSlug/moduleSlug/lessonSlug`;
`titleFromNotesModules` holds bare module slugs.

*Why:* the course prefix in today's keys exists only to disambiguate across courses.
Nesting makes that structural instead of textual — a cross-course collision becomes
unrepresentable rather than merely discouraged. It also means the migration drops a
path segment mechanically, with no judgment calls.

### 3. The manifest is optional; malformed is fatal

Absent → today's derivation path, unchanged. Present-but-invalid → Zod error,
non-zero exit, no write.

*Why:* absence and invalidity mean different things. Absence is a machine that has
content but has not been configured, which must keep working (this is how the repo
behaves today, and how `e2e` and the smoke regenerate test behave). Invalidity is a
typo in a file someone intended to be authoritative — falling back there would
silently regenerate a seed with wrong titles, which is precisely the class of bug the
committed-diff review is supposed to catch.

*Alternative rejected:* making the manifest required. It would break
`regenerate-content-seed.test.ts` and every existing content root the moment this
lands.

### 4. `resolveSlug` takes the override map as an argument

`resolveSlug(rawName)` → `resolveSlug(rawName, overrides)`.

*Why:* the module-level `SLUG_OVERRIDES` import is what makes the function
single-course. Parameterizing keeps the one shared implementation that both the
generator and `normalize-content-disk.ts` call — the property the spec insists on —
while letting each caller supply the map for the course it is currently inside.
`normalize-content-disk.ts` resolves the map by matching the entry's top-level
folder against the manifest's `folder` fields; outside any declared folder it passes
an empty map, which is exactly automatic slugification.

### 5. `seed-content.ts` exports `seedContentCourses`; the other exports already aggregate

Only the singular `seedContentCourse` and `SEED_CONTENT_COURSE_ID` need to change.
`seedContentModules`, `seedContentLessonRows`, `seedContentResourceRows`,
`seedContentSourceNames` and `seedContentNotesKeys` are already flat collections and
already carry `courseId` / `moduleId` on every row, so they simply grow.

*Why no per-course exports:* every consumer already filters by id.
`use-case-dependencies.ts` passes the full row arrays to one
`LocalFilesystemLessonRepository`, which filters on read; splitting by course would
mean N repositories in the composite for no behavioral gain.

*Consumers to update (4 files):* `use-case-dependencies.ts` (`[seedCourse,
seedContentCourse]` → `[seedCourse, ...seedContentCourses]`), its test,
`e2e/home-course-ladder.spec.ts`, `e2e/course-catalog.spec.ts`.

### 6. `scripts/courses.manifest.example.json` is tracked and is the real values

Not a stub — the actual current course entry with all three override maps migrated
into it, such that copying it into place regenerates `seed-content.ts` with an empty
diff.

*Why:* this is the mitigation for the untracked manifest. The repo already uses this
pattern deliberately — `.gitignore` carries a comment explaining the `.env` /
`.env.example` negation for exactly this reason. Without it, deleting the three
tracked override modules would destroy reviewed data that exists nowhere else in
git.

### 7. The manifest loader is its own module

`scripts/courses-manifest/courses-manifest.ts` — Zod schema, `loadCoursesManifest`,
and a `resolveCourseDeclaration` that applies defaults. Folder-per-entity, colocated
tests.

*Why:* two callers (generator and normalizer) need it, and the validation rules
(unique slug, unique sequence, folder exists) are worth testing without a content
tree. Zod is already a project dependency and the project's stated validation tool.

## Risks / Trade-offs

- **The manifest's values stop being reviewable as a diff.** → Every value it
  produces lands in the committed `seed-content.ts`, where a reviewer sees each
  title and slug change; the tracked example manifest keeps the current reviewed
  values in git. This is a real reduction in review surface (a manifest edit is now
  invisible until someone regenerates), accepted as an explicit product decision.
- **Two machines with the same content but different manifests generate different
  seeds.** → The example manifest is the canonical starting point, and any
  divergence shows up as an unexpected `seed-content.ts` diff at review time.
- **Deleting three tracked modules loses their JSDoc rationale**, which documents
  *why* each override exists (e.g. the `’` U+2019 rule, the vowel-module typo). →
  The manifest schema's JSDoc and the example file's sibling `README` section carry
  that reasoning forward; the apostrophe rule keeps its enforcing test.
- **Multi-course generation is untestable against real content** (only one course
  exists). → The synthetic-fixture integration test in
  `generate-course-content-seed.test.ts` gets a two-course fixture, which is where
  the multi-course path is actually exercised.
- **`normalize-content-disk.ts` now depends on the manifest.** → It degrades to
  automatic slugification when the manifest is absent, which is its current
  behavior whenever `SLUG_OVERRIDES` is empty — and it is empty today.

## Migration Plan

1. Add the loader + schema (tests first). Nothing consumes it yet.
2. Write `scripts/courses.manifest.example.json` carrying the current
   `SLUG_OVERRIDES` (empty), `TITLE_FROM_NOTES_MODULES` and
   `LESSON_TITLE_OVERRIDES` values, with the `courseSlug/` prefix stripped from the
   lesson-title keys.
3. Parameterize `resolveSlug`; update `normalize-content-disk.ts`.
4. Teach the generator to load the manifest and loop over `courses`.
5. Regenerate `seed-content.ts` and confirm the ONLY diff is the export rename —
   proving the migrated overrides are equivalent.
6. Update the four consumers.
7. Delete `slug-overrides.ts`, `title-overrides.ts`, `title-from-notes-modules.ts`
   and their tests.
8. Document the manifest in `scripts/README.md` and add the `.gitignore` comment.

Rollback: the change is build-time only and the app boots from the committed
`seed-content.ts`, so reverting the commit is sufficient — no data migration, no
deploy step.

## Testing strategy

All of this is build-time tooling under `scripts/`, outside React and outside the
hexagon, so **Vitest unit + integration** carries essentially all of it. No new
component tests; the e2e suite changes only where it imports a renamed export.

| Behavior | Layer | File / pattern mirrored |
| --- | --- | --- |
| Manifest schema: valid parse, missing `sequence`, bad JSON, duplicate slug, duplicate sequence, defaults applied | Vitest unit | new `scripts/courses-manifest/courses-manifest.test.ts`, mirroring `scripts/title-overrides.test.ts` |
| Tracked example manifest still validates | Vitest unit | same file — reads `scripts/courses.manifest.example.json` from disk |
| `resolveSlug(raw, overrides)`: override hit, miss, empty map | Vitest unit | existing `scripts/resolve-slug.test.ts` |
| Generator with no manifest reproduces single-course defaults | Vitest integration, synthetic `tmpdir` fixture | existing `scripts/generate-course-content-seed.test.ts` |
| Generator emits two declared courses, aggregating modules/lessons/resources | Vitest integration, **new two-course** synthetic fixture | same file |
| Undeclared folder skipped with a named stderr warning, exit zero | Vitest integration | same file |
| Missing `folder`, malformed manifest → throws, no partial write | Vitest integration | same file, mirroring the existing ffprobe/unresolved-key failure tests |
| Per-course `titleFromNotesModules` and `lessonTitleOverrides` applied, and scoped to their own course | Vitest integration | same file; assertions lifted from `title-overrides.test.ts` before it is deleted |
| Override values use `’` (U+2019), never `'` | Vitest unit | rule moves from `title-overrides.test.ts` into the manifest schema test |
| Normalizer never renames `courses.manifest.json` / `rename-manifest.json` | Vitest unit | existing `scripts/normalize-content-disk.test.ts` |
| Real-content regeneration still succeeds | Vitest smoke, `describe.skipIf` | existing `scripts/regenerate-content-seed.test.ts` |
| Emitted seed still drives the app | Playwright e2e | existing specs, updated only for `seedContentCourses` |

The regenerate-then-diff check in step 5 of the migration plan is the strongest
signal available and is run by hand, not in CI, because CI has no content root.

## Context

The catalog is assembled at module-import time in
`src/adapters/persistence/content-manifest/content-manifest.ts`:

```ts
export const contentCatalog: FlattenedCatalog = flattenCourseManifests(
  parseCourseManifests(courseManifests),
);
```

`courseManifests` is the static-import list in `src/content/courses.ts`;
`parseCourseManifests` validates each file and the ladder's uniqueness;
`flattenCourseManifests` turns the nested manifests into the flat arrays the adapters
consume (`courses`, `modules`, `lessonRows`, `resourceRows`, `notesKeys`).
`use-case-dependencies.ts` reads that one object and hands the arrays to the repositories.

"Hidden" here means the app's existing not-found state, not an HTTP 404. A route whose
course does not resolve renders `We couldn't find this course` with a `Not found` title
and a 200 status — the behaviour `cinema-course-overview` and `lesson-page` already
specify for an unresolvable slug. This change reaches that state through the unchanged
`course-not-found` path; it does not add a status code.

Constraints that shape the design:

- **The domain may not read the environment.** `src/domain/**` may import only `zod` and
  `neverthrow`, and ESLint forbids ambient reads. Any environment decision belongs on the
  adapter side of the hexagon.
- **The flag is temporary.** The Advanced course is expected to be published, at which
  point the flag should vanish. Everything below optimizes for deletability over
  generality.
- **Six e2e specs drive the Advanced course** (`cinema-theme`, `lesson-page`,
  `lesson-playback-resume`, `course-catalog`, `mobile-viewport`, `course-overview`). They
  run against a dev server, so they must keep seeing it with no per-spec configuration.
- **The catalog is resolved once, at import.** There is no per-request hook to filter in,
  and adding one would cost something on every render for a flag that will be deleted.

## Goals / Non-Goals

**Goals:**

- One filter point, so no surface can forget to apply it — the home ladder,
  continue-watching, and the course/module/lesson routes all follow from the same edit.
- Which course is hidden is data in a manifest; no module names a slug.
- Zero configuration for development, tests, Storybook and e2e; hidden by default in a
  production build.
- Deletion is a recipe, not an investigation.

**Non-Goals:**

- Per-user or per-request visibility, preview links, entitlements.
- Draft granularity below a course.
- Any UI acknowledging that a hidden course exists.
- Touching the domain: no `Course.draft`, no `CourseRepository` method, no use-case
  argument.

## Decisions

### Filter the parsed manifests, before the flatten

`content-manifest.ts` becomes:

```ts
export const contentCatalog: FlattenedCatalog = flattenCourseManifests(
  visibleCourseManifests(parseCourseManifests(courseManifests)),
);
```

Filtering here rather than downstream is what makes every surface consistent by
construction. A hidden course contributes no `Course`, so `CourseRepository.bySlug`
returns `null` and the existing `course-not-found` paths render the not-found states that
are already specified and already tested. It also contributes no modules, no lesson rows,
no resource rows and no notes keys, so there is nothing left addressable by id either.

*Alternatives considered.*

- **Filter inside `InMemoryCourseRepository`** (a decorating repository, or filtering the
  `courses` array in `use-case-dependencies.ts`). Equivalent for URLs and the ladder,
  because every use case resolves the course first — but it leaves the hidden course's
  lesson rows in the `LocalFilesystemLessonRepository`, reachable by `lessons.byId`, and
  it needs the `draft` flag carried through `flattenCourseManifests` into either the
  domain `Course` or a side channel. More moving parts, weaker hiding.
- **Filter in each page / use case.** Rejected outright: three or more edit sites, each
  able to be forgotten, and the domain would learn a delivery concern.
- **Drop the manifest from `src/content/courses.ts` in production.** Cannot be
  conditional: it is a static import list, and a conditional import defeats the build-time
  resolution the catalog depends on.

### `draft` on the manifest, validated by Zod, defaulting to `false`

`CourseManifest` gains one line:

```ts
draft: z.boolean().default(false),
```

`z.object` strips unknown keys, so without this line a `"draft": true` in the JSON would
be silently discarded and the flag would appear to do nothing — the worst possible failure
mode for a flag. Declaring it also means a typo like `"draft": "yes"` fails the parse with
the existing per-course error message, rather than being coerced.

`.default(false)` keeps `basic-course.json` untouched, and makes `CourseManifest["draft"]`
a plain `boolean` for the filter to read.

*Alternative considered:* a `publishedAt` date or a `visibility: "public" | "draft"` enum.
Both are more expressive and both are more to delete. A boolean is exactly the question
being asked.

### The filter and the environment read live in one folder, `visible-course-manifests`

New: `src/adapters/persistence/content-manifest/visible-course-manifests/visible-course-manifests.ts`,
following the folder-per-entity rule the ESLint rule `local-structure/folder-per-entity`
enforces for this root. It exports:

- `shouldShowDraftCourses(env: NodeJS.ProcessEnv): boolean` — the pure decision, exported
  so it is testable without touching `process.env`;
- `visibleCourseManifests(courses: ReadonlyArray<CourseManifest>): ReadonlyArray<CourseManifest>`
  — reads `process.env` through the above and filters. One argument, one job.

Both live in one file because they are one concept and will be deleted together. The
folder is the unit of removal.

### `SHOW_DRAFT_COURSES`, defaulting to `NODE_ENV !== "production"`

| Value                        | Result                                  |
| ---------------------------- | --------------------------------------- |
| unset / empty                | show when `NODE_ENV !== "production"`   |
| `1`, `true` (any case)       | show                                    |
| `0`, `false` (any case)      | hide                                    |
| anything else                | throw, naming the variable and value    |

The default is the whole point: `pnpm dev`, `pnpm test:run`, Storybook and Playwright
against a dev server all show the course without a single line of configuration, and
`pnpm build && pnpm start` hides it. The explicit values exist for the two cases the
default cannot serve — reviewing the draft in a production build, and checking the
production catalog locally.

Throwing on an unrecognized value rather than falling back to `false` matches how this
codebase treats malformed configuration everywhere else (`InvalidCourseManifestError`, the
location manifest). `SHOW_DRAFT_COURSES=treu` quietly hiding a course is precisely the
kind of silent misconfiguration that costs an afternoon.

No `NEXT_PUBLIC_` prefix: the catalog is read only by Server Components, and the flag has
no business in the client bundle.

*Alternative considered:* `NODE_ENV` alone. Smaller, but it cannot show the course in a
production build, which is exactly what a pre-publication review needs.

### Reading `process.env` at module scope is acceptable here

`contentCatalog` is a module-scope constant, so the flag is read once when the module is
first imported and cannot change afterwards. That is correct for this flag — it is a build
and deployment property, not a request property — and it keeps the per-request cost at
zero. Tests that need both branches test `shouldShowDraftCourses` directly with an
injected `env` object, so no test needs `vi.resetModules()` or has to mutate the real
environment.

### `Course.sequence` gaps are not ladder gaps

Hiding the Advanced course leaves `sequence: 1` as the only served course. Nothing
renumbers: `cinema-home` derives `Level {number}` from `Course.sequence` and renders one
card per resolved course, and `InMemoryCourseRepository.listAvailable` sorts on `sequence`
without requiring it to be contiguous. The existing *A single-course catalog still renders
the ladder* scenario in `cinema-home` already covers what production will show.

## Removal recipe

Two independent steps, in either order.

**Step 1 — publish the course (no code, one line).** Delete `"draft": true` from
`src/content/advanced-intermediate-course.json`. The course is then served in every
environment; the machinery stays and does nothing.

**Step 2 — delete the machinery.**

1. `rm -r src/adapters/persistence/content-manifest/visible-course-manifests/`
2. In `content-manifest.ts`, unwrap the call back to
   `flattenCourseManifests(parseCourseManifests(courseManifests))` and drop the import.
3. In `course-manifest-schema.ts`, drop the `draft: z.boolean().default(false)` line and
   its JSDoc.
4. Drop `"draft": true` from any manifest still carrying it (step 1, if not already done).
5. Remove the `SHOW_DRAFT_COURSES` block from `.env.example`, and the variable from any
   deployment environment.
6. Archive the `draft-course-visibility` spec, and restore the
   `course-content-storage` requirement *The declared catalog is the whole catalog* to its
   pre-change wording (this change's delta is the diff to revert).
7. `pnpm verify`.

Nothing else imports the module, so nothing else can break.

## Testing strategy

| Behavior                                                                     | Layer                     | Where                                                                                                     |
| ---------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| `shouldShowDraftCourses` for each env shape (unset, `1`, `true`, `0`, `false`, mixed case, `production` vs `development`, bad value throws) | Vitest unit               | `src/adapters/persistence/content-manifest/visible-course-manifests/visible-course-manifests.test.ts` (new) |
| `visibleCourseManifests` drops drafts and keeps order / keeps everything when drafts show | Vitest unit               | same file, with hand-built `CourseManifest` fixtures                                                       |
| `CourseManifest` accepts `draft`, defaults it to `false`, rejects a non-boolean naming the course | Vitest unit               | `course-manifest-schema/course-manifest-schema.test.ts` (extend)                                            |
| The real tracked catalog still satisfies its invariants with the filter in the pipeline | Vitest unit               | `content-manifest.test.ts` (extend: assert every served course is non-draft, and rows belong to served courses only) |
| The home renders one card per resolved course, and a course absent from the catalog has no card | Vitest component + RTL    | `src/components/home-view/home-view.test.tsx` — already covers this; no new component behavior exists       |
| Advanced course still reachable end to end in development                    | Playwright e2e            | the six existing specs that drive `advanced-intermediate-course` — they must keep passing unchanged         |

New unit tests come first, red before green, per the Three Laws. Fixtures use
`@faker-js/faker` for titles, descriptions and slugs; `NODE_ENV` values and
`SHOW_DRAFT_COURSES` values are hardcoded, because those are the exact strings the
behavior is tied to.

No new Playwright spec: the flag's visible effect in production is the *absence* of a
course, and the suite runs against a dev server where drafts show. Asserting the hidden
case would mean booting a second server with `SHOW_DRAFT_COURSES=0` — real coverage, but
paid for on every CI run, for a flag scheduled for deletion. The unit tests pin the
decision table and the filter; the existing specs pin that development is unaffected.

## Risks / Trade-offs

- **A production deploy silently serves one course, and nobody notices the flag caused
  it.** → The manifest carries the reason (`"draft": true`) next to the course it hides,
  `.env.example` documents the override, and the removal recipe above is in the archived
  change. A developer who wonders why the ladder is short finds the answer in the file
  they would open first.
- **`scripts/verify-content.ts` checks declared assets against the catalog.** With drafts
  hidden it would stop checking the Advanced course's assets. → It runs in development,
  where drafts show by default, so its coverage is unchanged in practice. Worth knowing
  before anyone runs it in a production-like environment.
- **The flag is read once at import, so it cannot be flipped at runtime.** → Intended: it
  is a deployment property. Flipping it means a redeploy, which is what a build-time
  catalog already implies.
- **e2e run against a production build (`pnpm build && pnpm start`) would fail.** → Set
  `SHOW_DRAFT_COURSES=1` for that run; the override exists for exactly this. Noted in
  `.env.example`.
- **`draft` is a manifest concept the domain never learns, so a future feature that needs
  draft-awareness in the domain would have to plumb it through.** → Accepted: this flag is
  scheduled for deletion, and building the plumbing now would be building for a
  requirement that does not exist.

## Context

`getCoursePlatformDeps()` assembles the catalog from two sources. `seed.ts` holds a
hand-written A1 course whose URLs are literals under `public/`; `seed-content.ts` holds the
generated rows whose keys resolve through a `BlobStore`. `USE_COURSE_CONTENT_SEED=1` decides
whether the second joins the first, and `CompositeLessonRepository` /
`CompositeResourceRepository` fan each read out over both.

Every piece of that exists because there were two sources. Deleting the A1 course collapses
the whole arrangement: one source, no flag, no composite.

Four files import `seed/seed` — the dependency graph, its test, `course-navigator.stories.tsx`
and `e2e/home-course-ladder.spec.ts`. The twelve other files that mention
`english-a1-pronunciation` write the slug inline as fixture text and are unaffected.

Two facts constrain the work:

- **`seed.ts` holds the only YouTube-hosted lesson.** Its own docstring says so: the generated
  seed is written from disk and cannot carry a hand-authored lesson, so this is what makes the
  player's YouTube provider reachable in the running app and in Storybook. Deleting it is a
  deliberate, accepted loss (see Non-goals in the proposal).
- **`e2e/home-course-ladder.spec.ts` is already failing.** It asserts two course cards, the
  heading "2 levels, in order" and the text "2 courses". The basic course took the catalog to
  three and `pnpm verify` does not run Playwright, so nothing caught it. Removing the A1 course
  returns the count to two, but the titles and ordinals still move, so the spec is rewritten
  rather than left to pass by coincidence.

## Goals / Non-Goals

**Goals:**

- The home ladder opens on the real basic course, with the advanced course second.
- One catalog source, wired directly, with no configuration selecting between sources.
- No orphaned machinery left behind: the flag, the composites and the fixture seed go together.
- `pnpm test:e2e` green for the ladder spec, which is currently red.

**Non-Goals:**

- Preserving the YouTube lesson, or adding manifest support for externally-hosted lessons.
- Touching content under `public/local-filesystem-lesson/`.
- Rewriting stories and tests that only spell the A1 slug inline.

## Decisions

### 1. Remove the env flag rather than redefine it

With one seed, `USE_COURSE_CONTENT_SEED=0` would produce a catalog with no courses. A flag
whose off position is a broken state is not configuration, it is a trap. Deleting it also
deletes the branch in `assembleCatalog`, which is what made that function need a boolean
argument at all.

The flag's second job — keeping a developer without the 15 GB content root booted onto
*something* — was only ever met by serving placeholder courses. That is worse than the
alternative, not better: a missing content root should look like missing content, and the
declared courses with unresolvable media say exactly that.

**Alternative considered:** keeping the flag to gate an empty-catalog mode. Rejected — it
encodes "I have no content" as a switch a developer must remember, when the absence of the
content root already says it.

### 2. Delete the composites rather than leave them wrapping one delegate

`CompositeLessonRepository` and `CompositeResourceRepository` have no other caller. Kept, they
would fan one read out over one delegate — an indirection a reader has to trace before
discovering it does nothing. Their tests are good tests of a thing the codebase no longer does.

Git keeps them. If a second source arrives — a database, a second bucket — reintroducing a
composite is a small, well-understood change made against that source's real shape rather than
against a guess preserved from this one.

**Alternative considered:** keeping them for the persistence work that is coming. Rejected —
the standing `course-content-storage` requirement mandating composite binding would have to
stay true of code nothing constructs, which makes the spec describe an intention rather than
the system.

### 3. The ladder comes from the manifest, so promotion is two integers

`Course.sequence` is declared per course in `courses.manifest.json`. Promoting the basic course
is `2 → 1` and `3 → 2`, then a regeneration. No id, slug, title or content key moves, because
none of them derive from `sequence`. The regenerated seed's diff should be exactly two integers,
and a task checks that.

### 4. `course-navigator.stories.tsx` gets its own fixture

The story imports `seedCourse`/`seedModules` for a course-and-modules shape to render. It needs
a course with modules, not *that* course. It gets a local fixture literal, which is also what
the storybook conventions ask for — deterministic story data written where the story is.

## Risks / Trade-offs

- **The YouTube provider loses its live content** → accepted and recorded here; its unit tests
  and stories still cover it, and the loss is visible in this change's Non-goals rather than
  discovered later by someone wondering where the lesson went.
- **A developer without the content root now sees broken media instead of a demo course** →
  intended (Decision 1); `scripts/README.md` is updated to say the content root is required.
- **Deleting tests along with the composites reduces the suite** → the deleted tests cover
  deleted code; `pnpm verify` and the e2e run are what confirm nothing else depended on them.
- **The e2e ladder spec is being rewritten while already red** → it is rewritten against seed
  values rather than literals, so the next course added moves it with the seed instead of
  breaking it, and `pnpm test:e2e` is run for real before the change is called done.

## Migration Plan

1. Delete `seed.ts`, then follow the type errors: `use-case-dependencies.ts`, its test,
   `course-navigator.stories.tsx`, `e2e/home-course-ladder.spec.ts`.
2. Delete `src/adapters/persistence/composite/**` and bind the ports directly.
3. Remove the flag from `use-case-dependencies.ts`, `.env`, `.env.example`,
   `playwright.config.ts` and `scripts/README.md`.
4. Set `sequence` to 1 and 2 in `courses.manifest.json`, copy to the tracked example, and run
   `pnpm generate:content-seed`.
5. `pnpm verify`, then `pnpm test:e2e`, then a browser pass.

Rollback is `git revert`: every change is to tracked files, and no content moves.

## Testing strategy

| Behavior | Layer | Where / mirrored pattern |
|---|---|---|
| The catalog holds exactly the declared courses, in `sequence` order, with no env var read | Vitest unit | `src/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies.test.ts` — the A1 and flag describes are deleted, and the remaining assertions are re-derived from `seedContentCourses` |
| Lessons and resources resolve through the local-filesystem adapters bound directly | Vitest unit | same file — the existing "resolve through the adapter that owns them" test, with the composite expectation dropped |
| The example manifest declares the two courses at rungs 1 and 2 | Vitest unit | `scripts/courses-manifest/courses-manifest.test.ts` — the existing ladder-order test, updated |
| The home ladder shows two cards, in order, with the right ordinals and titles | Playwright e2e | `e2e/home-course-ladder.spec.ts`, rewritten against `seedContentCourses` so it tracks the seed |
| Lesson page, playback resume, catalog and theme specs still pass without the flag | Playwright e2e | the four existing specs; only their comments mention it, but the full `pnpm test:e2e` run is the check |
| Both courses render end to end | Manual browser pass via Playwright MCP | per `CLAUDE.md` |

No component behaviour changes, so no `*.test.tsx` is added. The e2e suite is run in full for
this change, because the defect it fixes is one only Playwright sees.

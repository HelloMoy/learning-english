## Context

`src/app/[locale]/page.tsx` reads `findCourseCatalog()`, takes `entries[0]`, and renders `CinemaHero` beside `FeaturedCourse`. Everything after the first entry is dropped on the floor. Underneath, `getCoursePlatformDeps()` branches on `USE_COURSE_CONTENT_SEED` and builds a dependency graph from *one* seed, so `entries` has never had more than one element and the drop has never been visible.

Two seeds exist and both are real:

| Seed | Course | Modules | Lessons | Backing |
| --- | --- | --- | --- | --- |
| `seed.ts` | Basic — Foundational Pronunciation | 2 | 3 | in-memory entities, literal URLs under `public/` |
| `seed-content.ts` | Advanced Intermediate Course | 10 | 107 | generated rows, content keys resolved through `BlobStore` |

The two are backed by *different adapters* — `InMemoryLessonRepository` holds entities, `LocalFilesystemLessonRepository` holds rows it resolves at read time. That asymmetry is the reason the factory picks one and not both, and it is the first thing this design has to answer.

The learner-facing gap is the second: the home has nowhere to resume from. Playback positions are already persisted per lesson (`learning-english:playback:{lessonId}`) and completion marks per lesson (`learning-english:completed:{lessonId}`), but nothing records *which* lesson was the last one, so the home cannot ask.

The design to build is the canvas published for this change: hero (no CTA) → `Continue watching` → `Available courses` (numbered track + one card per course).

## Goals / Non-Goals

**Goals:**

- The catalog can hold N courses and the home renders all of them, ordered, without a layout that privileges one.
- Course order is data (`Course.sequence`), not the position an adapter happened to return.
- The home resumes the last lesson the learner opened, reusing the playback position already stored rather than duplicating it.
- Both seeds coexist in one dependency graph without either adapter learning about the other.
- Default boot (no env var) behaves exactly as today: one course, no regression in existing tests.

**Non-Goals:**

- Per-course aggregate progress ("1 of 3 videos"). See `proposal.md` § Non-goals.
- Server-side or cross-device persistence of the continue-watching record.
- Any change to how lesson, module, or course-overview pages render.

## Decisions

### D1 — Both seeds in one graph, joined by composite repositories

`getCoursePlatformDeps()` stops choosing a seed and always assembles one graph. `InMemoryCourseRepository` and `InMemoryModuleRepository` already filter by `courseId`, so they simply take the concatenation of both seeds' arrays. The lesson and resource repositories cannot: one holds entities, the other rows.

Two new driven adapters resolve that — `CompositeLessonRepository` and `CompositeResourceRepository` — each holding an ordered list of delegates of its own port and implementing the port by fanning out:

- `byId` returns the first delegate's non-null answer.
- `listByCourse` concatenates every delegate's answer.

Because both seeds' ids are disjoint and every row is filtered by `courseId`, the fan-out is total and order-preserving: a delegate that owns none of a course's lessons contributes an empty array.

*Alternatives considered.* (a) **Convert the A1 seed to rows.** Its `source`/`poster` are literal public paths, not content keys; `resolveLessonRow` would prefix them with the blob store's base URL and break them. (b) **Teach `LocalFilesystemLessonRepository` to hold entities too.** That gives one adapter two storage models and a branch on every read — precisely the shape the `BlobStore` indirection exists to avoid. (c) **A single merged seed file.** `seed-content.ts` is generated output with a `DO NOT EDIT` banner; merging by hand would be overwritten on the next generator run.

The composites live under a new persistence root `src/adapters/persistence/composite/`. It is deliberately **not** added to `FOLDER_STRUCTURE_WATCHED_ROOTS` in `eslint.config.mjs` in this change — the folder-per-entity layout is followed by hand here, and widening a lint rule is a separate, reviewable decision.

### D2 — `USE_COURSE_CONTENT_SEED` becomes additive

The flag keeps its name and its role as the opt-in for content that needs 15 GB on disk, but it now decides whether the filesystem-backed course **joins** the catalog rather than whether it **replaces** the A1 seed. Unset → the A1 course alone, byte-identical to today. Set to `"1"` → both, ordered by `sequence`.

This is what makes the change demonstrable at all: with a replacing flag there is no configuration in which the catalog holds two courses.

*Alternative considered.* A second flag (`INCLUDE_A1_SEED`) preserving the old meaning. Rejected: two flags for two seeds does not scale to a third course, and the additive reading is the one a reader expects from a name that says "use".

### D3 — `Course.sequence` carries the ladder order

`Course` gains `sequence: z.number().int().positive()`, mirroring `Module.sequence`, which the codebase already sorts modules by. `InMemoryCourseRepository.listAvailable()` sorts on it, so ordering is a repository guarantee like `ModuleRepository.listByCourse`'s, and `findCourseCatalog` inherits it without sorting again.

The ladder's ordinal renders as a localized `Level {number}` from `sequence`. No `level` field is added: "Basic" and "Advanced" already appear in the course titles, and a second, free-text copy of the same fact would be one to keep in sync.

*Alternative considered.* Deriving order from array position in the seed. Rejected: it makes the home's meaning depend on the order two unrelated seed files are concatenated in.

### D4 — The continue-watching record stores a location, not a snapshot

The new record answers exactly one question — *where was the learner?* — and is the route triple plus nothing:

```ts
ContinueWatchingLocation = { courseSlug: Slug, moduleSlug: Slug, lessonId: LessonId }
```

The *seconds* are not stored again: the panel reads them from the existing `PlaybackPositionRepository`, keyed by the same `lessonId`. Titles, durations and posters are not stored either; they are resolved from the domain.

`localStorage` key: `learning-english:continue-watching` — a single slot, overwritten on every lesson visit. "Last" is implicit in there being one slot, which is why the record needs no timestamp and the domain needs no `Clock` port.

*Alternatives considered.* (a) **Store the display data too** (title, course title, duration, href). Simpler at read time, but it puts denormalized copy in storage that goes stale the moment a lesson is retitled, and it teaches a storage adapter about presentation. (b) **Scan every `learning-english:playback:*` key.** No timestamps are stored, so there is no "most recent" to find. (c) **Derive from completion** ("first unfinished lesson" via `findNextLesson`). That answers a different question — where to go next, not where you were — and would point at lesson 1 for a learner who is halfway through lesson 1.

### D5 — Resolution goes through the domain, over a Server Action

The client holds a location; the panel needs a course, a module and a lesson. A new use case `findContinueWatching({courseSlug, moduleSlug, lessonId}) => ResultAsync<{course, module, lesson}, …>` does the resolution, and a `next-safe-action` action in `src/app/[locale]/actions.ts` exposes it to the client component.

`findLessonForView` is deliberately not reused: it also loads resources, the next lesson, and *every* module and lesson of the course — 107 lessons for the Advanced course — to fill a panel that shows three strings. The new use case reuses the same three port calls and stops there.

A stale record (a lesson deleted between visits) resolves to an `Err`; the panel then renders nothing, exactly as it does when there is no record at all. It is never an error surface — a learner who never watched anything has done nothing wrong.

*Alternative considered.* Serializing an index of every lesson into the home's props so the client resolves locally. Rejected: ~110 lessons of JSON shipped on every home render to answer one lookup.

### D6 — Which components are client, and why

| Component | Kind | Reason |
| --- | --- | --- |
| `page.tsx` | server | reads the catalog, owns the copy |
| `CourseLadder` / `CourseLevelCard` | client | the "in progress" mark and the `Continue course` CTA depend on the `localStorage` record |
| `ContinueWatching` | client | reads `localStorage`, calls the server action |
| `RememberContinueWatching` | client | writes the record on lesson-page mount |

The ladder is server-rendered on first paint like any client component in the App Router; the `localStorage`-derived bits resolve after hydration. `useIsHydrated` — already used by `ThemeToggle` for the same problem — gates them so the server render and the hydration render agree, and the pre-hydration state is the honest one: no mark, `Start course`.

`RememberContinueWatching` records on **lesson-page mount**, not on first `play`. A reading lesson has no playback to hook, and a learner who opened a lesson and read half of it was, in the plain sense of the phrase, there last.

### D7 — What the ladder card shows

Straight from the catalog entry, with no new query: ordinal (`Level {n}`), state badge, title, description, the first three modules by sequence with their ordinals and a `+N more` when there are more, the existing counts badges, and one CTA. `findCourseCatalog`'s `CourseCatalogEntry` grows a `leadingModules: Module[]` field alongside `firstLesson`, mirroring how `ModuleSummary.leadingLessons` already feeds `ModuleShowcaseCard`.

Three is the count `ModuleShowcaseCard`'s deck already leads with, so the two pages agree on how much of a container they preview.

## Testing strategy

| Layer | Tool | What it covers | Pattern mirrored |
| --- | --- | --- | --- |
| Unit | Vitest | `Course` schema accepts/rejects `sequence`; `ContinueWatchingLocation` schema; `findCourseCatalog` ordering + `leadingModules` cap; `findContinueWatching` ok/err paths | `src/domain/entities/course/course.test.ts`, `src/domain/use-cases/find-course-catalog/find-course-catalog.test.ts` |
| Unit | Vitest | `CompositeLessonRepository` / `CompositeResourceRepository` fan-out and first-hit `byId`; `BrowserLocalStorageContinueWatchingRepository` read/write/absent/malformed-JSON, with an injected `Storage` | `src/adapters/persistence/browser-local-storage/browser-local-storage-playback-position-repository/*.test.ts` (injected `localStorage` seam) |
| Unit | Vitest | `getCoursePlatformDeps()` returns one course by default and two under `USE_COURSE_CONTENT_SEED=1` | `use-case-dependencies.test.ts` if present, else a new colocated test |
| Component | Vitest + RTL | `CourseLevelCard` renders ordinal/title/counts/leading modules/`+N more` and the right CTA per state; `CourseLadder` renders one card per course in sequence order and marks the in-progress one; `ContinueWatching` renders nothing without a record, renders the panel with one, and shows the progress bar only for a video lesson with a saved position | `src/components/module-overview/module-overview.test.tsx`, `src/components/course-overview/*.test.tsx` |
| Component | Vitest + RTL | `RememberContinueWatching` writes the location once on mount through an injected repository | `mark-as-complete-button.test.tsx` (injected action seam) |
| E2E | Playwright | `/en` lists both courses in ladder order with the `Available courses` heading; no `Continue watching` section on a fresh profile; after opening a lesson and returning home the section appears and `Resume` navigates back to that lesson | `e2e/*.spec.ts` existing home/lesson specs |

Vitest covers every component in isolation; Playwright is reserved for the two things it alone can see — the two-course catalog booting under the real env var, and the `localStorage` round trip across a real navigation. Faker supplies arbitrary ids and titles except where a test asserts on exact seed data.

## Risks / Trade-offs

- **A generated seed and a hand-written seed now share one graph.** → Ids are UUIDs from disjoint namespaces and every lookup is filtered by `courseId`; the composite adapters assert first-hit semantics in unit tests. Re-running `pnpm generate:content-seed` cannot collide with `seed.ts`.
- **`USE_COURSE_CONTENT_SEED` changes meaning for anyone with it in `.env`.** → The change is additive: a developer who had it set gains a course, never loses one. `.env.example` already carries `=1`, and the spec delta records the new meaning.
- **The Advanced course's 107 lessons load on every home render** through `findCourseCatalog`'s `listByCourse`. → It is an in-memory array scan behind React's `cache()`, already the shape of today's call; the catalog entry keeps only `firstLesson` and three modules, so nothing large crosses to the client.
- **Two client components read `localStorage` on the home**, so the pre-hydration paint shows no continue-watching panel and an unmarked ladder. → `useIsHydrated` makes that state deliberate rather than a flash of wrong content, and the ladder is fully readable without it: the panel is an accelerator, never the only path to a course.
- **A stale record silently disappears** instead of telling the learner why. → Deliberate: the fallback is a home that works. The lesson is still reachable through its course, and re-opening it re-records the location.
- **`localStorage` may be unavailable** (private mode, blocked storage). → Both new adapters follow the existing pair's contract: undefined storage and failed writes degrade to "no record", never to an exception.

## Migration Plan

No data migration: the record is new, and its absence is a supported state, so existing devices simply have no continue-watching section until they open a lesson.

Rollback is a revert. The only externally visible contract that moves is `USE_COURSE_CONTENT_SEED`'s meaning, and reverting restores the replacing behaviour without touching stored data. `Course.sequence` is additive and both seeds ship with it, so a revert leaves no unparseable rows behind — nothing persists `Course` outside the seeds.

## Open Questions

- Should the ladder's numbered track collapse or scroll once the catalog passes ~6 courses? Out of scope at two; the track is a flex row and the decision can wait for the course that forces it.
- Should `Continue watching` prefer the last *video* lesson over the last lesson of any kind? Recording every visit is the simpler rule and the one implemented; if learners report the panel pointing at reading drills they skimmed, the filter is a one-line change in `RememberContinueWatching`.

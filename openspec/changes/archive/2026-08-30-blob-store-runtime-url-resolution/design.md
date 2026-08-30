## Context

Today the pipeline is: generator walks disk → resolves each content key to a
URL through a `LocalFilesystemBlobStore` → writes fully-formed URLs into
`seed-content.ts` → `seed-content.ts` calls `Lesson.parse` / `Resource.parse` at
**module load** → `buildDeps` hands those already-parsed entities to
`InMemoryLessonRepository` / `InMemoryResourceRepository`, which are pure
pass-throughs.

Three facts about the current state shape this design:

1. **`buildDeps` already builds a `BlobStore` at runtime.** It constructs a
   `LocalFilesystemBlobStore` with `baseUrl: "/local-filesystem-lesson"` and
   passes it to `LocalFilesystemLessonNotesRepository` only. The composition
   root does not need to be invented — it needs to be extended.

2. **`LocalFilesystemLessonRepository` and `LocalFilesystemResourceRepository`
   are dead code.** Both exist, both have tests, neither is instantiated
   anywhere outside its own test file. Their doc comments openly say they are
   pass-throughs and that "URL resolution happened at seed-gen time". They are
   the natural home for the logic this change adds, so the change fills empty
   shells rather than complicating live ones.

3. **The notes adapter already couples to the base URL.**
   `LocalFilesystemLessonNotesRepository#findMarkdownResource` computes
   `blobStore.url(key)` and string-matches it against `Resource.url`. This works
   only because the generator and `buildDeps` hardcode the same prefix. It is a
   silent failure — a mismatch returns `null`, and the UI renders "no notes"
   with no error anywhere.

Constraint that drives most of the design: `VideoLesson.source`,
`VideoLesson.poster` and `Resource.url` are validated by `urlOrRelativePath()`,
which rejects a bare key like `course/module/lesson/video.mp4` (no leading `/`,
no scheme). So a key **cannot** live inside a parsed domain entity. Resolution
must happen strictly before `parse`.

## Goals / Non-Goals

**Goals:**

- Content URLs are computed at read time from a key + a configured `BlobStore`.
- Repointing storage is an environment-variable change; `seed-content.ts` is not
  regenerated and not touched.
- Default behaviour (both seeds) is byte-identical to today.
- The notes adapter stops depending on base-URL string equality.
- Spec and code agree again.

**Non-Goals:**

- No `S3BlobStore`, no signing, no async `url()`. See proposal Non-goals.
- No per-lesson provider / YouTube support.
- No change to the domain entities, the ports, or any UI component.
- No change to slug, title, duration or classification logic in the generator.

## Decisions

### D1: Keys live in raw rows; entities are built by the adapter

`seed-content.ts` stops exporting `seedContentLessons: ReadonlyArray<Lesson>`
and exports `seedContentLessonRows` — the plain object literals it already
builds internally as `_seedContentLessonRaw` — plus `seedContentResourceRows`.
The `Lesson.parse` / `Resource.parse` calls move out of the seed module and into
the adapters, after resolution.

*Alternative considered — keep parsing in the seed and add a separate
`seedContentKeys: Record<id, key>` side table.* Rejected: it splits one row
across two exports keyed by id, so every read does a second lookup that can
miss, and nothing structurally prevents the two from drifting. The row already
owns the field; making the field hold a key is the smaller change.

*Alternative considered — relax `urlOrRelativePath()` to also accept bare keys.*
Rejected outright: that would let a key reach the UI and be rendered into a
`src` attribute, producing a broken relative request. The schema is doing
exactly its job by rejecting keys; the boundary is correct and should stay
strict.

`seedContentCourse` and `seedContentModules` keep exporting parsed entities —
neither carries a content key, so there is nothing to resolve and no reason to
churn them.

### D2: A shared pure resolver, not per-adapter concatenation

Three adapters (lesson, resource, notes) need "turn a row's key fields into URL
fields". Rather than repeat it, add a small module:

```
src/adapters/persistence/local-filesystem/resolve-content-row/resolve-content-row.ts
  resolveLessonRow(row, blobStore): Lesson      // resolves source + poster, then Lesson.parse
  resolveResourceRow(row, blobStore): Resource  // resolves url, then Resource.parse
```

Pure, synchronous, no I/O — `BlobStore.url` is itself pure string work. This is
the single place where a key becomes a URL, which is what the spec's "no path
concatenation in the adapter itself" clause asks for. It also gives the
resolution rules one obvious unit-test target rather than three overlapping
ones.

Folder-per-entity naming matches the rest of the codebase (`resolve-content-row/`
containing `resolve-content-row.ts` + its test).

### D3: `poster` is resolved only when present

`poster` is optional on `VideoLesson`. The resolver must not turn an absent
poster into `blobStore.url(undefined)` — that would produce a string like
`/local-filesystem-lesson/undefined` which *passes* `urlOrRelativePath()` and
then 404s at runtime. This is the one place where a naive `map` silently
produces a valid-but-wrong entity, so it gets its own scenario and its own test.

Same reasoning for `ReadingLesson`: it has no key-bearing field at all, so the
resolver returns it to `Lesson.parse` untouched. Discrimination is on
`row.kind`, mirroring the domain's own discriminated union rather than sniffing
for the presence of a `source` property.

### D4: Config-selected driver, defaults that change nothing

`buildDeps` reads two env vars:

| Var | Default | Meaning |
| --- | --- | --- |
| `CONTENT_BASE_URL` | `/local-filesystem-lesson` | public URL prefix |
| `CONTENT_LOCAL_ROOT` | `path.resolve("public/local-filesystem-lesson")` | local driver's filesystem root |

Read inside `buildDeps` (per call), not at module load — mirroring the existing
`isCourseContentSeedEnabled()` decision, which is read per call precisely so a
developer can flip it in dev without restarting Node. Consistency with the
neighbouring code matters more here than the negligible cost of reading
`process.env` twice per request.

No `CONTENT_BLOB_DRIVER` switch is introduced yet. There is exactly one driver;
a selector with one case is speculative branching. When `S3BlobStore` lands it
adds the selector, and that change is where the selector's behaviour gets
specified and tested. (The proposal mentioned `CONTENT_BLOB_DRIVER` as a
possibility; this design deliberately drops it.)

One `BlobStore` instance is created per `buildDeps` call and shared by the
lesson, resource and notes adapters, so the three cannot disagree about where
content lives.

### D5: The content seed gets the local-filesystem adapters; A1 keeps in-memory

`buildDeps` currently takes arrays and always builds `InMemory*` repositories.
It grows a branch: when the content seed is active it builds
`LocalFilesystemLessonRepository` / `LocalFilesystemResourceRepository` from raw
rows + the `BlobStore`; otherwise it builds the `InMemory*` ones from the A1
seed's already-parsed entities.

*Alternative considered — make the `InMemory*` adapters key-aware too.*
Rejected: the A1 seed has no keys and no `BlobStore`, so every A1 read would
carry a branch that is always false. Two adapters with honest, separate jobs
beat one adapter with a mode flag.

This finally gives the two dead `LocalFilesystem*` classes a caller, and makes
their names accurate — they now genuinely resolve against a store instead of
being historically-named pass-throughs. Their doc comments, which currently say
the opposite, are rewritten.

### D6: Notes matching moves to keys

`LocalFilesystemLessonNotesRepository` takes `resourceRows` (raw, key-bearing)
instead of `resources` (parsed). Lookup becomes `row.lessonId === lessonId &&
row.url === key` — a direct comparison of the same key the notes map already
holds. It then calls `resolveResourceRow(row, blobStore)` to produce the
`Resource` it returns, so the notes adapter and the resource adapter resolve
through identical code rather than through two string constructions that happen
to agree.

This deletes `#findMarkdownResource`'s fallback loop entirely: the composite-key
`Map` lookup on `${lessonId}:${key}` cannot miss when the resource repository
was built from the same rows.

### D7: The generator stops knowing about URLs

The two `LocalFilesystemBlobStore` constructions in
`generate-course-content-seed.ts` collapse to one, kept **only** for the
`exists(key)` validation pass. Emission uses the key directly. The `baseUrl` it
is constructed with becomes irrelevant to the output — but rather than pass a
misleading dummy value, it keeps `/local-filesystem-lesson`, with a comment
stating the value is unused for emission and exists only because the constructor
requires it.

Regenerating the seed is required as part of this change, since every `source`,
`poster` and `url` value in the committed file loses its prefix. That diff is
large (~2,700 lines) but entirely mechanical.

### D8: `next/image` needs the same variable (found during e2e validation)

Not anticipated when this design was written; surfaced by the browser check in
task 7.3 and folded back in here.

Course posters render through `next/image`, which rejects any remote host not
declared in `next.config.ts`. Booting with
`CONTENT_BASE_URL=https://cdn.example.com/course-content` resolved every URL
correctly *and* made the home page return a hard 500: `Invalid src prop …
hostname "cdn.example.com" is not configured under images`.

That falsified this change's own headline claim — "repointing storage is a
configuration change" — because it would additionally have required a code edit
to `next.config.ts` on the day the bucket landed. So `next.config.ts` now
derives `images.remotePatterns` from the same `CONTENT_BASE_URL`. Unset or
site-relative (the default) yields no remote pattern at all, so the local path
is byte-identical to before.

The pattern is scoped to the configured path prefix (`<pathname>/**`) rather
than the bare host, so this does not quietly become "any image from that
domain".

One honest asymmetry: `buildBlobStore()` reads the variable per call, but
`next.config.ts` is evaluated once at load. Changing `CONTENT_BASE_URL` to a
new *host* in a running dev server repoints the URLs but not the image
allowlist — that combination needs a restart. Documented in the config file
itself rather than left to be rediscovered.

*Alternative considered — leave it to the future S3 change.* Rejected: the
spec scenario asserting a CDN prefix works "by configuration alone" would have
been false the moment it was written, and a spec that documents a 500 as
success is worse than no spec.

## Testing strategy

**Vitest unit — the new resolver** (`resolve-content-row.test.ts`, new file).
The core of the change and the cheapest place to pin it. Mirrors the fixture
style of `local-filesystem-lesson-repository.test.ts` (faker-generated ids,
`Lesson.parse` for expectations). A hand-written fake `BlobStore` —
`{ url: (k) => \`https://test.example/\${k}\`, exists: async () => true, readText: async () => "" }`
— rather than a mock, so assertions read as "the prefix arrived" not "the spy was
called". Cases: video row resolves `source`; video row resolves `poster`; video
row **without** `poster` leaves it absent and does not call `url` (D3); reading
row passes through untouched; a row resolving to an invalid URL throws.

**Vitest unit — the adapters** (extend
`local-filesystem-lesson-repository.test.ts` and
`local-filesystem-resource-repository.test.ts`). Both files exist and currently
construct their subject from parsed entities; they are rewritten to construct
from rows + a fake `BlobStore`. Existing ordering/filtering assertions
(`listByCourse` sorts by `sequence`, `listByLesson` filters) are preserved
unchanged — they are the regression net proving this change touched only URL
handling.

**Vitest unit — the notes adapter**
(`local-filesystem-lesson-notes-repository.test.ts`, exists). Add the case that
motivates D6: build the adapter with a `BlobStore` whose `baseUrl` differs from
the default and assert notes are still found. Under today's implementation that
case returns `null`, so it is a genuine regression test, and it must be written
failing first.

**Vitest unit — the composition root**
(`use-case-dependencies.test.ts`, exists). Assert the default path yields
`/local-filesystem-lesson/...` URLs, and that setting `CONTENT_BASE_URL` changes
them without touching the seed. Env vars are set/restored per test with
`vi.stubEnv` following the existing `USE_COURSE_CONTENT_SEED` tests in that file.

**Vitest unit — the generator**
(`generate-course-content-seed.validation.test.ts`, exists). Its assertions on
emitted `source`/`url` values change from URL-shaped to key-shaped. Add the
spec's "generated seed contains no base-URL prefix" scenario as an assertion
over the built seed.

**No new component (RTL) tests.** No component changes; `LessonView` and the
players receive the same URL strings they always did. The existing component
suites act as the guard — if resolution regresses, they fail on their existing
assertions.

**Playwright e2e — one scenario, manual-run.** The existing e2e suite boots with
the A1 seed. Rather than reshape the harness, this change is verified end to end
by booting `USE_COURSE_CONTENT_SEED=1` and confirming a lesson page renders its
video, poster and resource links with `/local-filesystem-lesson/` URLs and that
playback starts. This is the check that the 2,700-line regenerated seed is
actually correct, which no unit test covers.

**Verification gate:** `pnpm verify` (typecheck + format:check + lint +
test:run) must pass before archiving.

## Risks / Trade-offs

**[The regenerated seed silently loses or mangles entries]** → The generator's
`exists(key)` validation still runs over every emitted key and fails non-zero on
any miss, so a mangled key cannot reach the committed file. Additionally: assert
the entry counts (107 lessons, 10 modules) are unchanged after regeneration, and
confirm the diff touches only `source`/`poster`/`url` lines — any change to an
`id`, `slug` or `sequence` line means the generator changed something it
shouldn't have.

**[`ffprobe` is unavailable, blocking regeneration]** → Then this change cannot
be completed as specified, because the seed must be regenerated. Detect early:
check `ffprobe` on `PATH` before starting implementation, not after writing the
code. If absent, the fallback is a scripted in-place rewrite of the existing
`seed-content.ts` (strip the known prefix from the three fields), which
preserves durations without re-probing.

**[Per-request resolution cost]** → `url()` is string concatenation over ~107
lessons; the entities are rebuilt per read rather than shared. Negligible
against the existing per-request `buildDeps` call, which already reconstructs
every repository from scratch. Not optimised, and deliberately so — memoising
would reintroduce staleness for the signed-URL case this change exists to
enable.

**[Env vars diverge between server and any future client-side read]** →
`CONTENT_BASE_URL` is server-only (no `NEXT_PUBLIC_` prefix) and resolution
happens in Server Components, so resolved URLs reach the client as plain props.
Adding the `NEXT_PUBLIC_` prefix later would be the wrong fix; a client that
needs a fresh URL should ask the server. Documented here so the next reader does
not "helpfully" rename it.

**[`.env.example` drift]** → The two new vars are added to `.env.example` with
their defaults spelled out, since a developer who never sets them must still be
able to see they exist.

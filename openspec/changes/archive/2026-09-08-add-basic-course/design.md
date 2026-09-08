## Context

`public/local-filesystem-lesson/` holds two course folders. Only
`advanced-intermediate-course` is declared in `courses.manifest.json`, so
`resolveCoursesToWalk` reports `basic-course` on stderr as an undeclared staging
folder and skips it. Declaring it is a one-line manifest edit — but the generator
would then abort, because the folder is not in the shape the walk assumes.

The walk (`appendCourse` → `appendModule` → `appendLesson`) is fixed at
course/module/lesson, and `classifyLessonFolder` reads only the **files** directly
inside a lesson folder. `basic-course` breaks that in four ways:

| # | What is on disk | What the walk does with it |
|---|---|---|
| 1 | `2 American vowel & consonant sounds/{1 Vowels, 2 Consonants}/<lesson>/` | `1 Vowels` is treated as a lesson folder; it holds no `.mp4` and no `readme.md`, so `classifyLessonFolder` **throws** and generation aborts |
| 2 | `1 Introduction/{Introduction.mp4, description.md, thumbnail.jpeg}` | Treated as a module with zero lesson folders — an empty module, and the video is silently lost |
| 3 | Notes are `description.md`, not `readme.md` | No inline notes, no notes Resource; the file becomes an untitled `other` resource |
| 4 | PDFs live in `<lesson>/resources/` | `readdirSync(...).filter(d => d.isFile())` never sees them; every PDF is lost |

Two further problems are cosmetic but user-visible. IPA-only folder names collapse
under `slugify` — `10 ʒ` → `10`, `12 θ` → `12`, `8 ʃ` → `8` — producing meaningless
URLs and titles. And `humanize(moduleSlug)` title-cases every word and strips accents,
which turns `Ejercicios para dominar el ritmo en Inglés` into `Ejercicios Para Dominar
El Ritmo En Ingles`.

The content root is untracked and ~15 GB; the advanced course is already normalized
and shipping, and its keys, slugs and titles must not move.

## Goals / Non-Goals

**Goals:**

- The basic course renders end to end — home ladder, course overview, module overview,
  lesson view, notes tab, resources, video playback — with no component or domain change.
- One on-disk contract for every course. `basic-course` is migrated to the shape the
  advanced course already has, rather than the generator learning a second shape.
- Readable URLs and titles for the IPA lessons, declared in the manifest where the
  reviewer can see them.
- The advanced course's content keys, slugs, module titles and lesson titles are
  byte-identical after regeneration.

**Non-Goals:**

- Widening the generator, `classifyLessonFolder`, or the manifest schema to describe
  alternative tree shapes.
- Splitting the basic course's bilingual notes into ES/EN columns (see Decision 6).
- Submodules in the domain.
- Any change to `content-locations.json` — the basic course stays on the `local` store.

## Decisions

### 1. Reshape the disk; do not widen the generator

The generator's fixed shape is what makes a content key derivable from a path and
verifiable with `blobStore.exists(key)`. Teaching it a second shape — a `notesFile`
field, a `resourcesFolder` field, a variable depth — would fork every downstream
guarantee: the key check, the normalizer, the rename manifest, `verify-content`, and
`materialize-content-assets` would each need to know which shape a course is in.

The reshape is mechanical, reversible in principle (every step is a `rename`), and runs
once. **Alternative considered:** manifest-declared shape knobs. Rejected — it moves a
one-time migration cost into permanent complexity on the hot path every future course
crosses.

### 2. Flatten the extra level into sibling modules

`Module` has `courseId`, `slug`, `title`, `sequence` and no `parentId`. Representing
`Vowels`/`Consonants` as children of `American vowel & consonant sounds` would mean a
domain entity change, a seed shape change, and an outline-rendering change across
`cinema-course-overview` and `cinema-lesson-view` — for one course.

Promoting them costs a renumbering of the two modules that follow:

```
1 Introduction                             →  1 Introduction
2 American vowel & consonant sounds/       →  (dissolved)
  ├── 1 Vowels                             →  2 Vowels
  └── 2 Consonants                         →  3 Consonants
3 Ejercicios para dominar el ritmo…        →  4 Ejercicios para dominar el ritmo…
4 Fluidez y Velocidad                      →  5 Fluidez y Velocidad
```

Module sequence comes from `parseSequence(moduleSlug)`, which reads the numeric prefix,
so the renumbering *is* the ordering — no separate declaration is needed.

### 3. The reshape is a plan-driven, dry-runnable script

`scripts/reshape-course-tree.ts`, modelled on `normalize-content-disk.ts`: dry run by
default, `--apply` to mutate, idempotent, aborting before any move in a directory where
a collision is detected. The plan is a literal in the script naming `basic-course` and
its moves — not a manifest field, because it describes a one-time migration, not a
standing property of the course. A course with no plan entry is never touched.

It runs **before** `normalize-content-disk.ts`: the plan refers to folders by their raw
on-disk names, which normalization would have already rewritten.

**The notes transform** (`description.md` → `readme.md`) is the one non-mechanical step.
The files carry, in order: a title line, the module's name, then Spanish and English
bodies. Three of the 48 open with a blank line, and two carry no title line at all. The
rule:

1. Strip leading blank lines.
2. If the first line is longer than 120 characters, there is no title line — the file
   opens with body text. Emit no heading.
3. Otherwise the first line is the title. If the line after it is the module's display
   name, drop that too.
4. Emit `# <title>` followed by the remaining body.

The 120-character guard is what keeps
`3-consonants/1-ejercicio-para-activar-las-cuerdas-vocales…`, whose file opens with a
250-character Spanish paragraph, from acquiring a paragraph-length `#` heading. No
legitimate title in the course exceeds 72 characters.

The two lessons left without a heading get a `lessonTitleOverrides` entry, which is
exactly what that table exists for.

### 4. IPA slugs are declared, not inferred

`slugify` drops every character outside `[a-z0-9]`, and the IPA symbol is the entire
informative part of names like `10 ʒ`. Rather than teach `slugify` an IPA
transliteration table — which would silently change slugs in the advanced course too —
the ~20 affected folders get `slugOverrides` entries spelling the sound in ASCII:
`10 ʒ` → `10-zh`, `12 θ` → `12-th-voiceless`, `13 ð` → `13-th-voiced`, `8 ʃ` → `8-sh`,
`9 tʃ` → `9-ch`, `11 dʒ` → `11-j`, `21 ŋ` → `21-ng`, and the vowel and diphthong
equivalents. `slugOverrides` is consumed by both the normalizer and the generator
through `resolveSlug`, so the disk path and the emitted key stay equal by construction.

Video **file** basenames have no override mechanism (`normalizeFileName` takes no map),
so `ʒ.mp4` normalizes to `untitled.mp4`. That is accepted: the basename appears only
inside a content key, never in a URL a reader reads or a title the UI renders, and each
key is already unique because it carries the lesson slug.

### 5. Titles: notes headings for the sound modules, overrides for the rest

`titleFromNotesModules` gets `2-vowels`, `3-consonants`,
`4-ejercicios-para-dominar-el-ritmo-en-ingles` and `5-fluidez-y-velocidad`. For the
sound modules it recovers the IPA the slug cannot hold (`The Vowel Sound: /ə/`); for the
Spanish modules it recovers the accents `humanize` strips, because
`lessonTitle` compares heading to derived title case-insensitively and
`afina tu oído…` ≠ `afina tu oido…`.

`1-introduction` is deliberately **not** allowlisted: its notes open with a marketing
sentence (`La Forma Más Rápida de Mejorar tu Speaking and Listening! Que Necesitas?`),
and `Introduction` is the better outline row.

`moduleTitleOverrides` is new. Module titles have no override path at all today, and
`humanize` is wrong for both Spanish modules. It mirrors `lessonTitleOverrides`
exactly — same `ReviewedTitle` validation, same per-course scoping, same precedence
over the derived value. **Alternative considered:** deriving module titles from a
`readme.md` in the module folder. Rejected — no module has one, and it would invent a
new content convention to avoid two lines of manifest.

### 6. Notes stay single-column for now

`splitBilingualNotes` splits on `##` language headings. The basic course's bodies mark
the language boundary three different ways — a blank line, a `-----` rule, and (in
`4-flap`) not at all, the Spanish paragraph simply repeating. A mechanical split would
guess wrong on at least three files and mislabel a Spanish paragraph as English. Unmarked
notes already render as one column, which is an honest rendering of what the files say.
Adding `## 🇪🇸 Español` / `## 🇺🇸 English` is per-lesson editorial work for a later change.

### 7. The basic course takes ladder rung 2; the advanced course moves to 3

`seed.ts` holds a hand-written A1 demo course, `english-a1-pronunciation`, titled
"Basic — Foundational Pronunciation", at `sequence: 1`. `USE_COURSE_CONTENT_SEED=1` is
additive, so that course stays in the catalog next to the generated ones, and the
`course-content-storage` spec states it is never removed by configuration.

Giving the real basic course `sequence: 1` would tie it with the demo. `Course` ordering
is `a.sequence - b.sequence`, a stable sort, so a tie resolves by insertion order —
implicit, and precisely the fragility the manifest's own duplicate-sequence check exists
to prevent. So: A1 demo `1`, basic course `2`, advanced course `3`.

Advanced moving from 2 to 3 changes one integer in its `Course` row. Its slug, id, module
slugs, lesson slugs, titles and every content key are untouched — no route moves.
**Alternative considered:** dropping the A1 demo from the catalog when the content seed
is on. Rejected here — it contradicts a standing requirement and is referenced by a dozen
stories and tests; retiring the demo deserves its own change.

## Risks / Trade-offs

- **The reshape moves ~15 GB of untracked, unbacked-up content** → every operation is a
  `rename` within one filesystem (atomic, no copy), the script is dry-run by default and
  its plan is printed and reviewed before `--apply`, and it aborts before touching a
  directory where a target already exists.
- **The notes transform rewrites 48 content files in place** → the transform is applied
  under the same `--apply` gate, and the tasks check the rendered output of a sampled
  lesson in the browser before the change is considered done. The originals are
  recoverable only from the source archive, so the transform is run once and its output
  reviewed, not iterated on disk.
- **A wrong `slugOverrides` entry silently changes a URL** → the generator's
  `blobStore.exists(key)` pass fails loudly if a slug and the disk disagree, which is the
  failure mode that matters; a merely *ugly* slug is caught by review of the regenerated
  seed diff.
- **The advanced course's seed rows could shift** → its manifest entry is untouched, the
  reshape plan names only `basic-course`, and a task diffs its rows to confirm only the
  `sequence` integer changed.
- **`untitled.mp4` basenames** for five IPA lessons → accepted (Decision 4); not
  user-visible.
- **Two courses named "Basic"** on the home ladder while the A1 demo remains → accepted
  (Decision 7); flagged for a follow-up change.

## Migration Plan

Run in this order, from the repo root, on a machine that has the content root:

1. `pnpm tsx scripts/reshape-course-tree.ts` — dry run; read the plan.
2. `pnpm tsx scripts/reshape-course-tree.ts --apply` — reshape `basic-course`.
3. Write the `basic-course` entry into `public/local-filesystem-lesson/courses.manifest.json`
   and bump the advanced course to `sequence: 3`.
4. `pnpm normalize:content` then `pnpm normalize:content:apply` — kebab-case the tree
   using the new `slugOverrides`.
5. `pnpm generate:content-seed` — regenerate `seed-content.ts`.
6. Copy the live manifest to `scripts/courses.manifest.example.json`.
7. `pnpm verify`, then `USE_COURSE_CONTENT_SEED=1 pnpm dev` and walk both courses in the
   browser.

Rollback: the change is confined to the untracked content root plus four tracked files
(`seed-content.ts`, `courses.manifest.example.json`, `courses-manifest.ts`,
`generate-course-content-seed.ts`) — `git checkout` restores the tracked side. The disk
reshape is not automatically reversible; step 1's printed plan is the record of what moved.

## Testing strategy

| Behavior | Layer | Where / mirrored pattern |
|---|---|---|
| `moduleTitleOverrides` parses, rejects straight apostrophes and untrimmed values, resolves to `{}` when absent | Vitest unit | `scripts/courses-manifest/courses-manifest.test.ts` — extend the existing `lessonTitleOverrides` describe block |
| The generator applies a module title override, and leaves un-overridden modules on `humanize(slug)` | Vitest unit | `scripts/generate-course-content-seed.test.ts` — the suite already drives `buildSeed` against a synthetic fixture tree |
| Reshape: dry run mutates nothing; `--apply` promotes a nested group to a sibling module, wraps loose module-level files in a lesson folder, hoists `resources/*`, renames `description.md` → `readme.md`; re-running is a no-op; a colliding move aborts before mutating | Vitest unit | new `scripts/reshape-course-tree.test.ts`, mirroring `scripts/normalize-content-disk.test.ts` (`mkdtempSync` fixture root, `mkfile` helper, arrange/act/assert) |
| The notes transform promotes the first line to a `#` heading, drops the module-name line, strips leading blanks, and emits no heading past the 120-character guard | Vitest unit | same new file — the transform is exported as a pure function and tested on strings, no I/O |
| The tracked example manifest still satisfies the schema with the new entry | Vitest unit | already covered by the existing example-manifest test in `scripts/courses-manifest/courses-manifest.test.ts` |
| Both courses render — ladder, course overview, module outline, lesson video, notes tab, resource links | Manual browser pass via Playwright MCP | per `CLAUDE.md`; no new Playwright spec, because nothing in `e2e/` asserts catalog contents and the seed is env-gated |

No component or React change is in scope, so no new `*.test.tsx` is required. `pnpm verify`
(typecheck, format, lint, Vitest) gates the change as usual.

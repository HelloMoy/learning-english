## Why

`public/local-filesystem-lesson/basic-course` holds a complete 48-lesson beginner course
that the app cannot see. It is undeclared in `courses.manifest.json`, so the generator
skips it, and its on-disk shape does not match the layout the generator walks — it nests
an extra level under one module, keeps a lesson's files loose at module level, names its
notes `description.md`, and hides its PDFs in a `resources/` subfolder. The home ladder
therefore shows one rung where it should show two, and the first rung of the ladder — the
entry point for a beginner — is missing.

## What Changes

- **Reshape `basic-course` on disk** to the canonical `course/module/lesson` layout the
  advanced course already uses, in one scripted, dry-runnable pass:
  - `2 American vowel & consonant sounds/{1 Vowels, 2 Consonants}` are promoted to
    sibling modules; the two modules that followed are renumbered so the ladder reads
    `1 Introduction · 2 Vowels · 3 Consonants · 4 Ejercicios… · 5 Fluidez…`.
  - `1 Introduction`'s loose files are wrapped in a lesson folder, so a module holds
    lessons and only lessons.
  - each lesson's `resources/*` files are hoisted into the lesson folder.
  - each `description.md` becomes a `readme.md` whose first line is promoted to a `#`
    heading, and whose redundant module-name line is dropped.
  - the placeholder `index.html` left in the dissolved module folder is removed.
- **Declare the course in `courses.manifest.json`** at `sequence: 1`, with the slug
  overrides that give the IPA lesson folders readable URLs (`10 ʒ` slugifies to the bare
  `10`), the two modules opted into notes-derived lesson titles, and hand-written titles
  for the four lessons whose notes carry none.
- **Add `moduleTitleOverrides` to the manifest schema** — a module title is derived by
  `humanize(slug)`, which strips accents and title-cases every word, turning
  `Ejercicios para dominar el ritmo en Inglés` into `Ejercicios Para Dominar El Ritmo En
  Ingles`. Lesson titles already have an override table; modules need the same escape
  hatch now that a Spanish-titled course exists.
- **Regenerate `seed-content.ts`** so both courses ship, and update the tracked
  `scripts/courses.manifest.example.json` to match the live manifest.
- The advanced course's content keys, slugs, module titles and lesson titles are
  unchanged — its manifest entry is untouched and its subtree is not walked by the
  reshape.

## Capabilities

### New Capabilities

None. The course is added through the manifest mechanism that
`course-content-storage` already defines.

### Modified Capabilities

- `course-content-storage`: adds the requirement that a course tree has one canonical
  on-disk shape and that a course arriving in another shape is migrated to it rather
  than taught to the generator; adds `moduleTitleOverrides` to the manifest schema
  alongside the existing `lessonTitleOverrides`.

## Non-goals

- **Teaching the generator new tree shapes.** The generator keeps assuming exactly
  `course/module/lesson`, notes in `readme.md`, resources flat in the lesson folder. The
  content is migrated to the contract; the contract is not widened.
- **Splitting the basic course's notes into ES/EN columns.** Its `readme.md` bodies carry
  Spanish and English text with no `##` language markers, and the three separator styles
  in use (blank line, repeated paragraph, `-----` rule) do not split mechanically without
  guessing. `splitBilingualNotes` already renders unmarked notes as a single column, which
  is correct for what the files currently say. Adding the markers is per-lesson editorial
  work for a later change.
- **Submodules in the domain.** `Module` gains no `parentId`; the extra on-disk level is
  flattened into sibling modules instead.
- **Touching the advanced course**, its manifest entry, its disk layout or its seed rows.
- **Moving content to S3/GCS.** Placement stays with the `local` store in
  `content-locations.json`.

## Impact

- **Content (untracked)**: `public/local-filesystem-lesson/basic-course/**` is renamed,
  restructured and its `description.md` files rewritten as `readme.md`. ~15 GB of media
  is moved by `rename`, never copied. `rename-manifest.json` at the content root is
  rewritten by the normalizer.
- **Manifests**: `public/local-filesystem-lesson/courses.manifest.json` (untracked) and
  `scripts/courses.manifest.example.json` (tracked) gain a `basic-course` entry.
- **Scripts**: `scripts/courses-manifest/courses-manifest.ts` gains
  `moduleTitleOverrides`; `scripts/generate-course-content-seed.ts` consults it; a new
  one-shot `scripts/reshape-course-tree.ts` performs the migration.
- **Seed**: `src/adapters/persistence/in-memory/seed/seed-content.ts` is regenerated —
  two courses, fifteen modules, 155 lessons. The advanced course's rows are byte-identical.
- **App**: no component, route or domain change. The home ladder, course overview, module
  overview and lesson view render the new course through the paths they already use.

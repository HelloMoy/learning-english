## Why

The Basic Course is the entry point of the platform — the first thing a learner opens. Its
48 lesson `readme.md` bodies are still the raw blurbs that shipped with the imported course:
a `#` title followed by one Spanish paragraph and one English paragraph, with no structure,
no articulation cues, no examples, and no statement of what the learner will be able to do
afterwards. One lesson (`1-introduction`) has no body at all. Measured against the
`course-content-storage` requirement "Lesson notes bodies carry explicit language sections",
**48 of 48 Basic Course lessons are non-conformant** — none of them carries a `## Español` /
`## English` marker, so every one of them collapses into a single undifferentiated column.

The second half of the problem is that the Notes tab cannot render Markdown formatting even
when the content has it. `LessonNotesTabs` styles its Markdown panel with
`prose prose-sm prose-slate dark:prose-invert`, but `@tailwindcss/typography` is not a
dependency of this project and `globals.css` carries no `@plugin` directive for it. Those
four class names generate **no CSS at all**. Headings, lists, blockquotes, emphasis and
paragraph spacing all render at the browser's bare defaults inside a `text-foreground`
container — which is why a lesson title renders at body size and paragraphs run together.
Enriching the content without fixing this would ship structure the reader cannot see.

## What Changes

- **Every Basic Course lesson `readme.md` body is rewritten** into the house bilingual shape
  already used by `advanced-intermediate-course`: `## 🇪🇸 Español` and `## 🇺🇸 English`
  language sections, each opening with a `###` descriptive sub-heading and carrying real
  Markdown — paragraphs, bold mini-labels, bullet lists, and a blockquote of example words.
- **Each body follows one editorial scaffold** so all 48 lessons read as one course:
  orientation → how the sound is produced → example words → the mistake a Spanish speaker
  makes → what the learner will be able to do. The two language columns are mirrors of each
  other, not translations of differing depth.
- **`1-introduction`, which has a title and nothing else, gains a real body.**
- **The `#` title heading of every file is left byte-for-byte intact** — it is
  title-derivation input for the sync command, so touching it would rewrite
  `src/content/basic-course.json`.
- **The Notes tab renders Markdown with real typographic hierarchy.** The dead `prose`
  classes are replaced by project-owned element styling that belongs to the Immersion Cinema
  theme: headings, paragraphs, lists, blockquotes, emphasis, code and horizontal rules each
  get explicit Tailwind classes inside the `Markdown` component, so the styling travels with
  the renderer instead of depending on an uninstalled plugin.
- **`Markdown` moves to the folder-per-entity layout** —
  `src/components/lesson-notes/markdown/markdown.tsx` — since the file is being reworked and
  its current flat placement disagrees with the components-layer convention.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cinema-lesson-view`: gains a requirement that the Notes tab renders Markdown with a
  visible, theme-owned typographic hierarchy rather than delegating to typography classes
  that the build does not generate.
- `course-content-storage`: the existing "Lesson notes bodies carry explicit language
  sections" requirement is extended to state that it binds **every declared course**, and
  gains an editorial floor for what a lesson notes body must contain (a descriptive
  sub-heading and orienting prose — never a bare title).

## Non-goals

- **No change to any lesson's `#` title heading**, and therefore no regeneration of
  `src/content/basic-course.json`. Titles, slugs, module names, video sources, durations,
  posters and resources are all untouched.
- **No change to `advanced-intermediate-course` content.** It is already in the target shape
  and is gitignored; this change only makes the Basic Course match it.
- **No change to `splitBilingualNotes`.** The splitter already handles the target shape
  correctly; the Basic Course content is what has to move.
- **No `@tailwindcss/typography` dependency.** Adding a package is out of scope; the fix is
  project-owned styling (see design.md).
- **No layout, column-label, or Transcript-tab changes** in `LessonNotesTabs` beyond dropping
  the dead `prose` classes.
- **No third language.** The split stays ES/EN.
- **No new lesson `description` copy in the manifest.** The placeholder
  "Video lesson. The full description lives in the linked notes" is a manifest concern, not a
  notes concern, and is left alone.
- **No pedagogical claims beyond the source material.** Bodies elaborate on what each lesson
  already teaches; no new phonetics is invented.

## Impact

- `public/local-filesystem-lesson/basic-course/**/readme.md` — 48 lesson notes bodies
  rewritten (tracked in git, unlike the advanced course's).
- `src/components/lesson-notes/markdown.tsx` → `src/components/lesson-notes/markdown/markdown.tsx`
  — moved and given element styling; its test moves with it and grows cases for the styled
  elements.
- `src/components/lesson-view/lesson-notes-tabs/lesson-notes-tabs.tsx` — drops the dead
  `prose` class string; import path updated.
- `src/components/lesson-view/lesson-notes-tabs/lesson-notes-tabs.stories.tsx` — its fixture
  moves to the enriched shape so Storybook shows what the page shows.
- `openspec/specs/cinema-lesson-view/spec.md`, `openspec/specs/course-content-storage/spec.md`
  — via delta specs.
- No domain, adapter, route, i18n, manifest or dependency changes. `pnpm sync:manifest` output
  is unchanged.

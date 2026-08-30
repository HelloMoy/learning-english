## Why

In the "Advanced Vowel Pronunciation In American English" module, eight different lessons
all display the same title: **"Fast"**. A learner opening the outline sees a list they
cannot navigate, because nothing distinguishes one row from the next.

The titles are derived from folder names (`scripts/discriminate-lesson.ts:66`,
`humanize(lessonSlug)`), and by the time the generator sees a slug, the information is
already gone. On disk the folders really are named `4-fast`, `5-fast`, `6-fast`,
`7-fast`, `10-fast`, `11-fast`, `12-fast`, `13-fast` — the IPA symbol that made each
lesson distinct never survived into the folder name. `rename-manifest.json`, which exists
precisely to preserve pre-normalization names, is empty (`entries: []`), so it offers no
recovery either.

The real names are not lost. Each lesson's `readme.md` opens with them as its heading:

| Folder | Shown today | `readme.md` heading |
| --- | --- | --- |
| `2-fast-i` | Fast I | **Fast /i/** |
| `4-fast` | Fast | **Fast /æ/** |
| `10-fast` | Fast | **Fast /ɔɪ/** |
| `13-fast` | Fast | **Fast /ʊ/** |

`classifyLessonFolder` already finds that `readme.md` — it uses it to decide whether the
lesson is video or reading, and emits it as a Resource. It simply never reads the heading
inside.

## What Changes

- The seed generator reads a lesson's title from the first `#` heading of its
  `readme.md`, falling back to the folder-derived title when there is no heading.
- **This is gated to one module.** An explicit allowlist enables the behaviour for
  `2-advanced-vowel-pronunciation-in-american-english` only. The other nine modules keep
  `humanize(slug)` and their titles do not move.
- A heading that matches the folder-derived title except for capitalization is **not**
  adopted. `INTRO` does not replace `Intro`: a case difference is not information the
  slug lost, and the derived form reads better in the sidebar.
- One content fix on disk: the heading in `5-fast/readme.md` reads `ast /ɛ/`, missing its
  leading `F`. It becomes `Fast /ɛ/`, so the source is right and any future regeneration
  inherits the correction.
- The generated seed is regenerated, changing 12 of the module's 13 lesson titles.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `course-content-storage`: the generator's requirements describe how lessons are
  classified and how slugs are resolved, but never state where a lesson **title** comes
  from — today it is an unstated consequence of `humanize(slug)`. This adds an explicit
  requirement for title derivation, including the allowlist gate and the
  case-only exclusion.

## Impact

**Code**

- `scripts/discriminate-lesson.ts` — `classifyLessonFolder` gains heading extraction;
  `humanize` stays as the fallback and is otherwise untouched.
- `scripts/discriminate-lesson.test.ts` — new cases for heading adoption, the fallback,
  the case-only rule, and the allowlist gate.
- `src/adapters/persistence/in-memory/seed/seed-content.ts` — regenerated output. Twelve
  titles change; ids, slugs, sequences, sources and posters do not.

**Content**

- `public/local-filesystem-lesson/advanced-intermediate-course/2-advanced-vowel-pronunciation-in-american-english/5-fast/readme.md`
  — one character added to a heading.

**Verified before proposing**

- All 13 lessons in the module have a `readme.md` with an `#` heading.
- The other nine modules are untouched by the gate, so the 52 lessons elsewhere that
  *also* have divergent headings keep today's titles.

**Not affected**

- Lesson ids. They are derived from `courseSlug/moduleSlug/lessonSlug` via uuidv5, and no
  slug changes — so playback positions and any stored per-lesson state survive.
- Folder names on disk, `slug-overrides.ts`, the normalization step, and
  `rename-manifest.json`.
- Any domain, component, or route code. This is generator + generated data.

## Non-goals

- **The other nine modules.** 64 of 107 lessons across the course have a heading that
  differs from their derived title. This change deliberately fixes 12 of them; widening
  the allowlist later is a one-line change plus a seed regeneration.
- **Normalizing the messy headings elsewhere.** Modules 9 and 10 carry inconsistent
  spacing (`Day#1` next to `Day# 3` and `Day #4`; `Exercise 1 : …` next to
  `Exercise 10: …`). Adopting those verbatim would import the inconsistency, so they stay
  out until that normalization is decided.
- **Renaming folders on disk** so their names carry the IPA, or populating
  `rename-manifest.json` retroactively.
- **Fixing headings other than the `5-fast` typo**, which is in scope only because it sits
  in the module being enabled.
- Changing how slugs, sequences, ids, or resources are derived.

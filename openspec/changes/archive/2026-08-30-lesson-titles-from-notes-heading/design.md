## Context

`classifyLessonFolder(folderPath, lessonSlug)` builds every lesson's title the same way,
in both its branches:

```ts
const title = humanize(lessonSlug);   // discriminate-lesson.ts:66 (video), and again for reading
```

`humanize` strips the numeric prefix and title-cases the kebab segments. It cannot
recover what the slug never carried.

The function already locates the notes file — `const readmeFile = files.find((f) => f.toLowerCase() === "readme.md")`
— and uses it to classify the lesson and emit a Resource. The heading inside it is simply
never read.

The call site has everything needed to gate the behaviour:
`generate-course-content-seed.ts:229` calls the classifier from inside a loop where
`moduleSlug` is already in scope (it is used one line earlier to build the lesson id).

## Goals / Non-Goals

**Goals:**

- The vowel module's lessons show the names their notes give them, IPA intact.
- Exactly one module changes. The other nine produce byte-identical titles.
- The gate is trivially widenable later — one list entry, then regenerate.
- Lesson ids stay stable, so nothing keyed to them breaks.

**Non-Goals:**

- Rewriting `humanize`, the slug pipeline, or folder normalization.
- Any heuristic beyond "first heading wins" — no inferring titles from PDFs, video
  filenames, or thumbnail OCR.

## Decisions

### D1 — The classifier is told whether to use the heading; it does not decide

**Decision:** add a third parameter — an options object — rather than passing the module
slug:

```ts
classifyLessonFolder(folderPath, lessonSlug, { titleFromNotesHeading: boolean })
```

The generator consults the allowlist (it knows `moduleSlug`) and passes a boolean. The
classifier's job is to describe what is in a folder; which modules have been reviewed for
this treatment is editorial policy, and handing it a module slug plus a list to match
against would fold that policy into the wrong unit.

This also keeps the new behaviour testable without constructing module context: a test
passes `true` or `false` directly.

**On argument count:** this is a third argument, which the project's clean-code rules ask
to justify. The justification is that it is an options bag with one named field, read at
the single call site, and the alternative — a module-slug parameter — is what pushes
policy into the classifier.

### D2 — A case-only difference is not information

**Decision:** adopt the heading only when it differs from `humanize(lessonSlug)` by more
than capitalization:

```
heading.trim().toLowerCase() === humanize(lessonSlug).toLowerCase()  → keep humanize
```

The purpose of this change is to recover what the slug pipeline destroyed: IPA symbols,
apostrophes, punctuation. Case survives slugification perfectly well, so a heading
shouting `INTRO` where the derived title says `Intro` is a styling difference in the
source document, not lost data. Adopting it would put a single all-caps row next to
`Fast /i/` in the sidebar for no informational gain.

Worked through against the real module:

| Heading | `humanize(slug)` | Adopted? |
| --- | --- | --- |
| `INTRO` | `Intro` | No — case only |
| `Fast /i/` | `Fast I` | Yes — `/i/` is real |
| `Fast Cot-Caught Merger` | `Fast Cot Caught Merger` | Yes — the hyphen is real |
| `Fast /æ/` | `Fast` | Yes |

### D3 — Heading extraction is a separate pure function

`notesHeading(markdown): string | null` takes the file contents and returns the first
ATX `#` heading, or `null`. Separated from `classifyLessonFolder` because it is the only
part with parsing rules worth testing directly: leading blank lines, a `#` that is not a
heading (inside a fenced code block), `##` before `#`, and no heading at all.

Rules kept deliberately narrow: **first `# ` line wins.** No fenced-block tracking unless
a real file needs it — all 13 files in scope open with their heading on line 1, and
inventing a Markdown parser here would be scope the content does not justify.

### D4 — The allowlist is a module-level list in its own file

`scripts/title-from-notes-modules.ts`, next to the existing `slug-overrides.ts`, whose
docstring already establishes the convention that content-shaping exceptions live in a
reviewed list ("Each entry MUST be reviewed in code review alongside the content it
represents"). `scripts/` is flat, so no folder-per-entity concern arises.

Gating per **module** rather than per lesson keeps the list one line long and makes the
rollout unit match how the content was authored and reviewed.

### D5 — The `5-fast` typo is fixed at the source, not overridden

Its heading reads `ast /ɛ/`. The fix edits the `readme.md` so the content is correct for
every consumer — the notes Resource renders that heading too, so an override in the
generator would leave the learner reading `ast /ɛ/` in the notes panel while the sidebar
said `Fast /ɛ/`.

This means the change touches content under `public/`, which is otherwise treated as
read-only input. One character, in a file whose heading is demonstrably wrong.

### D6 — Both branches, not just video

`humanize` feeds the title in the video branch *and* the reading branch. The heading rule
applies to both. The vowel module happens to be all-video, so the reading path has no
coverage from this content — its test uses a fixture.

## Testing strategy

| Behavior | Layer | File |
| --- | --- | --- |
| `notesHeading` returns the first `# ` heading | Vitest unit | `discriminate-lesson.test.ts` |
| `notesHeading` returns `null` when there is no heading | Vitest unit | `discriminate-lesson.test.ts` |
| `notesHeading` ignores `##` and prose before the first `#` | Vitest unit | `discriminate-lesson.test.ts` |
| `notesHeading` tolerates leading blank lines and trailing spaces | Vitest unit | `discriminate-lesson.test.ts` |
| With the flag on, a video lesson's title is the heading | Vitest unit | `discriminate-lesson.test.ts` |
| With the flag on and no readme, the title falls back to `humanize` | Vitest unit | `discriminate-lesson.test.ts` |
| With the flag on and a heading differing only in case, `humanize` wins (D2) | Vitest unit | `discriminate-lesson.test.ts` |
| With the flag **off**, the title is `humanize` even when a heading exists | Vitest unit | `discriminate-lesson.test.ts` |
| The same rules apply to a reading lesson (D6) | Vitest unit | `discriminate-lesson.test.ts` |
| Existing classification (video/reading/resources/poster) is unchanged | Vitest unit (existing, must stay green) | `discriminate-lesson.test.ts` |
| The regenerated seed still validates and every key resolves on disk | Vitest unit (existing) | `generate-course-content-seed.validation.test.ts` |

**Fixtures:** `scripts/__fixtures__/` already exists and is how this suite builds folder
shapes; the new cases extend it rather than introducing a new fixture style.

**Not unit-tested, verified by inspection of the regenerated seed:** that exactly 12
titles change and that ids, slugs, sequences, sources and posters are byte-identical.
This is a property of the generated artifact, checked by reading `git diff` on
`seed-content.ts` — a test asserting it would be asserting the content, not the code.

**No component or e2e work.** No UI changes; the outline and episode list already render
whatever title the seed carries.

## Risks / Trade-offs

- **Regenerating the seed could move more than titles** → The diff is reviewed explicitly
  (task 5.1). If anything beyond the 12 titles moves — a duration, a poster path, an id —
  that is a signal the generator is not deterministic with respect to this change, and
  the task says to stop rather than commit it.
- **Ids are derived from slugs, which do not change** → Confirmed by reading
  `generate-course-content-seed.ts:225`: `uuidv5("lesson:" + courseSlug/moduleSlug/lessonSlug)`.
  Titles are not an input. Saved playback positions therefore survive.
- **The allowlist will be forgotten** → It is a visible, documented list; the proposal
  records that 52 more lessons elsewhere are still affected. The alternative (fixing all
  107 now) is what the user explicitly deferred.
- **Editing content under `public/`** (D5) → Narrow and deliberate: one missing letter.
  Noted here so it is not mistaken for the generator writing into its own input.
- **`notesHeading` is intentionally naive** (D3) → A `#` inside a fenced code block before
  the real heading would be picked up. No file in scope has that shape; if one appears,
  the fix is a fenced-block guard in one pure function with tests already around it.

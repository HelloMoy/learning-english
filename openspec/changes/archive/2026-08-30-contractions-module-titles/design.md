## Context

The previous change built the machinery: `classifyLessonFolder` takes
`{ titleFromNotesHeading }`, `lessonTitle` prefers the heading over the slug unless they
differ only by case, and `TITLE_FROM_NOTES_MODULES` gates which modules opt in. Enabling
a second module is one line.

What that machinery cannot do is produce a title for a lesson with no notes.
`6-i-d-you-d-we-d-all-the-would-contractions` holds an MP4 and a JPEG and nothing else, so
both `lessonTitle` sources — heading, then slug — resolve to the mangled
`I D You D We D All The Would Contractions`.

Two facts about the generator shape the wiring:

1. **`classified.title` is consumed four times**, not once:
   `generate-course-content-seed.ts` uses it for the lesson title and for
   `buildResource(...)`'s notes title, in both the video and reading branches. Anything
   that overrides the title must do so before all four, or the notes Resource keeps the
   old name while the lesson shows the new one.
2. **The classifier already refuses to know policy.** It receives a boolean, never a
   module slug, precisely so that "which modules were reviewed" stays at the call site.
   An override table is more policy of the same kind.

## Goals / Non-Goals

**Goals:**

- The module reads consistently: every lesson that can be fixed, is.
- A lesson with no recoverable name has one explicit, reviewed place to get it.
- Titles do not depend on which apostrophe character an author happened to type.
- The classifier stays free of editorial policy.

**Non-Goals:**

- Any normalization beyond apostrophes (see proposal § Non-goals).
- Making the override table general enough for hypothetical future needs. One entry, one
  shape, extended when a second case actually appears.

## Decisions

### D1 — Precedence: override → heading → slug

An override exists **because** the automatic sources are absent or wrong, so it wins over
both. The heading beats the slug, as established. The full order:

```
title = override(courseSlug/moduleSlug/lessonSlug)
     ?? heading(readme.md)          // only for allowlisted modules
     ?? humanize(lessonSlug)
```

An override applies regardless of whether its module is allowlisted. The allowlist governs
the *automatic* heading source, which needs the module-wide review; an override is already
a per-lesson reviewed decision and needs no second gate. In practice lesson 6 is in an
allowlisted module anyway, but tying the two would be a coupling with no justification.

### D2 — The override is applied in the generator, not the classifier

`classifyLessonFolder` keeps its current signature. The generator resolves the override
right after classification and threads one `title` value into all four consumers:

```ts
const classified = classifyLessonFolder(folderPath, lessonSlug, { titleFromNotesHeading });
const title = lessonTitleOverride(`${courseSlug}/${moduleSlug}/${lessonSlug}`) ?? classified.title;
```

This follows the previous change's D1 for the same reason — the classifier describes a
folder, it does not decide editorial questions — and it fixes fact (1) above by
construction: there is one `title` binding, so the notes Resource cannot drift from the
lesson.

**Alternative — pass the override into the classifier:** would put the table's shape and
its key format inside the unit that should only read files, and would still need the
four-consumer fix.

### D3 — Overrides are keyed by full slug path

`courseSlug/moduleSlug/lessonSlug`, not the lesson slug alone. `1-intro` exists in most
modules; a bare-slug key would silently rename all of them. The full path is also what
the generator already builds for ids and content keys, so the key is a value already in
scope rather than a new concept.

This differs from `slug-overrides.ts`, which keys by raw on-disk folder name because it
runs *before* slugs exist. Titles are resolved after, so the slug path is available and is
the more stable key — it survives a folder being renamed on disk as long as the slug is
preserved.

### D4 — Apostrophes normalize to `’` (U+2019), and only apostrophes

`normalizeApostrophes` maps `'` (U+0027) to `’` (U+2019) in an adopted heading. U+2019 is
the correct character for an English contraction, and it is what lesson 3 already uses.

Scope kept deliberately tight: **only U+0027 → U+2019**. Not backticks, not `‘`, not
quotation marks, no case folding, no `&`/`and`. Each additional rule is a separate
judgment call, and none of the others appear in this module.

**Applied to the heading only, not the override.** Override values are hand-written and
reviewed, so they can simply be typed correctly — and a test asserts every entry in the
table already uses U+2019, which makes the table self-checking rather than silently
repaired. The slug fallback needs nothing: slugification strips apostrophes entirely, so
a slug-derived title never contains one.

**Known limitation:** a heading legitimately using `'` as a single quotation mark would be
rewritten. No heading in the content does, and titles are not a place quotation marks
realistically appear.

### D5 — Lesson 6's title restores the folder name, not the thumbnail

`I’d, you’d, we’d — all the WOULD contractions`, reconstructed from
`6-i-d-you-d-we-d-all-the-would-contractions`.

The thumbnail shows `Would` over a longer list (`I’d, you’d, he’d, she’d, it’d, we’d,
they’d, who’d`). That is the on-screen teaching aid, not the lesson's name — and its
siblings' titles are shortened lists too, so the folder-derived form matches the module's
own convention. An override's job is to undo slugification; rewriting a lesson's name from
a video frame is a different act, and one the author did not ask for.

Recorded here because it is the one genuinely arguable value in the change, and changing
it later is a one-string edit in a reviewed table.

## Testing strategy

| Behavior | Layer | File |
| --- | --- | --- |
| `normalizeApostrophes` converts U+0027 to U+2019 | Vitest unit | `discriminate-lesson.test.ts` |
| `normalizeApostrophes` leaves U+2019 untouched (idempotent) | Vitest unit | `discriminate-lesson.test.ts` |
| `normalizeApostrophes` leaves text with no apostrophes unchanged | Vitest unit | `discriminate-lesson.test.ts` |
| An adopted heading has its apostrophes normalized | Vitest unit | `discriminate-lesson.test.ts` |
| A slug-derived fallback title is unaffected | Vitest unit | `discriminate-lesson.test.ts` |
| Every entry in the override table already uses U+2019 (D4) | Vitest unit | `title-overrides.test.ts` |
| Override keys are full `course/module/lesson` paths, not bare slugs (D3) | Vitest unit | `title-overrides.test.ts` |
| `lessonTitleOverride` returns the entry for a known key, `undefined` otherwise | Vitest unit | `title-overrides.test.ts` |
| Existing heading, case-rule and fallback behaviour still holds | Vitest unit (existing, must stay green) | `discriminate-lesson.test.ts` |
| The regenerated seed still validates and every key resolves on disk | Vitest unit (existing) | `generate-course-content-seed.validation.test.ts` |

**Not unit-tested, verified against the regenerated seed:** that the override reaches both
the lesson title *and* its notes Resource. Lesson 6 has no readme and therefore no notes
Resource, so the real content cannot exercise the coupling that fact (1) warns about — it
is checked by reading the diff for a lesson that has both, and by the single-binding
construction in D2.

**No component or e2e work.** Titles render through code that already exists.

## Risks / Trade-offs

- **The override table drifts from the content** → If someone later adds a `readme.md` to
  lesson 6, the override silently wins over it (D1) and the new heading is ignored. The
  table's docstring must say so, and the entry should name the reason it exists ("no
  readme") so a future reader knows when it can be deleted.
- **Normalizing `'` in headings is lossy** (D4) → Narrow by design and documented; the
  reverse direction is unavailable, so a heading that genuinely wanted a straight quote
  would need an override.
- **Enabling a module is still a manual review** → This change reviewed six lessons by
  hand. That does not scale to the remaining 48 divergent lessons, and it is not meant to:
  modules 9 and 10 need a spacing rule first, which is a different decision.
- **Lesson 6's title is a reconstruction, not a recovered fact** (D5) → It is the only
  value in the change not read from the content. Flagged in the proposal for review.

## Open Questions

None blocking. The two decisions that were genuinely open — what to do about the lesson
with no notes, and whether to normalize the apostrophes — were settled before this
document was written. D5's exact wording is the one item worth a second opinion, and it is
cheap to change.

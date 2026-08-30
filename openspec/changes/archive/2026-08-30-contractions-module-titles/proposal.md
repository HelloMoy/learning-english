## Why

The "Contractions Reductions" module reads like the vowel module did before it was fixed:

| Shown today | Should read |
| --- | --- |
| `I M You Re He S She S It S We Re They Re` | `I’m, you’re, he’s, she’s, it’s, we’re, they’re` |
| `I Ll You Ll He Ll She Ll It Ll We Ll They Ll` | `I’ll, you’ll, he’ll, she’ll, it’ll, we’ll, they’ll` |
| `I Ve You Ve We Ve They Ve He S She S It S` | `I’ve, You’ve, We’ve, They’ve, He’s, She’s, It’s` |
| `Why Contractions Reductions Are Important` | `Why Contractions & Reductions are important` |

A module about apostrophes displays no apostrophes. The mechanism to fix this already
exists — the vowel module uses it — so the bulk of this change is one allowlist entry.

Reviewing the module as the allowlist's docstring requires turned up two things that a
plain allowlist entry does not cover.

**One lesson has no notes at all.** `6-i-d-you-d-we-d-all-the-would-contractions` contains
only an MP4 and a thumbnail — no `readme.md`, so no heading to read. Enabling the module
without addressing it leaves four lessons fixed and one still reading
`I D You D We D All The Would Contractions`, which is a worse state than the uniform
brokenness it replaces: it looks like a bug rather than a limitation.

**The apostrophes are not the same character.** Lesson 3 uses `’` (U+2019), lessons 4 and 5
use `'` (U+0027). Adopting the headings verbatim imports that inconsistency into the
product, and it is the exact class of problem the allowlist exists to catch.

## What Changes

- `3-contractions-reductions` joins `TITLE_FROM_NOTES_MODULES`. Four of its six lessons
  take their titles from their notes headings.
- **A title-override table is introduced** — the sibling of the existing (and still empty)
  `slug-overrides.ts` — for lessons whose title cannot be recovered from a heading.
  Lesson 6 gets the only entry.
- **Apostrophes are normalized to `’` (U+2019)** when a heading is adopted, so the module
  reads consistently regardless of which character the author typed.
- `1-intro` keeps `Intro`: its heading matches the derived title apart from nothing at
  all, so the existing case rule leaves it alone.

## Capabilities

### Modified Capabilities

- `course-content-storage`: the "Lesson titles come from the notes heading for allowlisted
  modules" requirement currently describes exactly two sources — the heading, and the slug
  as fallback. It gains a third, higher-precedence source (the override table) and a
  normalization rule for the adopted text.

### New Capabilities

None.

## Impact

**Code**

- `scripts/title-overrides.ts` — new, with one entry.
- `scripts/title-from-notes-modules.ts` — one line added to the allowlist.
- `scripts/discriminate-lesson.ts` — apostrophe normalization; the override lookup is
  wired at the generator, not here (see design).
- `scripts/discriminate-lesson.test.ts` — coverage for normalization and precedence.
- `src/adapters/persistence/in-memory/seed/seed-content.ts` — regenerated. Five titles
  change (four from headings, one from the override), plus their notes Resources.

**A judgment call worth reviewing**

Lesson 6's title has two candidate sources and they disagree:

- Its **slug** preserves the folder the author named:
  `6-i-d-you-d-we-d-all-the-would-contractions` → `I’d, you’d, we’d — all the WOULD contractions`.
- Its **thumbnail** shows the heading `Would` above the list
  `I’d, you’d, he’d, she’d, it’d, we’d, they’d, who’d`.

This proposes the slug-derived reconstruction, because an override's job is to undo
slugification, not to rename the lesson from a video frame. The thumbnail's list is the
on-screen teaching aid, not the lesson's name — and its own siblings' names are shortened
lists too. Easy to change: it is one string in a reviewed table.

**Not affected**

- The other eight modules. They stay off the allowlist, so their titles do not move.
- Lesson ids, slugs, sequences, sources, posters. Ids derive from slugs, never titles.
- The vowel module, whose titles are already correct and whose headings contain no
  apostrophes to normalize.

## Non-goals

- **The remaining seven modules.** 48 lessons elsewhere still have divergent headings.
  Modules 9 and 10 need a spacing-normalization decision (`Day#1` vs `Day# 3` vs `Day #4`)
  before they can be enabled.
- **Normalizing anything but apostrophes** — no case folding, no `&`/`and` unification, no
  punctuation spacing. Each is its own judgment call and none of them blocks this module.
- **Creating the missing `readme.md`** for lesson 6. Content under
  `public/local-filesystem-lesson/` is gitignored, so a file created there would not
  survive to another machine — the same trap the `ast /ɛ/` fix fell into.
- Populating `slug-overrides.ts`, renaming folders, or touching the normalization step.

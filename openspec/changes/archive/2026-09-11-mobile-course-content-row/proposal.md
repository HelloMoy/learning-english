## Why

Three candidate presentations of "Course content" shipped behind `?outline=a|b|c` so the
choice between them could be made on a phone instead of from a mockup. It was: the compact
row — variant B — won. Variants A and C, and the switch that selected between them, have
done their job and are now dead weight sitting in the lesson page's shipping path.

The provisional change said this follow-up would keep one and delete the rest. This is it.

## What Changes

- The mobile course outline becomes the **compact row** permanently: a gold icon tile, the
  "Course outline" title, a `Module · Lesson N of M` subtitle, a chevron, and a thin
  course-completion meter along the card's bottom edge. The whole row is a single control.
- **BREAKING for the URL only:** `?outline=a|b|c` stops doing anything. The param is no longer
  read, and a URL carrying it renders the same page as a URL without it. Nothing in the app
  ever linked to it and nothing persisted it, so no learner has one saved.
- The word "variant" leaves the codebase. Variants A and C, the shared `OutlineVariantProps`
  contract, and the `nuqs` dispatch are deleted; the winning row moves into the outline drawer
  itself, which is what it now is.
- The two pieces of derivation the row needs — course-level completion and the lesson's
  position within its module — are kept as they are. They were written as general readings
  rather than as variant scaffolding, and the row is their only caller either way.
- The mobile drawer's presentation becomes a **specified** behavior of `cinema-lesson-view`
  rather than an unstated implementation detail. Today that spec says what the mobile drawer
  must *not* do (name the region twice) and when it must scroll, but never what it shows.

**Unchanged:** the desktop (`>= lg`) sticky sidebar, the `Outline` itself, its module
disclosures, lesson rows, completion marks, per-lesson meters, and the
open-onto-the-current-lesson positioning that both breakpoints share.

## Capabilities

### New Capabilities

<!-- None. The winning presentation belongs to the capability that already owns the lesson
     view's shape, not to a capability of its own. -->

### Modified Capabilities

- `cinema-lesson-view`: gains a requirement fixing what the mobile course-outline drawer
  presents and how it behaves as a control. The existing requirements about naming the region
  once and opening onto the current lesson are untouched — the row satisfies both already,
  because it is still a `<summary>`.

### Superseded

- `mobile-course-content-variants`: the provisional capability. It was written to be
  disposable and is archived with `--skip-specs`, so the throwaway requirements never enter
  `openspec/specs/`. Its proposal, design, and specs stay readable in
  `openspec/changes/archive/` as the record of why the row was chosen.

## Non-goals

- **Redesigning the row.** It ships as it was judged. Tuning its spacing, tile size, or meter
  thickness is a separate change with its own before-and-after.
- **Changing the desktop sidebar**, the `Outline`, or anything the row opens onto.
- **Adding a progress percentage to mobile.** The numeral was variant A's idea and lost with
  it; the row carries its reading as the edge meter alone.
- **Keeping a way to reach A or C.** They are deleted, not feature-flagged. Their record is
  the archived change.
- **Reviving the docked-bar question.** Whether a bottom-anchored control beats a top card is
  answered for now; asking it again is a new change with a new comparison.

## Impact

**Deleted**

- `src/components/lesson-view/outline-variant-a/` and `outline-variant-c/` — component,
  stories, and tests each.
- `src/components/lesson-view/outline-variant/` — the shared contract and its fixture, the
  fixture moving rather than dying.
- The `nuqs` dispatch, the `OUTLINE_VARIANT` parser, and `MobileOutline` in
  `outline-drawer.tsx`.

**Modified**

- `src/components/lesson-view/outline-drawer/` — the mobile branch becomes the row. Its tests
  and stories absorb the row's, which means the test file moves off its echo-the-key
  `next-intl` mock so the row's copy can be asserted as a learner reads it.
- `e2e/lesson-outline-variants.spec.ts` — becomes a spec about the drawer rather than about a
  switch, keeping the guards that still mean something.
- `src/messages/{en,es,pt}.json` — the keys only A and C used (`progressLabel`,
  `viewContent`, `dockedCounter`, `dockedAriaLabel`) are removed from `Components.Outline`.

**Kept**

- `src/hooks/use-course-watch-progress/` and `src/lib/lesson-position/`, with their tests.

**Dependencies** — `nuqs` stays installed and its adapter stays mounted; this change removes
its only caller, not the library. Nothing else is added or removed.

**Risk of removal** — low and self-announcing: the deleted variants have no callers outside
the dispatch being deleted with them, and `pnpm verify` fails loudly on any reference left
behind.

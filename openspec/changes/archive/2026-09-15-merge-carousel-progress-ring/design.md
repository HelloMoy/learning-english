## Context

Merging `origin/main` into `feat/bilingual-editorial-home` stops on six conflicts. Four are
mechanical; one is a comment; one is a real API clash:

| Path | Conflict | Resolution |
| --- | --- | --- |
| `components/progress-ring/*` (component, test, stories) | add/add, two different components | take `main`'s |
| `components/continue-watching/continue-watching.tsx` | deleted here, comment edited on `main` | keep deleted |
| `components/course-level-card/course-level-card.tsx` | deleted here, comment edited on `main` | keep deleted |
| `domain/use-cases/find-course-catalog/find-course-catalog.ts` | doc comment on `LessonProgressSlice` | keep this branch's |

`main`'s ring: `ProgressRing({ size, fraction | segments, children })`. The stroke width scales with
`size` (`round(size × 0.064)`), the track is `stroke-border`, the fill `stroke-gold` with a glow, the
fill is clamped to the unit range, and `children` are centred over the SVG, which is hidden from
assistive technology. #55 draws it at 220px in the lesson progress panel.

This branch's ring: `ProgressRing({ share, label, className, labelClassName })`, sized by class,
used by `LearnerCard` (tooltip) and `CourseProgressList` (cards).

## Goals / Non-Goals

**Goals:**
- One `ProgressRing`, `main`'s, used by the carousel, the learner card and the lesson cards.
- Callers keep their label, as real text, and their size.

**Non-Goals:**
- Changing how #55's panel draws, including a zero fraction.
- Any other change to the carousel or to My learning.

## Decisions

### D1 · Take `main`'s ring as-is

It is already on `main`, it is the richer API (segments), and #55's panel and tests depend on it.
Rewriting it to also take `share`/`label` would give two ways to say the same thing.
*Alternative rejected:* keep both under different names — two ring components drift.

### D2 · Callers pass size in pixels and the label as children

- `LearnerCard` tooltip: `size={44}`, `fraction={share}`, children are the percentage in
  `text-[11px] font-extrabold tabular-nums text-popover-foreground`.
- `CourseProgressList` cards: `size={44}`, the lead card `size={72}` with a `text-sm` label.

`fraction` is already the completed share in `[0, 1]`, which both callers compute.

### D3 · Keep the deletions and this branch's comment

Nothing in the merged tree imports `ContinueWatching` or `CourseLevelCard`; #55's edits to them were
comment rewording only. `main`'s text on `LessonProgressSlice` ("Three keeps the home card's preview
short") describes a module-preview constant, not the type it sits on.

## Risks / Trade-offs

- [At zero, `main`'s round-capped fill draws a dot the width of the stroke (3px at 44px)] → checked
  in the browser; left as `main` draws it, because changing it would alter #55's 220px "not started"
  panel, which sets `fraction={0}` on purpose. If it looks wrong, it is raised as its own change.
- [The glow may bleed at 44px inside the tooltip] → checked in the browser at 1440 and 390.

## Migration Plan

Resolve the conflicts on the branch, run `pnpm verify` and the affected e2e specs, commit the merge,
push, and merge PR #56.

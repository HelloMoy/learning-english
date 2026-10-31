## Context

The outline is three nested components under `src/components/lesson-view/`:
`OutlineDrawer` (the responsive shell: sticky desktop `<aside>` and the mobile
`<details>` row), `Outline` (the `<nav>` with its pinned heading) and `ModuleList`
(one disclosure per domain `Module`, expanding into `LessonList`). The video rows
already show completion marks and watch bars. The mobile row already computes the
course share with `useCourseWatchProgress`, which also returns a per-module tally
(`byModuleId`), and gates the fill behind `useIsHydrated`.

So the counting exists; nothing renders the per-module tally, and the course share
is drawn only as an unlabelled mobile edge meter.

## Goals / Non-Goals

**Goals:**

- A per-lesson ring and reading in `ModuleList`, a course summary in `Outline`, and
  a completion ring in place of the mobile tile and edge meter.
- One count: every reading comes from `useCourseWatchProgress`, the hook the edge
  meter already uses, so the counting rule cannot drift.
- No claim before hydration, matching the rule the mobile meter already follows.

**Non-Goals:**

- Changing `LessonList`, the shared `ProgressRing`, or how completion is stored.

## Decisions

### 1. `Outline` counts once and hands the tally down

`Outline` calls `useCourseWatchProgress` with every lesson slice and passes the
per-module tallies to `ModuleList` as a `ReadonlyMap<string, WatchTally>`. Before
hydration it passes an **empty map**, and `ModuleList` falls back to the module's
own lesson count — so "no reading yet" and "nothing completed" share one code path
and render the same frame, which is what the spec asks for. No `null`/`undefined`
crosses the boundary.

_Alternative:_ `ModuleList` calls the hook itself. Rejected: `Outline` needs the
course totals for its summary anyway, and two calls would double the work for no
gain. The mobile row keeps its own call because it renders outside `Outline`.

### 2. A small `CompletionRing` instead of the shared `ProgressRing`

`ProgressRing` (course overview) derives its stroke from its size — 1–2 px at the
22 px a row needs — draws a round-capped dot at a fraction of zero, and casts a
glow. Each would need a new prop or a behaviour change on surfaces this change
does not own. A lesson-view `CompletionRing` (`size`, `fraction`, `children`)
draws a fixed-proportion track and **omits the fill entirely** at zero, which is
the "track only" state the spec relies on. It is decorative (`aria-hidden` SVG);
the meaning travels as text.

### 3. The reading is the row's description, not part of its name

The reading sits inside the disclosure button so the whole row stays one tap
target, but it is `aria-hidden` and referenced by `aria-describedby`. The button's
accessible name stays the module title — the same reasoning `LessonList` applies
to its watch bars — so existing name-based queries keep working and a screen
reader announces "Rules For Speaking Fast…, button, collapsed, 4 / 10 videos ·
40%".

### 4. The reading is a pure function of the tally

`moduleProgressReading({ completedCount, lessonCount })` returns a discriminated
union — `untouched` / `inProgress` / `completed` — and the row renders a glyph and
a message per kind. Keeping the branch out of JSX makes the three states explicit
and is the only place a fraction is computed for a row.

### 5. Course summary is not sticky

The summary sits between the pinned heading and the list, and scrolls with the
list. Pinning it would grow `--outline-heading-offset` and push every pinned
module title down; the percentage is not needed while scrolling a long module.
Its bar is `aria-hidden`; the line of text beside it is the reading, so the page
gains no extra `progressbar`.

### 6. The mobile ring takes over the meter's semantics

The tile becomes `CompletionRing size={44}`: the list icon inside it until there
is a reading, then the formatted percentage. The `progressbar` role, value and
localized name move from the deleted edge meter onto the ring, keeping the
existing "no role at zero" rule.

### Copy

New keys under `Components.Outline` in `en`, `es`, `pt`, following
`course-vocabulary` (`Module` → lesson, `Lesson` → video):
`moduleVideoCount`, `moduleProgress`, `moduleCompleted`, `courseSummary`,
`courseSize`. Percentages go through `format.number(…, { style: "percent" })`.

## Risks / Trade-offs

- [The row grows a second line, so the outline gets taller] → The sidebar and
  drawer are already bounded scroll regions that scroll the current lesson into
  view; the extra 16 px per row does not change that.
- [Removing the edge meter loses a full-width progress cue on mobile] → The ring
  states the same share and adds the number; the change was chosen on the
  canvas.
- [`aria-describedby` on a hidden node] → Description computation follows
  references into hidden content by design; covered by an RTL
  `toHaveAccessibleDescription` assertion.

## Testing strategy

All behaviour is covered at the component layer with Vitest + RTL; no new
Playwright spec.

- `completion-ring.test.tsx` (new): no fill at `0`, fill length proportional to
  the fraction, children rendered, SVG hidden from assistive tech.
- `module-list.test.tsx`: the three readings and glyphs from a supplied tally map;
  an empty map falls back to the video count; name stays the title while the
  description carries the reading. Mirrors its existing fixture style.
- `outline.test.tsx`: the summary with real `en` messages (as
  `outline-drawer.test.tsx` does) after seeding completions with `givenLearner`;
  the pre-hydration frame via the mocked `useIsHydrated` pattern.
- `outline-drawer.test.tsx`: the existing "edge meter" block is rewritten for the
  ring (role and name only with a reading, list icon before, no edge meter) and
  keeps the meter-agrees-with-marks test; a new test checks a module ring agrees
  with the marks it opens onto.
- `e2e/lesson-outline-drawer.spec.ts` asserts the row and its expansion only, so
  it should pass unchanged; it is run to confirm.
- Stories: `CompletionRing` gets its own; the `Outline`/`OutlineDrawer` stories
  gain a "with progress" state if their fixtures allow seeding.

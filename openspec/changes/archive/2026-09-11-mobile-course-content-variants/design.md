## Context

`OutlineDrawer` (`src/components/lesson-view/outline-drawer/outline-drawer.tsx`) is the
responsive shell around `Outline`. It renders two branches: a `<details>` accordion below `lg`,
and a sticky `<aside>` at `lg` and above. Both branches bound their height and call
`useScrollCurrentIntoView` so the outline opens onto the current lesson.

The mobile branch is a gold uppercase `<summary>` and nothing else. Three mockups propose
replacing it, and the choice between them is a feel judgement that cannot be made from static
images — it needs a thumb, a real phone, and the 107-lesson course.

Constraints already in force:

- **Progress lives in `localStorage`.** `useCompletedLessons` and `useSavedPlaybackPositions`
  are browser-only. `ModuleWatchProgress` and `LessonWatchProgress` both render `null` rather
  than a zeroed meter, because a bar drawn at zero before hydration asserts something that may
  be false. Any variant meter inherits that rule.
- **One completion rule.** `countsAsComplete` in `src/lib/watch-progress/watch-progress.ts` is
  the single arbiter. A variant computing its own would let a card disagree with the rows it
  opens.
- **`nuqs` is wired but unused.** `<NuqsAdapter>` is mounted in `global-providers.tsx`; no
  component reads a param yet. This change is its first use, and AGENTS.md names it the tool
  for URL-bound state.
- **The domain is off-limits.** Course-level progress is a presentation reading over two
  browser stores, so it belongs in `src/hooks/`, not `src/domain/`.

## Goals / Non-Goals

**Goals:**

- Three mobile presentations reachable by URL on a real phone, each exercising the real course.
- The unswitched default byte-for-byte unchanged, so the comparison has a baseline.
- One source of truth for completion, shared with the outline the variants open.
- Deletion of the two losers as a clean `rm -rf` of their folders.

**Non-Goals:**

- Choosing a winner, or folding it into `cinema-lesson-view`. Separate change.
- Any change to `Outline`, `ModuleList`, `LessonList`, or the desktop `<aside>`.
- A drag gesture on Variant C's handle.
- Persisting the selection, or linking to it from the UI.

## Decisions

### D1 — The param is read with `nuqs`, parsed as a string enum, defaulting to the drawer

`parseAsStringLiteral(["a", "b", "c"] as const)` declared once at module scope, read with
`useQueryState("outline", …)`. An unrecognized value parses to `null`, which is exactly the
"render the default drawer" branch — the fallback is the parser's own behavior, not a
hand-written guard that could drift.

*Alternative considered — reading `useSearchParams` directly.* Fewer moving parts, but AGENTS.md
names `nuqs` for URL-bound state, and `useSearchParams` forces a `<Suspense>` boundary in the
App Router that the adapter already handles.

*Alternative considered — three `/lab` routes.* Rejected with the user: a route needs a
hardcoded lesson, so it cannot show the current lesson's real position, and the comparison
would run against a fixture instead of the course.

`shallow: true` (the default) keeps the change client-side — the player does not remount and
playback position survives flipping variants, which is the point of comparing them back to back.

### D2 — `OutlineDrawer` keeps ownership of the breakpoint; variants know nothing about it

`OutlineDrawer` stays the only component that knows `lg` exists. It dispatches:

```
below lg:  param → a | b | c | (none) → OutlineVariantA | B | C | <details>
lg and up: <aside> — unchanged, never consults the param
```

Each variant receives the same props the drawer already has, plus the progress reading, and
renders `<Outline showHeading={false}>` inside its own scroll region with its own
`useScrollCurrentIntoView`. Variants carry no `lg:hidden` of their own.

*Why not a variant registry / map?* Three entries, each with a distinct prop shape for its
chrome. A map buys indirection and costs the reader the ability to see all three branches at
once. An explicit switch in one small function is the clearer code.

### D3 — Course progress is a new hook, not a widened `useModuleWatchProgress`

`useModuleWatchProgress` takes `LessonRuntime[]` — the shape `find-course-for-view` produces.
The Lesson Page has `Lesson[]` (the discriminated union) instead, where a reading lesson has no
`durationSeconds` at all. Widening the module hook to accept both shapes would give one hook two
input contracts to serve two pages.

`useCourseWatchProgress(lessons: readonly Lesson[])` instead, returning
`{ completedCount, lessonCount, completedFraction }`. It maps each lesson to the
`countsAsComplete` input — `lesson.kind === "video" ? lesson.durationSeconds : 0` — so a reading
lesson is counted by its mark alone, which is the rule `LessonWatchProgress` already applies when
it renders no bar for a lesson with no runtime.

The per-module fill Variant A needs is the same computation scoped to one module's slice, so the
hook exposes a per-module breakdown rather than making the card call a hook in a loop — a course's
module count varies, and a hook per module breaks the rules of hooks the moment a course is
reordered. (This is the same reasoning `useModuleWatchProgress` records for its own lesson loop.)

### D4 — `Lesson N of M` counts within the module, and is server-rendered

`M` is the lesson count of the module named immediately beside it, and `N` the current lesson's
ordinal in that module's `sequence` order — so `Consonants · Lesson 13 of 27` reads as a
statement about Consonants, which is what the mockup's copy says. Both numbers come from
`view.modules` / `view.lessons`, never from storage, so this reading renders on the server like
the rest of the page and does not blink in at hydration.

It lives in `src/lib/lesson-position/` as a pure function over `(lessons, currentLessonId)` —
one unit test file, no React, and the three variants share it rather than each deriving it.

> Worth confirming with the user: the mockup's `27` could equally be the *course*'s lesson
> count. Module-scoped is the reading the surrounding copy supports, and it is a one-line change
> if wrong. Called out in Open Questions.

### D5 — Meters render their track on the server and their fill after hydration

`ModuleWatchProgress` returns `null` before hydration because it is a standalone island that can
appear from nothing without disturbing layout. A variant's meter cannot: it is structural chrome,
and popping it in at hydration would shift the card's height and move the player under the
learner's thumb.

So the variants split the difference, which the spec states as a requirement: the **track**
renders on the server (stable layout), the **fill** and the **percentage** do not. `useIsHydrated`
gates them — it is `false` on the server and during the hydration render, so the first client
render matches the server byte for byte and React does not warn.

Zero-width fill and an absent percentage are both honest: neither asserts "you have watched
nothing".

### D6 — Variants A and B use `<details>`; Variant C does not

A and B expand in place, in flow — exactly what `<details>`/`<summary>` is for, and what the
current drawer already uses. Keyboard support, `aria-expanded`, and Escape come free, and the
baseline they are being compared against gets the same semantics.

Variant C expands *over* the page from a `position: fixed` bar. A `<details>` whose content
escapes its own box is a fight with the element; Variant C gets a button plus a conditionally
rendered sheet, with `aria-expanded` on the button and an Escape handler written by hand.

*Alternative considered — the project's `Dialog` primitive for Variant C.* It traps focus and
locks body scroll, which is more modal than a course outline wants: the learner should still be
able to see the player behind the sheet. A modal wrapper would also make C the only variant that
blocks the page, prejudging the comparison.

### D7 — Variant C reserves its own height at the end of the page

A fixed bar over a scrollable page hides the last content behind it. Variant C publishes its
height as a CSS custom property and the lesson `<main>` carries matching bottom padding while C
is the active variant — `padding-bottom: calc(var(--docked-outline-height) + env(safe-area-inset-bottom))`.

The safe-area inset is applied to the bar's inner padding rather than its offset, so the bar's
background still reaches the physical bottom edge and only its control is lifted clear of the
home indicator. On a device reporting a zero inset the expression collapses to the bar's height,
so there is no phone-specific branch.

### D8 — Copy lives under `Components.Outline`, keyed by what it says

New keys go under the existing `Components.Outline` namespace — these are the same region's copy,
and a variant-per-namespace split would triple the keys that survive into the winner. Keys are
named for the reading (`positionLabel`, `viewContent`, `completionAriaLabel`), not for the variant
(`variantATitle`), so promoting the winner does not rename anything.

`Lesson {position} of {total}` and `{module} · {position} / {total}` are ICU messages with the
numbers interpolated, never concatenated — and the percentage goes through
`format.number(fraction, { style: "percent" })` so a locale writing `38 %` gets it.

## Risks / Trade-offs

- **Three variants ship to production behind a guessable param.** → The default path is
  unchanged and nothing links to the param, so a learner reaches a variant only by typing it.
  The follow-up change deletes two of the three; this change is not the end state.
- **`OutlineDrawer` temporarily grows a four-way branch.** → It stays a dispatch and nothing
  more; all chrome lives in the variant folders. The branch collapses back to one when the
  winner is folded in.
- **Variant A's card pushes the player down, which is part of what is being judged.** → Not
  mitigated. That trade-off is the comparison.
- **Course-level progress on the 107-lesson course reads two stores and filters per lesson on
  every render.** → Two `Map`/`Set` lookups per lesson over ~107 items, the same order of work
  `useModuleWatchProgress` already does per module card on the course page. Measure before
  memoizing.
- **`useIsHydrated` gating means a screenshot of the first frame shows no progress.** →
  Intended, and stated as a requirement. When validating, wait for hydration before judging the
  meters.
- **Variant C's fixed bar can collide with iOS Safari's own bottom chrome**, which appears and
  disappears as the page scrolls. → The safe-area inset covers the home indicator, not Safari's
  toolbar. This is exactly the kind of thing the on-device validation exists to surface; note it
  when reviewing C rather than pre-solving it.

## Testing strategy

**Vitest unit** — `src/lib/lesson-position/lesson-position.test.ts`: ordinal and count within a
module, a lesson that is first / last in its module, a module of one, a lesson id not present.
Mirrors the shape of `src/lib/watch-progress/watch-progress.test.ts` — pure function, table of
cases, `@faker-js/faker` for ids and titles, hardcoded values only where the boundary is the
point.

**Vitest + RTL (hook)** — `src/hooks/use-course-watch-progress/use-course-watch-progress.test.ts`:
`renderHook` over a seeded `localStorage`, following
`src/hooks/use-module-watch-progress/use-module-watch-progress.test.ts`. Cases: nothing completed;
some marked complete; some watched past the finish threshold but unmarked (proving it defers to
`countsAsComplete` rather than re-implementing it); a reading lesson counted by its mark alone;
an empty course.

**Vitest + RTL (components)** — one `*.test.tsx` per variant folder, plus additions to
`outline-drawer.test.tsx`. Follows `outline-drawer.test.tsx`'s existing pattern of rendering the
drawer with a fixture course and asserting on roles.

- `outline-drawer.test.tsx` — the dispatch: `a`/`b`/`c` each render their variant; no param, an
  empty value, and an unrecognized value each render the `<details>` baseline. `nuqs` is driven
  through `NuqsTestingAdapter` rather than mocked, so the parser under test is the real one.
- Per variant — collapsed on arrival; `aria-expanded` flips on activation via `user-event`; the
  outline's rows appear once expanded; the region is named once; Variant B has exactly one
  focusable control in its card; Variant C renders no card above the breadcrumb and collapses on
  Escape.
- Hydration gating — assert the percentage is absent and the fill is zero-width while
  un-hydrated, and present once hydrated. `useIsHydrated` is mocked behind a module-scoped flag,
  following `src/components/theme-toggle/theme-toggle.test.tsx`: a plain RTL `render()` is a
  client render, not a hydration pass, so the real hook returns `true` on its first call and
  leaves no un-hydrated frame to observe. The hook's own behavior is covered by
  `use-is-hydrated.test.ts`; these tests cover the gate, not the hook.

**Storybook** — `<variant>.stories.tsx` per folder, per the `storybook-story-writing` skill,
titled `LessonView/OutlineVariantA|B|C`. Stories for collapsed, expanded, no-progress, and
part-way-through, at a mobile viewport. Copy comes from `Stories.*` in `.storybook/messages/`,
never `vi.mock("next-intl")`.

**Playwright e2e** — `e2e/lesson-outline-variants.spec.ts`, mirroring `e2e/lesson-video-player.spec.ts`.
Deliberately thin, because the real verification is the user on their phone: one spec per variant
at a mobile viewport asserting the variant renders, expands, and shows the current lesson's row —
plus one asserting the unswitched page still renders the `<details>` baseline. Variant C
additionally asserts the page's last content is not behind the docked bar.

**Manual, on device** — the reason this change exists. Playwright WebKit is not a substitute for
iOS Safari here (Variant C's interaction with Safari's bottom chrome does not reproduce in it);
validate all three on the real iPhone over `localhost`.

## Open Questions — resolved

The learner compared all three on an iPhone and chose **variant B**, the compact row. That
choice is carried forward by `mobile-course-content-row`.

1. **Does `27` count lessons in the module or in the course?** **Module.** Resolved by
   selection rather than by a separate answer: the row was chosen with
   `Vowels · Lección 3 de 17` on screen, where `17` is the module's lesson count. Worth
   re-reading if the count ever looks wrong — it was never asked in isolation.
2. **Lessons completed, or seconds watched?** **Lessons**, as implemented and as shown. The
   winning row carries this reading as its edge meter.
3. **Does the variant survive a locale switch?** **Moot.** The switch is deleted with the two
   losing variants, so there is no longer a param to preserve across a locale change.

## 1. Pure geometry

- [x] 1.1 (TDD: test → impl) Write `src/lib/centered-scroll-top/centered-scroll-top.test.ts` covering: a row with room on both sides lands centred; a row near the top clamps to `0`; a row near the bottom clamps to the maximum scrollable offset; a row taller than the region still yields a non-negative, in-range offset; a region taller than its content yields `0`.
- [x] 1.2 (TDD: impl after red) Implement `src/lib/centered-scroll-top/centered-scroll-top.ts` — a pure function over plain numbers (item offset within the container's content, item height, container viewport height, maximum scroll offset) returning the clamped target offset. JSDoc the exported contract per the TypeDoc convention.

## 2. The positioning hook

- [x] 2.1 (TDD: test → impl) Write `src/hooks/use-scroll-current-into-view/use-scroll-current-into-view.test.ts` covering: with a `[aria-current="page"]` descendant present and the hook active, the container's `scrollTop` is written; with no such descendant, `scrollTop` is left untouched and nothing throws; while the hook is inactive, no write happens; flipping inactive → active triggers the write.
- [x] 2.2 (TDD: impl after red) Implement `src/hooks/use-scroll-current-into-view/use-scroll-current-into-view.ts` — `"use client"`, returns a container ref, and in a `useLayoutEffect` keyed on the activation flag resolves the current row by `querySelector`, measures via bounding-rect deltas plus the container's `scrollTop` (never `offsetTop`, see design D4), calls `centeredScrollTop`, and assigns `scrollTop`. No `scrollIntoView`, no `scrollTo`, no animation.

## 3. The scroll container

- [x] 3.1 (TDD: test → impl) Extend `src/components/lesson-view/outline-drawer/outline-drawer.test.tsx`: the desktop region is a bounded, vertically scrollable, sticky container that still exposes the outline's `navigation` landmark; the mobile `<details>` reports its open state through `onToggle` so the drawer branch activates the hook only once open.
- [x] 3.2 (TDD: impl after red) Update `src/components/lesson-view/outline-drawer/outline-drawer.tsx`: desktop `<aside>` gains `sticky` below the header, a viewport-bounded `max-height` expressed with a single `calc()`, and `overflow-y-auto`, wired to the hook's ref with the flag always `true`; the mobile `<details>` body gains a bounded scrollable wrapper wired to its own ref with the flag driven by the `<details>` open state.
- [x] 3.3 Confirm `src/components/lesson-view/outline/outline.tsx`, `module-list.tsx`, and `lesson-list.tsx` need no behavioral change, and that their existing tests still pass untouched. If a `"use client"` directive is needed on `Outline`, add only that.

- [x] 3.4 (TDD: test → impl) Keep the outline's own heading visible: bounding the region scrolls the "Course outline" title out of sight on arrival. Assert in `outline.test.tsx` that the heading sticks to the top of its scroll region, then add the sticky positioning and an opaque background to the `<h2>` in `outline.tsx`.

- [x] 3.5 (TDD: test → impl) Pinning the heading made a pre-existing duplication permanent: on mobile the drawer's `<summary>` and the outline's `<h2>` both read "Course outline". Give `Outline` a `showHeading` flag (default `true`) so the drawer, whose `<summary>` already names the region, renders the outline without a second visible heading. The `<nav>`'s `aria-label` is unchanged, so assistive technology loses nothing.

- [x] 3.6 (TDD: test → impl) Pin the expanded module's title too: while scrolling a module's lessons the learner should keep seeing which module they are in. Make each module disclosure sticky below the outline heading in `module-list.tsx`, with an opaque background and no transparent gap for rows to show through; `outline.tsx` publishes the heading's height as a CSS variable so the offset lives with the heading that causes it.

## 4. Visual verification

- [x] 4.1 Add a long-course story to `src/components/lesson-view/outline-drawer/outline-drawer.stories.tsx` — many modules, the current lesson in a late one — for both the desktop and mobile viewports.
- [x] 4.2 Drive Storybook with Playwright MCP and confirm visually: the current lesson is centred in the sidebar on load, the sidebar scrolls independently, and the mobile drawer opens onto the current lesson. Do not hand this check back to the user.

## 5. End to end

- [x] 5.1 (TDD: test → impl) Add a case to `e2e/lesson-page.spec.ts`: open a lesson in a late module and assert the `aria-current="page"` row is in the viewport while `window.scrollY` is still `0`. If it passes without production changes, the earlier tasks already covered it — keep the test as the regression guard.

## 6. Verification

- [x] 6.1 Run `pnpm test:run` and `pnpm test:e2e`, then `pnpm verify` (typecheck, format, lint, tests). All green before the change is considered done.

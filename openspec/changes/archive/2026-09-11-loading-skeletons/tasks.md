## 1. The `Skeleton` primitive

- [x] 1.1 Add the primitive with `pnpm dlx shadcn@latest add skeleton`, then move it into the folder-per-component layout at `src/components/ui/skeleton/skeleton.tsx` (scaffold output — exempt from TDD; the tests arrive in 1.2)
- [x] 1.2 Cover the primitive: renders a decorative block, merges `className`, exposes no role or accessible name (TDD: test → impl; the impl step is only whatever the CLI output does not already satisfy)
- [x] 1.3 Write `skeleton.stories.tsx` under the `UI/` prefix, showing the shapes the app composes from it (line, block, circle, 16:9 frame)
- [x] 1.4 Add JSDoc to the component and its props per `jsdoc-typescript-docs`

## 2. The loading announcement

- [x] 2.1 Add `Components.LoadingStatus.label` to `src/messages/{en,es,pt}.json`
- [x] 2.2 Build `src/components/loading-status/loading-status.tsx` — a client component rendering one `role="status"` with the localized label (TDD: test → impl)
- [x] 2.3 Add its colocated stories and JSDoc

## 3. The lesson video placeholder

- [x] 3.1 Build `src/components/lesson-view/lesson-video-skeleton/lesson-video-skeleton.tsx`: the lesson's poster through `next/image` when given one, a `Skeleton` fill when not, with the play-control and control-bar silhouettes over either, non-focusable and non-interactive (TDD: test → impl)
- [x] 3.2 Render it from `PlaybackPositionedVideoPlayer` as a sibling of `LessonVideoPlayer`, gated on `useMediaState("canPlay", playerRef)` — shown while false, removed once true (TDD: test → impl, mocking `useMediaState` the way `outline-drawer.test.tsx` mocks `useIsHydrated`)
- [x] 3.3 Assert the placeholder survives hydration while `canPlay` is still false, and that it leaves the player's controls, gestures and resume overlay untouched once retired (TDD: test → impl)
- [x] 3.4 Add stories for both shapes (with poster, without) and JSDoc
- [x] 3.5 Confirm by hand that the server-rendered lesson HTML contains the placeholder inside the 16:9 frame

## 4. Route shells

- [x] 4.1 `src/app/[locale]/loading.tsx` — hero block, section heading row, ladder grid following `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` (TDD: test → impl)
- [x] 4.2 `src/app/[locale]/courses/[courseSlug]/loading.tsx` — course heading block and module grid (TDD: test → impl)
- [x] 4.3 `src/app/[locale]/courses/[courseSlug]/modules/[moduleSlug]/loading.tsx` — module heading block and lesson list rows (TDD: test → impl)
- [x] 4.4 `src/app/[locale]/courses/[courseSlug]/modules/[moduleSlug]/lessons/[lessonId]/loading.tsx` — outline row, breadcrumb, 16:9 frame, title, notes tab row and closing card, in the page's `lg:grid-cols-[260px_1fr_280px]` grid (TDD: test → impl)
- [x] 4.5 Verify each shell against its page at 390px and at 1280px, and fix any shape that does not line up

## 5. Reserved slots for the resolving record

- [x] 5.1 `ContinueWatching`: reserve the panel's shape while the round-trip is in flight, only when the local read returned a location; render nothing when it did not; collapse when the record turns out to be dead (TDD: test → impl, injecting the fake repository and resolver the component already accepts)
- [x] 5.2 `CourseLadder`: reserve every card's progress mark and call-to-action area while the round-trip is in flight, only when the local read returned a location; keep today's not-started state on the server and when there is no record (TDD: test → impl)

## 6. The completion control's unknown state

- [x] 6.1 `LessonCompletionToggle`: add the unknown state — a placeholder of the control's dimensions, silent and non-focusable — shown until completion is known, gated on `useIsHydrated` (TDD: test → impl)
- [x] 6.2 Assert a completed lesson never shows the invitation first (TDD: test → impl)

## 7. i18n and Storybook sweep

- [x] 7.1 Confirm every new key exists in `en`, `es` and `pt`, and that no placeholder renders a hardcoded string
- [x] 7.2 Render every new story in all three locales through the toolbar switcher and confirm no raw keys appear
- [x] 7.3 Move any story-only copy into `.storybook/messages/*` under `Stories.*`

## 8. End-to-end and verification

- [x] 8.1 Add one Playwright spec: navigating to a lesson paints the video placeholder before the player is ready, delaying the Vidstack chunk with `page.route` (TDD: test → impl; the impl already exists by this point, so the spec must fail against a stubbed-out placeholder first)
- [x] 8.2 Re-measure the lesson route on a throttled mobile viewport and confirm the shell replaces the previous page and the frame is never an undressed black box
- [x] 8.3 Run `pnpm verify` (typecheck, format, lint, `pnpm test:run`) and fix every failure at its root
- [x] 8.4 Run `pnpm test:e2e --workers=1` against `PLAYWRIGHT_BASE_URL` for the touched specs

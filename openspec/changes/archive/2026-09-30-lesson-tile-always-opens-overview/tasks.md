## 1. Course overview tile

- [x] 1.1 (TDD: test → impl) Flip the "exactly one video" case in `lesson-ring-tile.test.tsx` to expect the module overview href; watch it fail; make `LessonRingTile` link with `moduleOverviewPath`

## 2. Module overview finale

- [x] 2.1 (TDD: test → impl) Flip the "next lesson holds one video" case in `module-overview.test.tsx` to expect the next module's overview href; watch it fail; make `ModuleOverview` build the finale href with `moduleOverviewPath`

## 3. Remove the shortcut

- [x] 3.1 (TDD: refactor under green) Delete `moduleEntryPath` and its suite from `lesson-routes.ts` / `lesson-routes.test.ts`; update the `NextLessonLink.href` JSDoc in `module-prize.tsx`; confirm no reference remains

## 4. End to end

- [x] 4.1 (TDD: test → impl) Add an `e2e/course-overview.spec.ts` case: clicking the tile of a one-video lesson lands on its module overview URL (should pass after 1.1; confirm it fails against the old behaviour by reasoning or a quick revert)

## 5. Verify

- [x] 5.1 Run `pnpm verify` and `pnpm test:e2e` for `course-overview.spec.ts` (and `module-route.spec.ts`), check the tile in the browser with Playwright MCP

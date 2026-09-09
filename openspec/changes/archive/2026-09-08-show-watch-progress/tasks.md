## 1. Pure rules — watched fraction and finish threshold

- [x] 1.1 (TDD: test → impl) Create `src/lib/watch-progress/watch-progress.test.ts` covering `watchedFraction`: mid-lesson (240/600 → 0.4), clamped above 1, clamped at 0 for a negative position, 0 for a `null` position, 0 for `NaN`, 0 for a zero or negative duration.
- [x] 1.2 (TDD: test → impl) Extend that test file for `hasFinishedWatching`: true at the threshold for a 600s lesson (570), false one second below, true at `ended`, true for a 10s clip at 10s (fallback threshold), false for `null` / `NaN` / zero duration. Assert against the exported constants, never repeated literals.
- [x] 1.3 Implement `src/lib/watch-progress/watch-progress.ts` — `SECONDS_FROM_END`, `FINISHED_FRACTION`, `watchedFraction`, `hasFinishedWatching` — with JSDoc in the style of `src/lib/playback-resume-thresholds/playback-resume-thresholds.ts` (design §D1, §D2).

## 2. Client store — every saved playback position

- [x] 2.1 (TDD: test → impl) Create `src/hooks/use-saved-playback-positions/use-saved-playback-positions.test.ts`: the snapshot reports every `learning-english:playback:*` key as `lessonId → seconds`, ignores foreign keys, is stable by identity between reads with no write in between, refreshes on a `storage` event, refreshes on the exported same-tab refresh, returns a stable empty snapshot on the server, and yields empty (never throws) when `localStorage` access throws.
- [x] 2.2 Implement `src/hooks/use-saved-playback-positions/use-saved-playback-positions.ts` as a module-level `useSyncExternalStore` store mirroring `use-lesson-completion`, exporting `useSavedPlaybackPositions`, `refreshSavedPlaybackPositions` and a `serverPlaybackPositionsSnapshot` for the contract test (design §D3).
- [x] 2.3 (TDD: test → impl) Have the player's write path call `refreshSavedPlaybackPositions` after a successful write, so a mounted surface sees the new value in the same tab; assert it in `use-playback-position.test.ts` (the single write path, and the file whose storage stub lets the call be observed).

## 3. Consumer hooks — the one completion rule

- [x] 3.1 (TDD: test → impl) Create `src/hooks/use-lesson-watch-state/use-lesson-watch-state.test.ts`: marked-only is complete with fraction 0, watched-past-threshold is complete with fraction 1, partly watched is incomplete with the real fraction, neither is `{ 0, false }`, and a zero duration falls back to the tracker alone.
- [x] 3.2 Implement `src/hooks/use-lesson-watch-state/use-lesson-watch-state.ts` composing `useLessonCompletion` and `useSavedPlaybackPositions` through the §1 predicates (design §D4).
- [x] 3.3 (TDD: test → impl) Create `src/hooks/use-module-watch-progress/use-module-watch-progress.test.ts`: counts completions across all runtimes (not just the first six), counts a lesson finished by watching as well as one marked, reports `{ completedCount: 0 }` for an untouched module, and handles an empty runtime list without dividing by zero.
- [x] 3.4 Implement `src/hooks/use-module-watch-progress/use-module-watch-progress.ts` using the same shared rule as 3.2.

## 4. Domain — every lesson's runtime in the module summary

- [x] 4.1 (TDD: test → impl) Extend `src/domain/use-cases/find-course-for-view/find-course-for-view.test.ts`: `lessonRuntimes` holds one entry per lesson in `sequence` order past the `LEADING_LESSONS_CAP`, a reading lesson reports `durationSeconds: 0`, an empty module reports an empty list, and `LessonRepository.listByCourse` is still called exactly once.
- [x] 4.2 Implement `LessonRuntime` and `ModuleSummary.lessonRuntimes` in `find-course-for-view.ts`, derived inside the existing `summarizeModules` reduction with no extra repository call, with JSDoc (design §D5).
- [x] 4.3 Fix every fixture, story and test that constructs a `ModuleSummary` so the new field is present; run `pnpm typecheck` to find them all.

## 5. Auto-completion on finishing a video

- [x] 5.1 (TDD: test → impl) Create `src/hooks/use-complete-when-watched/use-complete-when-watched.test.ts` with a fake player, mirroring `use-persist-playback-position.test.ts`: nothing is written before playback starts even when the position is already past the threshold, crossing the threshold marks complete exactly once across repeated progress events, `ended` marks complete, a position short of the threshold never marks, and a zero `durationSeconds` prop falls back to the player's reported duration.
- [x] 5.2 Implement `src/hooks/use-complete-when-watched/use-complete-when-watched.ts` returning `{ handlePlaybackStarted, handleProgress }`, writing through `markLessonComplete` (design §D6).
- [x] 5.3 (TDD: test → impl) Wire it into `PlaybackPositionedVideoPlayer`: add the `duration` getter to the memoized player handle, bind `handlePlaybackStarted` on `onPlay` beside `openWriteGate`, and `handleProgress` on `onTimeUpdate` and `onEnded`. Extend `playback-positioned-video-player.test.tsx` for the finish path and update the component's JSDoc.

## 6. The bar

- [x] 6.1 (TDD: test → impl) Create `src/components/watch-progress-bar/watch-progress-bar.test.tsx`: `role="progressbar"` with `aria-valuenow`/`aria-valuemin`/`aria-valuemax`, the passed accessible name, the visible label, the fill width, and clamping of an out-of-range value.
- [x] 6.2 Implement `src/components/watch-progress-bar/watch-progress-bar.tsx` — presentational only, no storage and no i18n, labels passed in — with JSDoc (design §D7).
- [x] 6.3 Add `src/components/watch-progress-bar/watch-progress-bar.stories.tsx` under the `Cinema/` prefix per the storybook-story-writing skill: empty, partial, full.

## 7. The per-video island

- [x] 7.1 Add `Components.WatchProgressBar` and `Components.LessonWatchProgress` keys to `src/messages/{en,es,pt}.json`, formatting the percentage with `format.number(..., { style: "percent" })`.
- [x] 7.2 (TDD: test → impl) Create `src/components/lesson-watch-progress/lesson-watch-progress.test.tsx`: renders nothing with no stored position and no mark, renders a 40% bar for 240s of 600s, renders a full bar when complete, renders nothing for a lesson with no duration.
- [x] 7.3 Implement `src/components/lesson-watch-progress/lesson-watch-progress.tsx` as a client island over `useLessonWatchState`, with JSDoc.
- [x] 7.4 Add `lesson-watch-progress.stories.tsx` (`LessonView/` or `Cinema/` prefix per the skill's table), seeding `localStorage` in the story so each state is reviewable.

## 8. The per-module island

- [x] 8.1 Add `Components.ModuleWatchProgress` keys to `src/messages/{en,es,pt}.json` — the `N / M videos` label, its accessible name, and the completed state.
- [x] 8.2 (TDD: test → impl) Create `src/components/module-watch-progress/module-watch-progress.test.tsx`: nothing when no lesson is complete, `7 / 17 videos` with matching ARIA values, the completed state when all are complete, nothing for an empty module.
- [x] 8.3 Implement `src/components/module-watch-progress/module-watch-progress.tsx` over `useModuleWatchProgress`, with JSDoc.
- [x] 8.4 Add `module-watch-progress.stories.tsx` covering the same states.

## 9. The completion rule reaches every surface

- [x] 9.1 (TDD: test → impl) Create the missing `src/components/lesson-completion-mark/lesson-completion-mark.test.tsx`: marked-only shows the mark, watched-past-threshold shows the mark, neither shows nothing.
- [x] 9.2 Give `LessonCompletionMark` an optional `durationSeconds` prop and read `useLessonWatchState` instead of `useLessonCompletion`; update its JSDoc and stories (design §D4).
- [x] 9.3 (TDD: test → impl) Pass each lesson's duration from `LessonList` (the outline) so the mark there uses the same rule; extend `lesson-list.test.tsx`.

## 10. Wiring the two views

- [x] 10.1 (TDD: test → impl) Extend `src/components/module-overview/module-overview.test.tsx`: a partly watched lesson's row shows the bar beneath its title, a completed row shows a full bar and the mark, an untouched row shows neither, the row keeps its eyebrow/title/duration/"Open" action, and "Open" is still the row's only tab stop.
- [x] 10.2 Render `LessonWatchProgress` in the row's central column in `module-overview.tsx`, passing the lesson's duration; update the component JSDoc.
- [x] 10.3 (TDD: test → impl) Extend `src/components/module-showcase-card/module-showcase-card.test.tsx` (and the `course-overview` test where it covers the card): the meter renders between the count line and the call to action, counts past the gallery's preview, is absent for an untouched module, and adds no tab stop.
- [x] 10.4 Render `ModuleWatchProgress` in the card's left panel from `summary.lessonRuntimes`; update the component JSDoc.

## 11. End to end

- [x] 11.1 (TDD: test → impl) Create `e2e/watch-progress.spec.ts` mirroring `e2e/lesson-playback-resume.spec.ts`: seed a position past the finish threshold for one lesson, assert the module overview row shows a full bar and the completion mark, then assert that module's meter on the course overview counts it.

## 12. The outline

- [x] 12.1 (TDD: test → impl) Extend `src/components/lesson-view/lesson-list/lesson-list.test.tsx`: a partly watched lesson's row shows the bar beneath its title, a completed row shows a full bar, a row with nothing watched shows none, a reading lesson shows none, the row link's accessible name stays the lesson title alone, and the link remains the row's only tab stop.
- [x] 12.2 Render `LessonWatchProgress` in `lesson-list.tsx` outside the row's `<Link>` so the bar neither renames the link nor adds a tab stop; update the component JSDoc and its stories.
- [x] 12.3 Verify the outline in the browser with Playwright MCP — sidebar and mobile drawer, in `en`, `es` and `pt` — for the untouched, partly watched and completed states.

## 13. Verification

- [x] 13.1 Run `pnpm verify` (typecheck, format:check, lint, test:run) and fix every failure at its root — no `@ts-ignore`, no rule disables, no loosened config.
- [x] 13.2 Run `pnpm test:e2e e2e/watch-progress.spec.ts --workers=1` against a dev server on a free port via `PLAYWRIGHT_BASE_URL`.
- [x] 13.3 Verify the module overview and the course overview in the browser with Playwright MCP at `en`, `es` and `pt` — untouched, partly watched, and fully watched — and confirm the Storybook stories render in all three locales.

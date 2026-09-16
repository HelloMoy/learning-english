## 1. One module's prize reading

- [x] 1.1 `useModulePrize({ course, module, lessons })` returns `{ hasPrize: true, prize, state, ticketsEarned, ticketCount }` from `useLearnerAchievements` for that module — locked, collecting with counts, ready, claimed, a ticket kept after un-mark — and `{ hasPrize: false }` for a module with no lessons (TDD: Vitest `renderHook` test → impl)

## 2. The prize component

- [x] 2.1 `ModulePrize` `layout="panel"`: silhouette and `???` until claimed, colour and name when claimed; `N / M` ticket tag while locked or collecting, `Redeemed` when claimed; the tickets-left or all-tickets line; the one-sentence state for assistive technology with the visuals hidden; before `isRead` only the label, the silhouette and `???` (TDD: RTL test → impl; copy under `Components.ModulePrize` in en/es/pt, reusing `PrizeShelfItem` and `PrizeIcon.names`)
- [x] 2.2 `ModulePrize` Claim prize link while ready only: locale-aware `Link` to `/achievements?claim=<slug>`, named after the module, no share action in any state (TDD: RTL test → impl)
- [x] 2.3 `ModulePrize` `layout="finale"`: rail marker dashed ring while locked or collecting and solid disc when ready or claimed; subordinate dashed card vs featured card; same states, sentence and link as the panel; renders nothing before `isRead` (TDD: RTL test → impl)
- [x] 2.4 `module-prize.stories.tsx` with both layouts × locked, collecting, ready, claimed and not read, and JSDoc on the component, its props and the hook (stories + docs)

## 3. Wiring into the module overview

- [x] 3.1 `ModuleProgressPanel` renders the prize row it is handed below its figures, keeping its figures and first-frame behaviour unchanged (TDD: RTL test → impl)
- [x] 3.2 `ModuleRoute` reads `useModulePrize` once, hands the same reading and the route's `isRead` to the panel and to a finale rendered after the `<ol>`; the list keeps one item per lesson; the server frame shows no ticket tag or claim link; panel and finale agree (TDD: RTL integration test with real stores → impl)
- [x] 3.3 `module-route.fixtures.ts` can seed tickets and a claim, and `module-route.stories.tsx` / `module-overview.stories.tsx` gain collecting, ready and claimed prize states (stories)

## 4. End to end and review

- [x] 4.1 `e2e/module-route.spec.ts`: collecting shows `11 / 17` in panel and finale with 17 steps; ready offers Claim prize opening `/en/achievements?claim=2-vowels`; claimed shows the prize's name; no horizontal scroll at 390px (TDD: spec red → green)
- [x] 4.2 Visual review with Playwright MCP at 1440px and 390px, dark and light, all four states
- [x] 4.3 Run `pnpm verify` and `pnpm test:e2e e2e/module-route.spec.ts e2e/achievements.spec.ts` (Chromium) and fix every failure

## 5. Review changes

- [x] 5.1 `findModuleForView` resolves `nextModule` — the first later module holding lessons, with its lessons — and none for the last, listing lessons once (TDD: Vitest unit test → impl)
- [x] 5.2 `moduleEntryPath(course, module, lessons)` in `lesson-routes.ts` opens a single-video lesson's video and otherwise its overview, and `LessonRingTile` uses it (TDD: Vitest unit test → impl; tile tests stay green)
- [x] 5.3 `ModulePrize`: Claim prize is an underlined muted text link in both layouts, same name and href (TDD: RTL test → impl)
- [x] 5.4 `ModulePrize` finale: a trophy marker; Start Lesson NN → as the primary button when ready or claimed and a next lesson is given, none while collecting or without a next lesson (TDD: RTL test → impl; copy in en/es/pt)
- [x] 5.5 The module page passes the next lesson's sequence and entry path through `ModuleOverview` and `ModuleRoute` to the finale (TDD: RTL integration test → impl), and stories show it
- [x] 5.6 `e2e/module-route.spec.ts`: Start Lesson 03 → opens Consonants and Claim prize still opens the counter; visual review; `pnpm verify` and the prize e2e specs (TDD: spec red → green)
- [x] 5.7 Panel: the Claim prize text link sits on the Prize ready label's line, at its end, still reachable and named after the module (TDD: RTL test → impl; visual review at 390px and 1440px)
- [x] 5.8 Finale: the Claim prize text link sits on the Prize ready label's line too, leaving Start Lesson as the only action below (TDD: RTL test → impl; visual review)

## 1. Messages

- [x] 1.1 Add `Components.CourseLevelCard.viewCourseContent` to `src/messages/{en,es,pt}.json` with the copy in design.md §5 (TDD: n/a — message data; the component tests in §2 fail until the key exists)
- [x] 1.2 Replace `CourseCatalog.moduleOverview.open` with `watchVideo` in `src/messages/{en,es,pt}.json` using the copy in design.md §5 (TDD: n/a — message data; §5's tests assert the new label)

## 2. `CourseLevelCard` — resume plus a secondary action

- [x] 2.1 Failing test: an in-progress card with a `resumeHref` points its primary action at that href and renders a secondary action to the course overview (TDD: test → impl)
- [x] 2.2 Failing test: a card with no `resumeHref` renders exactly one action, to the course overview, and no secondary action (TDD: test → impl)
- [x] 2.3 Replace the CTA block with the `resumeHref`-driven pair from design.md §3–§4; move `mt-auto` onto the wrapping action block (TDD: impl after 2.1–2.2 are red)
- [x] 2.4 Failing test: the card still exposes only its title and its actions as links, with unchanged accessible names, after the body hit area is extended (TDD: test → impl)
- [x] 2.5 Make the card `relative`, give the title link the stretched `after:` overlay at `z-10`, and raise the action block to `relative z-20` so the foot actions win, per design.md §1 (TDD: impl after 2.4 is red)
- [x] 2.6 Update the component's JSDoc for the two-action contract and the body/foot layering, and add an in-progress story carrying a `resumeHref` (TDD: n/a — docs and story)

## 3. `CourseLadder` — resolve the location into an href

- [x] 3.1 Failing test: with an injected resolver returning a panel, only the matching course's card receives the resolved `lessonHref` (TDD: test → impl)
- [x] 3.2 Failing test: a stored location whose resolver answers `null` leaves every card in the not-started state with no resume action (TDD: test → impl)
- [x] 3.3 Add the injectable `resolve` prop defaulting to `findContinueWatchingAction` (mirroring `ContinueWatching`), hold the resolved href in state, and pass it to the matching `CourseLevelCard` (TDD: impl after 3.1–3.2 are red)
- [x] 3.4 Update the component's JSDoc to record why the ladder resolves rather than trusting the raw record (TDD: n/a — docs)

## 4. `ModuleShowcaseCard` — whole-card hit area

- [x] 4.1 Failing test: the card still exposes exactly two links, named the module title and the call to action, after the hit area is extended (TDD: test → impl)
- [x] 4.2 Make the panel `relative` and give the call to action the stretched `after:` overlay above the deck's stacking context, per design.md §1 (TDD: impl after 4.1 is red)
- [x] 4.3 Update the JSDoc's accessibility section: the pointer target is the whole panel, the announced controls are unchanged, and a future interactive child needs `relative z-20` (TDD: n/a — docs)

## 5. `ModuleOverview` — whole-row hit area and the renamed action

- [x] 5.1 Failing test: each row exposes exactly one announced link and its accessible name is the watch-video label, not `Open` (TDD: test → impl)
- [x] 5.2 Point the trailing action at `t("watchVideo")`, make the row `relative`, and give that action the stretched `after:` overlay plus a row-wide hover treatment (TDD: impl after 5.1 is red)
- [x] 5.3 Update the JSDoc and the story prose that still say "Open" (TDD: n/a — docs)

## 6. End-to-end

- [x] 6.1 Failing e2e: clicking a showcase card's own centre — no button there — lands on that module's overview (TDD: test → impl; impl already landed in §4)
- [x] 6.2 Failing e2e: clicking a video row's title lands on that lesson's page (TDD: test → impl; impl already landed in §5)
- [x] 6.3 Failing e2e: with a stored continue-watching location, the home's in-progress card's primary action lands on that lesson and its secondary action lands on the course overview (TDD: test → impl; impl already landed in §2–§3)
- [x] 6.4 Failing e2e: clicking a course card's description lands on the course overview, and clicking its primary action still lands on the lesson (TDD: test → impl; impl already landed in §2)

## 7. Verification

- [x] 7.1 Run `pnpm verify` (typecheck, format, lint, `pnpm test:run`) and fix every failure at its root
- [x] 7.2 Run `pnpm test:e2e` for the touched specs against a running server (`PLAYWRIGHT_BASE_URL`, `--workers=1`)
- [x] 7.3 Visual pass with Playwright MCP: the two-action course card, the whole-card click on the course overview and the whole-row click on the module overview, in `en` and `es`

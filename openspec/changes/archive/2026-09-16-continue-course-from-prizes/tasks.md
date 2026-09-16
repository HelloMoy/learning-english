## 1. The page offers the way back into the course

- [x] 1.1 `AchievementsView` reads the continue-watching record with `useResolvedContinueWatching` and renders the closing action: reserved while resolving, the resumed lesson once resolved, the first lesson when there is nothing to continue or the record is stale (TDD: RTL test → impl; inject `continueWatching` and `resolve` fakes as `my-learning-view.test.tsx` does)
- [x] 1.2 `AchievementsPage` resolves `homeFirstLesson(entries)` and passes it to the view, with the action's copy under `Achievements.*` in en/es/pt (TDD: RTL test, including the `es` rendering → impl)
- [x] 1.3 ~~The action stays bounded when the lesson's title is long~~ — **superseded by 1.4**: naming the course instead of the lesson makes the label fixed and short, so the truncation and its test are removed rather than left as dead machinery
- [x] 1.4 The action names the course, not the lesson: `Continuar con el curso` when there is something to resume and `Empezar el curso` when there is not, in en/es/pt; the spec requirement and the tests that asserted the lesson's name are rewritten, not deleted (TDD: rewritten RTL tests → impl)

## 2. The reveal offers it too

- [x] 2.1 Rewrite the standing guard `WHEN shown on the counter THEN it offers one way out and no link away from the page` in `prize-redeemed-modal.test.tsx`: it asserts the decision this change reverses, so it becomes "two named ways out, one of them onward" — rewritten deliberately, never deleted to get to green (TDD: this rewritten test is the failing test for 2.2)
- [x] 2.2 `PrizeRedeemedModal` takes the destination and offers the onward control beside the closing one — both named, the close still primary, Escape and the focus return unchanged (TDD: 2.1's test → impl; `Components.PrizeRedeemedModal.*` in en/es/pt)
- [x] 2.3 `AchievementsView` hands that same destination to the dialog when a prize is claimed, settling the dialog before navigation (TDD: RTL test → impl)
- [x] 2.4 Amend the reveal's JSDoc, which still says the dialog leads nowhere, and the `with one control that closes it` sentence in `openspec/changes/learner-achievements/specs/learner-achievements/spec.md`, then re-validate both changes with `openspec validate --strict` (docs + spec only, no behavior)

## 3. Stories

- [x] 3.1 `achievements-view.stories.tsx` gains the resolved and nothing-started states, and `prize-redeemed-modal.stories.tsx` shows the dialog with the onward control (stories only)

## 4. End to end and review

- [x] 4.1 `e2e/achievements.spec.ts`: claiming a prize and then continuing the course lands the learner on a lesson page (TDD: spec red → green)
- [x] 4.2 Visual review with Playwright MCP of both actions, in both themes and at phone width
- [x] 4.3 Run `pnpm verify` and `pnpm test:e2e e2e/achievements.spec.ts` (Chromium) and fix every failure

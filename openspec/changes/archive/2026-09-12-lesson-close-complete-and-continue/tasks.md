## 1. Copy

- [x] 1.1 Add the `Components.LessonCloseCard` namespace (`prompt`, `upNext`, `courseCompleted`) to `src/messages/en.json`, `es.json` and `pt.json`, with the same keys in all three (no TDD: message data, covered by the component tests that read the keys)

## 2. The closing card

- [x] 2.1 Write the failing test for the next-lesson state: `lesson-close-card.test.tsx` asserts the prompt renders, `children` render inside the card, the row is a single link whose accessible name contains the next lesson's title, and its `href` is the locale-prefixed `lessonPath` built from the **next lesson's own module** (TDD: test → impl)
- [x] 2.2 Implement `src/components/lesson-view/lesson-close-card/lesson-close-card.tsx` to pass 2.1 — presentational, props `course` / `nextLesson` / `nextLessonModule` / `children`, `Link` from `@/i18n/navigation`, `lessonPath` from `@/i18n/lesson-routes`, `Play` + `ChevronRight` from `lucide-react` marked `aria-hidden` (TDD: impl follows 2.1)
- [x] 2.3 Write the failing test for the terminal state: with `nextLesson: null` the card renders the localized end-of-course message and contains no link (TDD: test → impl)
- [x] 2.4 Extend the component to pass 2.3 (TDD: impl follows 2.3)
- [x] 2.5 Write the failing test for the tap target and wrapping: the row's activatable element carries the ≥44px minimum-height class and a `min-w-0` growing text column with a `shrink-0` chevron (TDD: test → impl)
- [x] 2.6 Apply the row layout classes to pass 2.5, plus the `lg:`-neutralised chrome (card chrome, prompt, divider and row hidden or neutralised from `lg` up) per design D3 (TDD: impl follows 2.5)
- [x] 2.7 Add JSDoc to `LessonCloseCard` and its props explaining the phone-only chrome and why the button arrives as `children` (`jsdoc-typescript-docs`)
- [x] 2.8 Add `lesson-close-card.stories.tsx` with `Default` and `CourseCompleted`, reviewed at phone width in `en` / `es` / `pt` (`storybook-story-writing`)

## 3. The full-width button

- [x] 3.1 Write the failing assertion in `mark-as-complete-button.test.tsx` that the button is full width below `lg` and intrinsic from `lg` up (`w-full lg:w-auto`, wrapper `items-stretch lg:items-start`) (TDD: test → impl)
- [x] 3.2 Apply those classes to `mark-as-complete-button.tsx` (TDD: impl follows 3.1)

## 4. Composition in the lesson view

- [x] 4.1 Write the failing assertions in `lesson-view.test.tsx`: the closing card is inside `main` and wraps the "Mark as complete" button, the button is mounted exactly once on the page, and the rail still renders its `UpNextCard` (TDD: test → impl)
- [x] 4.2 Compose `LessonCloseCard` around `MarkAsCompleteButton` at the end of `main` and wrap the rail's `UpNextCard` in `hidden lg:block` in `lesson-view.tsx` (TDD: impl follows 4.1)
- [x] 4.3 Export `LessonCloseCard` from `src/components/lesson-view/index.ts`

## 5. Browser behaviour

- [x] 5.1 Write the failing Playwright assertions in `e2e/lesson-page.spec.ts`: at a 390px viewport the closing row's link is visible with the next lesson's `href`, the rail's "Up next" region is hidden, and exactly one visible link addresses the next lesson; at the default desktop viewport the rail card is visible and the closing row is not (TDD: test → impl — run it red before 4.2 lands, or re-run it red by reverting the composition)
- [x] 5.2 Verify the change in a real browser at 390px with Playwright MCP — the closing block reads as one surface, the row is tappable, and the page does not scroll sideways in `en` / `es` / `pt`

## 6. Verification

- [x] 6.1 Run `pnpm verify` (typecheck, format, lint, `pnpm test:run`) and fix every failure at its root
- [x] 6.2 Run the touched e2e specs — `pnpm test:e2e e2e/lesson-page.spec.ts` and `e2e/mobile-viewport.spec.ts` (`PLAYWRIGHT_BASE_URL` against the running dev server, `--workers=1`) — and fix every failure

## 7. Phone ordering (follow-up)

- [x] 7.1 Write the failing tests: in `lesson-view.test.tsx` the center column renders the Resources card before the closing block, and the rail keeps its own; in `e2e/lesson-page.spec.ts` at 390px exactly one Resources card is visible and it sits above the closing block, while at desktop width the rail's is the visible one (TDD: test → impl)
- [x] 7.2 Render the phone copy of `ResourceList` in `main` before `LessonCloseCard` and hide the rail's below `lg`, mirroring how the "Up next" card is already split (TDD: impl follows 7.1)
- [x] 7.3 Re-run `pnpm verify` and the touched e2e specs

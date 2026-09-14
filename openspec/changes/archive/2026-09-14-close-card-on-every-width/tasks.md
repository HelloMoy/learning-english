## 1. The completion control at every width

- [x] 1.1 `LessonCompletionToggle`: replace the "full width on a phone and intrinsic from `lg`" test with one asserting the prompt, the button (`w-full`) and its container (`items-stretch`) carry no `lg:` variant; assert the same for the unknown-state skeleton (TDD: test → impl)
- [x] 1.2 `LessonCompletionToggle`: drop `lg:hidden`, `lg:w-auto`, `lg:items-start`, `lg:w-44` from the incomplete state and `UnknownState`; update JSDoc and the story's "phone-only" note (TDD: test → impl)

## 2. The closing card at every width

- [x] 2.1 `LessonCloseCard`: add a test asserting the section keeps its card surface (`rounded-xl`, `border`, `bg-card`) with no `lg:` reset, and the next-lesson row's wrapper carries no `lg:hidden` (TDD: test → impl)
- [x] 2.2 `LessonCloseCard`: drop the `lg:` classes; rewrite the JSDoc paragraph on phone-only chrome; replace the story's `OnDesktop` note so it reviews the same chrome at desktop width (TDD: test → impl)

## 3. One next-lesson affordance on the page

- [x] 3.1 `LessonView`: rewrite "main closes with it and the rail keeps its card" to assert exactly one link to the next lesson on the page, inside `main`, and no rail copy; keep the "button mounted once" assertion (TDD: test → impl)
- [x] 3.2 `LessonView`: remove the rail's `UpNextCard` block and import; update the JSDoc paragraph on the rail's card (TDD: test → impl)
- [x] 3.3 Delete `src/components/lesson-view/up-next-card/` (component, test, story), its barrel export in `src/components/lesson-view/index.ts`, and the `Components.UpNextCard` namespace in `src/messages/{en,es,pt}.json`
- [x] 3.4 `LessonView`: rewrite the materials tests to assert one `ResourceList` inside the rail `<aside>`, ahead of the closing card, and none in `main`; then move `LessonCloseCard` into the `<aside>` after `ResourceList` and delete the center column's phone copy with its `lg:` wrappers; update JSDoc (TDD: test → impl)

## 4. Browser coverage

- [x] 4.1 `e2e/lesson-page.spec.ts`: point the "renders all regions" and "cross-module navigation" next-lesson assertions at the closing card's link; replace the desktop scenario of the `lesson-close-card` block with one asserting the card's link is visible at 1440px, no "Up next" region exists, the card sits in the rail directly below the single Resources card and right of the player, and marking complete inside the card works (TDD: test → impl — the tests turn green with tasks 1–3)

## 5. Verification

- [x] 5.1 Run `pnpm verify` (typecheck, format, lint, `pnpm test:run`) and `pnpm test:e2e e2e/lesson-page.spec.ts`; review the page at 390px and 1440px in the browser with Playwright MCP

## 1. Remove the notes card from the lesson view

- [x] 1.1 (TDD: test → impl) In `src/components/lesson-view/lesson-view/lesson-view.test.tsx`, add a failing test: with a `notesResource` present, no element is headed "Lesson notes (source)" and no link points at the notes `Resource.url`. Then delete the second `ResourceList` and the `Components.LessonNotes` translations hook from `lesson-view.tsx`.
- [x] 1.2 (TDD: test → impl) Add a failing test that a lesson whose only `Resource` is the notes file renders the Resources card's localized empty state and no rail rows. Make it pass — expect the filter in `lesson-view.tsx` to already cover it, and confirm rather than assume.
- [x] 1.3 (TDD: test → impl) Add a failing test that the Notes tab still renders its body when `notesResource` is set, so the removal did not reach past the rail. Make it pass.
- [x] 1.4 Update the `LessonView` JSDoc: say that `notesResource` now exists only as the identity the Resources card filters by, so the inline-rendered `readme.md` is not also listed as a file. No behavior change; no new test.

## 2. Retire the `titleOverride` escape hatch

- [x] 2.1 (TDD: test → impl) In `src/components/lesson-view/resource-list/resource-list.test.tsx`, remove any `titleOverride` case and assert the heading comes from `Components.ResourceList.title`. Then drop the `titleOverride` prop, its `??` branch, and the JSDoc paragraph describing it from `resource-list.tsx`.
- [x] 2.2 Run `pnpm typecheck` to confirm the removed prop has no remaining caller.

## 3. Clean up translations and stories

- [x] 3.1 Remove the `Components.LessonNotes` namespace from `src/messages/en.json`, `es.json`, and `pt.json`. Leave `Components.ResourceList.titleWithNotes` alone — it is out of scope (see the proposal's non-goals).
- [x] 3.2 Update the `lesson-view.stories.tsx` story that passes a real `notesResource`: rename and re-document it as the case proving a notes-carrying lesson shows one rail card, not two. Verify it in the browser with Playwright MCP at `http://localhost:6006` in `en`, `es`, and `pt`.

## 4. End-to-end

- [x] 4.1 (TDD: test → impl) In `e2e/lesson-page.spec.ts`, change the "resource links resolve" describe to walk only the primary lesson's non-notes rows — identify the notes row via `contentCatalog.notesKeys[PRIMARY_LESSON.id]` matched against `ResourceRow.url`, not a hardcoded filename — and add an explicit negative assertion that no link in the page points at the notes URL. Update the stale comment naming the "Lesson notes (source)" card.
- [x] 4.2 Verify the real page with Playwright MCP: open a notes-carrying lesson in `en`, `es`, and `pt`; confirm the rail shows Resources + Up next only, and the Notes tab still renders.

## 5. Verification

- [x] 5.1 Run `pnpm verify` (typecheck, format:check, lint, test:run) and fix any failure at its root.
- [x] 5.2 Run `pnpm test:e2e` for the touched area against a dev server on a non-3000 port (`PLAYWRIGHT_BASE_URL`, `--workers=1`), since `pnpm verify` does not run Playwright.

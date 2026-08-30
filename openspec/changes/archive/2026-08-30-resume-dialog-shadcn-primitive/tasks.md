## 1. Extract the pure threshold predicate

- [x] 1.1 (TDD: test → impl) Write `src/lib/playback-resume-thresholds/playback-resume-thresholds.test.ts` against a not-yet-existing module: `isPositionResumable` returns `false` for `null`, for a non-finite or negative position, for `durationSeconds <= 0`, for `< MIN_SECONDS_FROM_START`, and for a position within `SECONDS_NEAR_END` of the end; `true` for a mid-lesson position. Include the faker fuzz case (`min: 30, max: 590`). Lift these from the existing threshold cases in `lesson-video-resume.test.tsx` — assert on the predicate directly, no `render`. Confirm it fails.
- [x] 1.2 (TDD: impl) Create `src/lib/playback-resume-thresholds/playback-resume-thresholds.ts` by moving `MIN_SECONDS_FROM_START`, `SECONDS_NEAR_END` and `isPositionResumable` out of `lesson-video-resume.tsx`, JSDoc included. Green.
- [x] 1.3 Repoint `playback-positioned-video-player.tsx` and `lesson-video-resume.tsx` at the new module so the tree still builds; `pnpm typecheck` and `pnpm lint` clean (the `local-structure/folder-per-entity` rule watches `src/lib/**`).

## 2. shadcn `Dialog` primitive

- [x] 2.1 (TDD: test → impl) Write `src/components/ui/dialog/dialog.test.tsx` first: all ten exports resolve; an open `Dialog` puts `data-slot="dialog-overlay"` and `data-slot="dialog-content"` in the document but **outside** `render()`'s container; content has `role="dialog"` and `aria-modal="true"` and is named by its `DialogTitle`; `userEvent.keyboard("{Escape}")` fires `onOpenChange(false)`; clicking the overlay fires `onOpenChange(false)`; `showCloseButton={false}` renders no close button; the close button's accessible name comes from `Components.Dialog.closeLabel`. Mirror the `vi.mock("next-intl")` key-echo helper from `lesson-video-resume.test.tsx`. Confirm it fails.
- [x] 2.2 (TDD: impl) Create `src/components/ui/dialog/dialog.tsx` from shadcn's v4 registry source — structure, `data-slot` attributes and prop signatures verbatim, `import { Dialog as DialogPrimitive } from "radix-ui"` as in `button.tsx:4`. Only the class strings are re-skinned onto project tokens per design §D1: `bg-card`, `border-border`, `rounded-xl`, overlay `bg-black/70`, `focus-visible:ring-3 focus-visible:ring-ring/50`. Wire the close button's `sr-only` text to `Components.Dialog.closeLabel`. Green.
- [x] 2.3 Add `Components.Dialog.closeLabel` to `src/messages/en.json`, `es.json` and `pt.json` — all three in the same pass.
- [x] 2.4 JSDoc every export (`Dialog`, `DialogContent`, `DialogTitle`, `DialogDescription`, `DialogHeader`, `DialogFooter`, `DialogClose`, `DialogOverlay`, `DialogPortal`, `DialogTrigger`) plus the `showCloseButton` prop, per the `jsdoc-typescript-docs` skill.
- [x] 2.5 Add `src/components/ui/dialog/dialog.stories.tsx` under title `UI/Dialog`: a default open dialog, one with `showCloseButton={false}`, one long-content case. Do **not** mock `next-intl`. Verify light/dark and `en`/`es`/`pt` via the toolbar; check the a11y panel is clean.

## 3. Resume modal on NiceModal + Dialog

- [x] 3.1 (TDD: test → impl) Write `src/components/modals/lesson-video-resume-modal/lesson-video-resume-modal.test.tsx` against a not-yet-existing modal, rendering inside `<NiceModal.Provider>` and opening via `NiceModal.show`: it shows the title, description and both CTAs; MM:SS formatting for `180 → 03:00`, `65 → 01:05`, `45 → 00:45` plus the faker fuzz case; clicking Resume resolves `{ action: "resume", seconds }`; Restart resolves `{ action: "restart" }`; `Escape` and an overlay click resolve `{ action: "dismissed" }`; the portal is torn down (`modal.remove()`) after close. Reuse the key-echo `vi.mock("next-intl")` helper and the GIVEN/WHEN/THEN describe nesting from `lesson-video-resume.test.tsx`. Confirm it fails.
- [x] 3.2 (TDD: impl) Create `src/components/modals/lesson-video-resume-modal/lesson-video-resume-modal.tsx` with `NiceModal.create` + `useModal`, rendering `Dialog` / `DialogContent` / `DialogHeader` / `DialogTitle` / `DialogDescription` / `DialogFooter` and two `Button`s (`default` for Resume, `outline` for Restart). Bind `open` to `modal.visible`, `onOpenChange` to `modal.hide`, resolve the three-valued result of design §D2, and call `modal.remove()` after close. Keep the MM:SS formatter. Green.
- [x] 3.3 Rename `Components.LessonVideoResume` → `Components.LessonVideoResumeModal` in all three locale files and add the new `description` key, translated for `en`, `es` and `pt` — no locale left on a raw key.
- [x] 3.4 JSDoc the modal, its props and its resolved-result type.
- [x] 3.5 Add `lesson-video-resume-modal.stories.tsx` under title `Components/LessonVideoResumeModal`, wrapped in `NiceModal.Provider` and shown open. No `next-intl` mock. Review in all three locales, light and dark.

## 4. Player wiring

- [x] 4.1 (TDD: test → impl) Update `playback-positioned-video-player.test.tsx`: wrap renders in `<NiceModal.Provider>`, move prompt assertions from the container to `screen`, and add cases for — no dialog when the stored position is `null` / `< 30s` / within the last `10s`; a dialog for a mid-lesson position; the dialog opens at most once per mount; `resume` seeks to the saved seconds; `restart` and `dismissed` both leave `currentTime` at `0`; the existing debounced-write assertions still pass unchanged. Confirm the new cases fail.
- [x] 4.2 (TDD: impl) In `playback-positioned-video-player.tsx`, drop the `savedPosition` state and the `LessonVideoResume` child, and call `await NiceModal.show(LessonVideoResumeModal, …)` from the existing mount effect behind a `hasOfferedResumeRef` guard (design §D3), acting on the resolved result. Keep the `relative` wrapper only if the layout still needs it. Green.
- [x] 4.3 Delete `src/components/lesson-view/lesson-video-resume/` (component, test, stories) and confirm nothing still imports it (`grep -rn "lesson-video-resume" src/ e2e/`).

## 5. End-to-end

- [x] 5.1 (TDD: test → impl) In `e2e/lesson-playback-resume.spec.ts`, add a case: with a stored `00:30`, reload, press `Escape`, then assert the dialog is gone and the `<video>`'s `currentTime` is `0`. Confirm the existing page-scoped `getByRole("dialog", { name: /resume playback/i })` assertions still pass against the portalled modal without edits.

## 6. Verification

- [x] 6.1 Run `pnpm verify` (typecheck, format:check, lint, `test:run`) — all green.
- [x] 6.2 Run `pnpm test:e2e --grep "resume"` for `e2e/lesson-playback-resume.spec.ts` — all green.
- [x] 6.3 Run `pnpm storybook` and confirm `UI/Dialog` and `Components/LessonVideoResumeModal` render correctly in `en`/`es`/`pt`, light and dark, with a clean a11y panel.

## 1. Copy

- [x] 1.1 Add `moduleVideoCount`, `moduleProgress`, `moduleCompleted`, `courseSummary` and `courseSize` under `Components.Outline` in `src/messages/{en,es,pt}.json`, following `course-vocabulary` (TDD: the component tests in 3–4 render real messages and fail until the keys exist)

## 2. Completion ring

- [x] 2.1 `CompletionRing` in `src/components/lesson-view/completion-ring/`: track always, no fill at a zero fraction, fill proportional otherwise, children centred, SVG hidden from assistive tech (TDD: `completion-ring.test.tsx` → impl)
- [x] 2.2 Story `LessonView/CompletionRing` (empty, partial, full, with a percentage inside) and JSDoc

## 3. Lesson rows

- [x] 3.1 `moduleProgressReading` returns `untouched` / `inProgress` / `completed` from a tally; `ModuleList` takes a `progressByModuleId` map and renders the ring or the completed disc plus the reading (TDD: `module-list.test.tsx` cases for the three readings and the empty-map fallback → impl)
- [x] 3.2 The reading is the disclosure's accessible description, its name stays the module title (TDD: name/description assertions → impl)

## 4. Course summary

- [x] 4.1 `Outline` counts with `useCourseWatchProgress`, gates on `useIsHydrated`, passes the per-module map (empty before hydration) and renders the summary bar, percentage and line (TDD: `outline.test.tsx` with real messages, seeded progress, and a pre-hydration frame → impl)

## 5. Mobile row

- [x] 5.1 Replace the list-icon tile and the edge meter with `CompletionRing size={44}`: list icon until a reading, then the percentage; `progressbar` semantics move onto the ring (TDD: rewrite the edge-meter block of `outline-drawer.test.tsx` → impl)
- [x] 5.2 A lesson ring agrees with the completion marks it opens onto (TDD: new `outline-drawer.test.tsx` case → impl if needed)
- [x] 5.3 Update JSDoc on `OutlineDrawer`, `Outline` and `ModuleList`, and the stories that render them

## 6. Verification

- [x] 6.1 `pnpm verify` passes (typecheck, format, lint, Vitest)
- [x] 6.2 `pnpm test:e2e e2e/lesson-outline-drawer.spec.ts e2e/lesson-page.spec.ts` passes
- [x] 6.3 Visual check with Playwright MCP on desktop and a phone viewport, with seeded progress, against the canvas's recommended board

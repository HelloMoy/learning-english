## 1. The dependency

- [x] 1.1 Add `canvas-confetti` and `@types/canvas-confetti` with `pnpm add` (no TDD: dependency install — the user asked for this library by name)

## 2. The celebration

- [x] 2.1 Write the failing `celebrate-completion.test.ts`: it imports the library on demand and fires a burst passing `disableForReducedMotion: true` (TDD: test → impl)
- [x] 2.2 Implement `src/lib/celebrate-completion/celebrate-completion.ts` with the dynamic import and the cinema-palette burst, plus JSDoc (TDD: impl follows 2.1)
- [x] 2.3 Write the failing tests for the failure paths: a rejected import and a throwing burst both resolve instead of rejecting (TDD: test → impl)
- [x] 2.4 Wrap the call so a failed celebration cannot reject into its caller (TDD: impl follows 2.3)

## 3. The manual producer

- [x] 3.1 Write the failing tests in `lesson-completion-toggle.test.tsx`: a confirmed mark celebrates, a Server Action without `data` does not, and confirming an un-mark does not (TDD: test → impl)
- [x] 3.2 Call the celebration from the toggle's mark path (TDD: impl follows 3.1)

## 4. The playback producer

- [x] 4.1 Write the failing tests in `use-complete-when-watched.test.ts`: crossing the finish threshold celebrates, further progress events do not celebrate again, and a lesson opened past the threshold without playback does not (TDD: test → impl)
- [x] 4.2 Call the celebration where the finish rule writes the mark (TDD: impl follows 4.1)

## 5. Verification

- [x] 5.1 Run `pnpm verify` and fix every failure at its root
- [x] 5.2 Watch it in a real browser at 390px: mark a lesson and confirm the burst fires over the closing card without blocking it, and that reduced motion silences it

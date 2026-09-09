## 1. Reproduce the clipping as a failing test

- [x] 1.1 (TDD: test → impl) `e2e/lesson-playback-resume.spec.ts`: in an iPhone-emulated
      describe, open the overlay and assert the card's box lies within the player's box.
      The first version passed in error — `role="dialog"` is the full-player backdrop, not
      the card — so it measures `:scope > div` instead. Genuinely red then: the card's
      bottom sat at 430px against a player bottom of 222px at 320px

## 2. The compact form

- [x] 2.1 (TDD: test → impl) `lesson-video-resume-overlay.test.tsx`: the dialog's
      accessible name and description still resolve when the heading and description are
      not painted → hide them with `sr-only`, not `hidden`, below `sm`
- [x] 2.2 (TDD: test → impl) same file: the timestamped resume action and the restart
      alternative are present at every size → tighten padding and rhythm below `sm`
      without touching the actions
- [x] 2.3 (TDD: test → impl) same file: the desktop presentation still paints the
      heading and the description → keep the `sm:` branch as it is today
- [x] 2.4 Add the `max-h-full` / `overflow-y-auto` backstop to the card
- [x] 2.5 Make the e2e assertion from 1.1 pass at 390px, then add the 320px case

## 3. Story and documentation

- [x] 3.1 Add a phone-viewport story to `lesson-video-resume-overlay.stories.tsx` so the
      compact form is reviewable without a device
- [x] 3.2 Update the component's JSDoc: why the prose is the part that gives way, and
      why it goes to `sr-only` rather than being removed

## 4. Verification

- [x] 4.1 `pnpm verify` green — 1245 Vitest tests across 140 files
- [x] 4.2 169 e2e passed across chromium, firefox and webkit for
      `lesson-playback-resume`, `lesson-video-player`, `lesson-page` and
      `mobile-viewport`
- [x] 4.3 Confirmed on a real iPhone by the project owner: the card is whole. Also
      captured under iPhone emulation — "Resume from 09:10", the close control and both
      actions, all inside the player — and the desktop presentation is unchanged, which
      the RTL and e2e suites hold

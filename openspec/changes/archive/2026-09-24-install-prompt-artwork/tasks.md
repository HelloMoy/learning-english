## 1. Catching the offer in time

- [x] 1.1 `useInstallPrompt` adopts an offer stashed on `window` before hydration, still captures
  one that arrives afterwards, and clears the stash once the offer is spent. (TDD: test → impl,
  extending its existing suite.)
- [x] 1.2 `captureInstallOffer` prevents the event's default and stashes it, called from the
  client instrumentation entry point so it runs before the app starts. (TDD: test → impl.)

## 2. The picture

- [x] 2.1 `InstallPromptArt` draws the home screen for a handheld, with the course's icon placed
  among other apps. (TDD: test → impl, RTL.)
- [x] 2.2 It draws the application switcher for a desktop, with the course among other
  applications. (TDD: test → impl.)
- [x] 2.3 It is `aria-hidden` and adds nothing to the accessible name. (TDD: test → impl.)
- [x] 2.4 JSDoc, per `jsdoc-typescript-docs`.
- [x] 2.5 `install-prompt-art.stories.tsx` with a handheld and a desktop story.

## 3. The prompt

- [x] 3.1 `InstallPromptModal` draws the art and no longer carries the identity row, while still
  calling `onAccept` and closing. (TDD: test → impl, extending its existing suite.)
- [x] 3.2 `desktop.body` in all three locales speaks of switching to it like any other
  application. (TDD: `messages.test.ts` stays green; a new assertion pins the claim.)

## 4. Verification

- [x] 4.1 Walk the `clean-code` checklist across every file touched.
- [x] 4.2 Run `pnpm verify` and fix every failure at its root.
- [x] 4.3 Confirm on the Android emulator over CDP that the chip now appears, and review both
  prompts in the browser.

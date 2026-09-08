## 1. The resume rule (Vitest unit)

- [x] 1.1 (TDD: test → impl) Rename the trigger in
      `use-resume-on-first-play.test.ts` from `handlePlay` to `handlePlaybackStarted`
      and restate each case as "playback started", so the suite fails to compile against
      the current hook.
- [x] 1.2 (TDD: test → impl) Rename `handlePlay` to `handlePlaybackStarted` in
      `use-resume-on-first-play.ts`, updating the `ResumeOnFirstPlay` type, the JSDoc
      `@remarks` and `@example` to describe holding on playback start rather than on the
      play request. The `ResumablePlayer` port stays as it is.

## 2. The wiring (Vitest component + RTL)

- [x] 2.1 (TDD: test → impl) Add two cases to
      `playback-positioned-video-player.test.tsx`: firing the player's `onPlay` with a
      resumable saved position must neither pause the player nor render the overlay, and
      firing `onPlaying` must do both. The first case fails on the current component.
- [x] 2.2 (TDD: test → impl) Wire `resume.handlePlaybackStarted` to the player's
      `onPlaying` in `playback-positioned-video-player.tsx`, leaving
      `persistence.openWriteGate()` and `onPlaybackStart` on `onPlay`. Update the
      component's `@remarks` to say when the hold happens and why.
- [x] 2.3 (TDD: test → impl) Forward `onPlaying` through `LessonVideoPlayer`'s
      `Pick<ComponentProps<typeof MediaPlayer>, ...>` lifecycle prop set, and extend its
      test double coverage if the existing tests assert on that set.

## 3. The regression, end to end (Playwright)

- [x] 3.1 (TDD: test → impl) Add a YouTube-lesson resume cycle to
      `e2e/lesson-playback-resume.spec.ts`: seed a resumable position for a Basic Course
      lesson, press play, activate "Resume", and assert the player reports playing —
      not buffering — and that playback advances past the seeded position. Read state
      from the player's `data-*` attributes, since a YouTube lesson has no
      `HTMLVideoElement`. Confirm it fails against the pre-fix component before moving
      on.

## 4. Verification

- [x] 4.1 Run `pnpm verify` (typecheck, format, lint, Vitest) and fix any failure at its
      root.
- [x] 4.2 Run the touched e2e area: `pnpm test:e2e lesson-playback-resume --workers=1`
      against a running dev server via `PLAYWRIGHT_BASE_URL`.
- [x] 4.3 Drive the fixed flow in the browser with Playwright MCP on a real YouTube
      lesson — play, reload, Resume — and confirm playback advances past the saved
      position instead of buffering.

## 1. Catalog invariant — every video lesson streams from YouTube

- [x] 1.1 In `content-manifest.test.ts`, add a test over `courseManifests` asserting every `video` lesson's `source` is a `https://www.youtube.com/embed/<id>` URL, naming offending lessons; watch it fail on the 107 Advanced content keys (TDD: test → impl)
- [x] 1.2 Add a test asserting no two lessons across the catalog share an embed URL, naming both lessons; confirm it passes today and fails against a fixture with a duplicate (TDD: test → impl)
- [x] 1.3 Apply `youtube-mapping.json` to `src/content/advanced-intermediate-course.json` with a throwaway script; confirm `git diff --stat` shows only `source` lines changed (107) and 1.1 goes green (TDD: test → impl)

## 2. Publish the course — lift `draft`

- [x] 2.1 Restate "the tracked manifests" test: no tracked manifest declares itself a draft; watch it fail (TDD: test → impl)
- [x] 2.2 Restate the "drafts hidden" block: with `SHOW_DRAFT_COURSES=0` the shipped catalog serves both courses and leaves no rows behind; watch it fail (TDD: test → impl)
- [x] 2.3 Delete `"draft": true` from `src/content/advanced-intermediate-course.json`; 2.1 and 2.2 go green, and `visible-course-manifests` fixture tests still pass unchanged (TDD: test → impl)

- [x] 2.4 Restate `scripts/content-keys/content-keys.test.ts` "every key-sourced video is included" as a universal assertion — it asserted that some `.mp4` key exists, a fact about the data that no longer holds (TDD: red on the new data → test restated → green)
- [x] 2.5 Retarget `use-case-dependencies.test.ts`'s content-locations suite from a key-sourced video (none left; the file crashed at load) to a lesson's poster, which is still a content key (TDD: red on the new data → test restated → green)

## 3. Track the course's text assets

- [x] 3.1 Add `!public/local-filesystem-lesson/advanced-intermediate-course/` to `.gitignore` beside the Basic Course negation, updating the comment
- [x] 3.2 Copy the course's 212 non-video files into the worktree and confirm with `git check-ignore -v` that a `readme.md`, a PDF and a poster are addable while an `.mp4` stays ignored; `git status` lists no video

## 4. Retire the `self-hosted-content` CI quarantine

- [x] 4.1 Drop the skip from blocks that need only catalog data or text assets: `lesson-page` happy path and resource links, `course-catalog` navigation, `cinema-theme` notes tabs, `home` My learning, `one-click-navigation` (both blocks), `loading-skeletons` placeholder (:85/:97/:106) and route shells, `mobile-viewport` sweep conditional skip and 320px titles; drop the dead `.mp4` from `holdTheProvider`'s pattern
- [x] 4.2 `loading-skeletons` "WHEN the player becomes ready THEN the placeholder is retired": the ready provider is now YouTube → `skipOnCi("youtube")`
- [x] 4.3 `course-catalog` "video asset" block (native `<video>`, local `src`, byte ranges): delete — self-hosted delivery no longer exists, and `hosted-lesson-playback.spec.ts` already asserts a hosted lesson renders the YouTube provider
- [x] 4.4 `learner-progress-sync`: split the three Basic-only tests out of the quarantined block so they run on CI; rewrite "closes the tab mid-video" to drive the player through its own state (`data-can-play` / `data-playing`, seek slider position) instead of `HTMLVideoElement`, under `skipOnCi("youtube")` (TDD: run red against YouTube → rewrite → green locally)
- [x] 4.5 `lesson-playback-resume` resume cycle (12 tests): replace the `HTMLVideoElement` helpers (`videoElement`, `isPaused`, `currentTime`, `openLesson`'s `readyState` poll) with provider-agnostic reads of the Vidstack player state, move the block to `skipOnCi("youtube")`; pin `YOUTUBE_LESSON` to the Basic Course so it no longer picks Advanced "Exercise 16"; add `skipOnCi("youtube")` to the WebKit phone overlay block (TDD: run red → rewrite → green locally)
- [x] 4.6 Refresh comments that now lie: `watch-progress.spec.ts:72` (advanced dependence as an environment limit)
- [x] 4.7 Remove `"self-hosted-content"` from `skipOnCi`'s reason union and rewrite its JSDoc once no caller remains

- [x] 4.8 Repair what the quarantine was hiding, now that these blocks run on CI: `course-catalog` course/module overview assertions pointed at test ids and row styling the redesign removed (fixed to the current UI, mirroring `course-overview.spec.ts`); `mobile-viewport` "module list titles" selected rows by a class the up-next row does not carry (now by lesson title); `home` My learning raced the visit write (now waits on `lastOpenedLessonId`, as `course-overview.spec.ts` does). Each was confirmed failing on a clean `develop` baseline first
- [x] 4.9 Mark the 320px module-overview overflow `test.fixme` with its real cause — the module title sets "Pronunciation" at `text-5xl`, one word wider than the viewport, reproduced on a production build — instead of the false "missing content" skip; the layout fix is its own change

- [x] 4.10 Drop `SHOW_DRAFT_COURSES: "1"` from `.github/workflows/ci.yml`: no tracked course is a draft, so CI's e2e job now serves the same catalog production does (approved by the owner)

## 5. Verification

- [x] 5.1 Run `pnpm verify` (typecheck, format, lint, `pnpm test:run`) and fix any failure at its root cause
- [x] 5.2 Run the e2e suite and confirm the reclassified blocks pass locally and with `CI=1`: touched specs green on chromium against `next dev` and, with `CI=1`, against a production build (CI's own setup); full chromium suite against the production build green apart from the account/email specs, which need the auth server at `BETTER_AUTH_URL` and do not touch the catalog. Firefox/WebKit not run — CI runs chromium only
- [x] 5.3 In the browser (a signed-in Playwright script with screenshots, reviewed), open one lesson per module of the Advanced course with a production build (`NODE_ENV=production`, no `SHOW_DRAFT_COURSES`): the course is on the home ladder, the YouTube provider loads, the local poster paints, Notes and Resources render
- [x] 5.4 Confirm every one of the 107 embed ids is playable (oEmbed/embed check), so no video is private or embed-disabled

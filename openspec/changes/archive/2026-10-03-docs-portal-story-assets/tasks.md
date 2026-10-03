## 1. Mirror

- [x] 1.1 (TDD: test → impl) `mirrorStoryAssets(siteDir)` copies `storybook/<folder>` to `<folder>` for `videos`, `thumbnails` and `local-filesystem-lesson`, and fails naming a missing folder; add `main`
- [x] 1.2 (TDD: test → impl) The guard: every root-relative `public/` path a story names is inside a mirrored folder

## 2. Portal build

- [x] 2.1 (TDD: test → impl) In `docs-portal.test.ts`, assert `portal:story-assets` runs the script and `portal:build` ends with it; add the scripts

## 3. Verification

- [x] 3.1 `pnpm portal:build`; the three folders at the `dist/` root match their Storybook copies; Playwright MCP on `pnpm portal:preview`: `LessonView › No Resources` loads poster and video
- [x] 3.2 `pnpm verify`

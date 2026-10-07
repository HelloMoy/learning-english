## 1. Uncross the two lectures

- [x] 1.1 (TDD: test → impl) In `src/adapters/persistence/content-manifest/content-manifest.test.ts`, inside `the tracked manifests' video sources`, add a test that expects `basic-course/3-consonants/13-th-voiced` to declare `https://www.youtube.com/embed/q_rv_7mopKU` and `basic-course/3-consonants/21-ng` to declare `https://www.youtube.com/embed/jOF2i5teTfs`. Run it and watch it fail.
- [x] 1.2 (TDD: test → impl) Swap the two `source` values in `src/content/basic-course.json`, leaving every other field of both lessons untouched. Run the test and watch it pass.

## 2. Verification

- [x] 2.1 Open both lesson pages in the running app and confirm each embeds its own lecture.
- [x] 2.2 Run `pnpm verify` (typecheck, format, lint, `pnpm test:run`). No e2e applies: no browser flow changes.

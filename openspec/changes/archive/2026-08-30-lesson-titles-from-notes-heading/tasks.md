## 1. Extract the heading

- [x] 1.1 (TDD: test → impl) `notesHeading(markdown)` returns the first `# ` heading,
      trimmed. Minimal impl: a pure exported function in
      `scripts/discriminate-lesson.ts` — no file I/O, so it is testable on strings alone
      (design D3).
- [x] 1.2 (TDD: test → impl) It returns `null` when there is no `#` heading at all.
- [x] 1.3 (TDD: test → impl) It skips prose and `##` sub-headings that appear before the
      first `# ` heading, and tolerates leading blank lines and trailing whitespace.

## 2. Wire it into the classifier

- [x] 2.1 (TDD: test → impl) With `{ titleFromNotesHeading: true }`, a video lesson whose
      `readme.md` opens with `# Fast /æ/` gets that as its title. Minimal impl: add the
      options object as the third parameter (design D1) and read the heading in the video
      branch. Do NOT pass the module slug — the classifier must not know about
      allowlists.
- [x] 2.2 (TDD: test → impl) With the flag **off**, the same folder yields
      `humanize(lessonSlug)`. This is the test that protects the other nine modules; it
      must fail if the gate is ever bypassed.
- [x] 2.3 (TDD: test → impl) With the flag on and no `readme.md`, or a `readme.md` with no
      heading, the title falls back to `humanize(lessonSlug)` without raising.
- [x] 2.4 (TDD: test → impl) With the flag on and a heading of `# INTRO` against a
      slug-derived `Intro`, the title stays `Intro` (design D2).
- [x] 2.5 (TDD: test → impl) The same four behaviours hold for a reading lesson
      (design D6) — `humanize` feeds that branch too, so it needs its own coverage.

## 3. The allowlist and the call site

- [x] 3.1 (impl only) Create `scripts/title-from-notes-modules.ts` exporting the reviewed
      module list, containing exactly
      `2-advanced-vowel-pronunciation-in-american-english`. Document why the list exists
      and what adding an entry commits the author to, mirroring the tone of
      `slug-overrides.ts`.
- [x] 3.2 (impl only) At `generate-course-content-seed.ts:229`, consult the list with the
      `moduleSlug` already in scope and pass the boolean through.

## 4. Fix the content typo

- [x] 4.1 (content only) In
      `public/local-filesystem-lesson/advanced-intermediate-course/2-advanced-vowel-pronunciation-in-american-english/5-fast/readme.md`,
      correct the heading from `# ast /ɛ/` to `# Fast /ɛ/` (design D5). Change only that
      heading — the body is the learner's notes and stays as written.
      **Outcome:** applied, but it CANNOT be committed —
      `public/local-filesystem-lesson/` is gitignored (it stands in for the content
      bucket), so the edit exists only on the machine that ran the generator. The
      corrected title reaches the repo through the regenerated seed, but anyone
      regenerating from an unfixed copy of the content will reintroduce `ast /ɛ/`. The
      fix is recorded here and in the `TITLE_FROM_NOTES_MODULES` docstring; it belongs in
      the content bucket when that migration happens.

## 5. Regenerate and review the seed

- [x] 5.1 Run `pnpm generate:content-seed`, then read `git diff` on
      `seed-content.ts` and confirm **exactly 12 titles changed** and nothing else did.
      Ids, slugs, sequences, `source` and `poster` values must be byte-identical. If
      anything else moved, STOP and report it rather than committing — it would mean the
      generator is not deterministic with respect to this change (design § Risks).
      **Outcome:** the first regeneration DID move something else. The course description
      embedded an absolute path (`/Users/…/public/local-filesystem-lesson`) because the
      CLI resolves `sourceDir` — a pre-existing generator bug, not a consequence of this
      change, which made the committed seed machine-dependent. Fixed at the source by
      emitting the repo-relative path, restoring the committed value byte for byte. After
      that, a deterministic before/after parse confirmed: 107 lessons on both sides,
      identical ids, exactly 12 titles changed, all in the vowel module. The 24 changed
      title lines are those 12 lessons plus their 12 notes Resources, which are titled
      `<lesson title> Notes`. The one relocated block is the same resource (same id,
      lessonId and url) reordered because resources sort by title.
- [x] 5.2 Confirm the 12 new titles match the headings on disk, including the corrected
      `Fast /ɛ/`, and that `Intro` did NOT become `INTRO`.
- [x] 5.3 Confirm no title outside module 2 changed, by checking the diff touches only
      lessons whose module is the vowel one.

## 6. Verification

- [x] 6.1 Run `pnpm test:run` — all Vitest tests green, including the existing generator
      validation suite that checks every emitted key resolves on disk.
- [x] 6.2 Run `pnpm verify` (typecheck → format:check → lint → test:run) and fix any
      failure at its root cause, per AGENTS.md § Before finishing.
- [x] 6.3 In the browser, open the "Advanced Vowel Pronunciation In American English"
      module and confirm the reported symptom is gone: the eight rows that all read
      "Fast" now read `Fast /æ/`, `Fast /ɛ/`, `Fast /ɑ/`, `Fast /ɔ/`, `Fast /ɔɪ/`,
      `Fast /ə/`, `Fast /ɪ/`, `Fast /ʊ/`, and "Fast I" reads `Fast /i/`.
- [x] 6.4 In the browser, confirm the IPA characters render correctly in the outline
      sidebar and the episode list at the sizes actually used — narrow glyphs like `ɪ`
      and `ʊ` are where a font fallback would show up.
- [x] 6.5 In the browser, spot-check one other module (e.g. "Contractions Reductions")
      and confirm its titles are exactly as before.

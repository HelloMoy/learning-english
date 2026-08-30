## 1. Apostrophe normalization

- [x] 1.1 (TDD: test → impl) `normalizeApostrophes` maps `'` (U+0027) to `’` (U+2019).
      Assert on the code points, not the rendered glyphs — the two are near-identical in
      a diff and a test comparing visually would pass either way. Minimal impl: a pure
      exported function in `scripts/discriminate-lesson.ts`.
- [x] 1.2 (TDD: test → impl) It is idempotent on text that already uses U+2019, and
      leaves text with no apostrophes untouched.
- [x] 1.3 (TDD: test → impl) An adopted heading has its apostrophes normalized, and a
      slug-derived fallback title is unaffected (slugs never contain apostrophes).
      Minimal impl: apply it inside `lessonTitle` on the heading branch only (design D4).
- [x] 1.4 (TDD: test → impl) Nothing else is normalized: a heading with mixed case, an
      `&`, or irregular spacing around `:` comes through unchanged. This is the test that
      stops the rule from quietly growing.

## 2. The override table

- [x] 2.1 (TDD: test → impl) `lessonTitleOverride(key)` returns the entry for a known full
      slug path and `undefined` otherwise. Minimal impl: create
      `scripts/title-overrides.ts` keyed by `courseSlug/moduleSlug/lessonSlug` (design
      D3). Document that an override outranks a heading, so a `readme.md` added later
      will be ignored until the entry is removed — and give each entry a comment naming
      why it exists.
- [x] 2.2 (TDD: test → impl) Every value in the table uses `’` (U+2019) and contains no
      U+0027. Overrides are hand-written and not normalized (design D4), so this test is
      what keeps the table honest.
- [x] 2.3 (TDD: test → impl) Every key has exactly three slash-separated segments — a
      bare lesson slug like `1-intro` would match in most modules at once, which is the
      failure D3 exists to prevent.

## 3. Wire the override into the generator

- [x] 3.1 (impl only) In `generate-course-content-seed.ts`, resolve the title once right
      after `classifyLessonFolder`:
      `const title = lessonTitleOverride(...) ?? classified.title;`
      Then replace **all four** uses of `classified.title` — the lesson title and the
      `buildResource(...)` notes title, in both the video and reading branches. Missing
      one leaves the notes Resource showing the old name (design § Context, fact 1).
- [x] 3.2 (impl only) Add the override entry for
      `advanced-intermediate-course/3-contractions-reductions/6-i-d-you-d-we-d-all-the-would-contractions`
      with the value `I’d, you’d, we’d — all the WOULD contractions` (design D5), and a
      comment recording that the lesson has no `readme.md` and that the thumbnail shows a
      longer list.

## 4. Enable the module

- [x] 4.1 (impl only) Add `3-contractions-reductions` to `TITLE_FROM_NOTES_MODULES`, with
      a comment noting what its headings recover (apostrophes and the `&`) and that
      lesson 6 needed an override.

## 5. Regenerate and review the seed

- [x] 5.1 Run `pnpm generate:content-seed`, then read `git diff` on `seed-content.ts` and
      confirm **exactly 5 lesson titles changed** — four from headings, one from the
      override — plus their notes Resources. Ids, slugs, sequences, `source` and `poster`
      must be byte-identical. If anything else moved, STOP and report rather than commit.
- [x] 5.2 Confirm every new title uses `’` (U+2019) and none contains U+0027. Grep the
      diff by code point, not by eye.
- [x] 5.3 Confirm `1-intro` did NOT change, and that no title outside modules 2 and 3
      moved.
- [x] 5.4 Confirm the vowel module's titles are byte-identical to before — it is already
      allowlisted, and the new normalization must not disturb it (its headings contain no
      apostrophes, so this should hold; the check is that the rule is genuinely narrow).

## 6. Verification

- [x] 6.1 Run `pnpm test:run` — all Vitest tests green, including the generator
      validation suite that checks every emitted key resolves on disk.
- [x] 6.2 Run `pnpm verify` (typecheck → format:check → lint → test:run) and fix any
      failure at its root cause, per AGENTS.md § Before finishing.
- [x] 6.3 In the browser, open "Contractions Reductions" and confirm all six rows read
      correctly: `Intro`, `Why Contractions & Reductions are important`, the three
      contraction lists with apostrophes, and lesson 6's overridden title.
- [x] 6.4 In the browser, confirm the apostrophes render as `’` and not as a fallback box
      or a straight quote, at the sizes the outline and episode list actually use.
- [x] 6.5 In the browser, spot-check the vowel module and one un-allowlisted module (e.g.
      "Key Sound Patterns And Features") and confirm neither moved.

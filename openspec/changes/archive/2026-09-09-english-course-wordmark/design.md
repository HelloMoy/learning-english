## Context

`Brand` (`src/components/brand/brand.tsx`) renders the wordmark as literal JSX:
`LEARN` + a gold middle dot + `ENGLISH`, uppercase, extrabold, letter-spaced,
stepping from `13px`/`0.18em` to `17px`/`0.28em` at `sm`. Its JSDoc records why
those two steps exist: the mark contains no spaces, so it cannot wrap, and at
the full desktop size it measured 203px — too much of a 320px viewport once the
locale switcher and theme toggle are seated beside it. The stepped-down mobile
size measured 139px, which fit the budget set by the `responsive-viewport-fit`
work.

`ENGLISH·COURSE` is one character longer than `LEARN·ENGLISH`. Naïvely scaled,
the mobile mark lands near 150px and the desktop mark near 218px — but character
widths in Geist are not uniform (the removed `L`, `A`, `R`, `N` and the added
`C`, `O`, `U`, `R`, `S`, `E` are not a wash), so the real number has to come from
a browser, not from arithmetic.

The header row already carries `min-w-0 shrink overflow-hidden` on the brand
group. That was added to stop the document scrolling sideways on phones, and it
works — but it converts an overflow into a **silently clipped wordmark**. That
failure mode matters for how this change is tested.

## Goals / Non-Goals

**Goals:**

- The visible wordmark reads `ENGLISH·COURSE`, keeping the Immersion Cinema
  typographic form intact.
- The mark is fully legible — not clipped, not overflowing — at 320px in `en`,
  `es` and `pt`, with both header controls still fully on screen and still
  offering 44×44 hit areas.
- The `Brand` JSDoc states a width that was actually measured for the new mark,
  so the next person tuning this header is working from fact.
- Every assertion and doc comment naming the old mark moves with it, leaving no
  reference to `LEARN·ENGLISH` anywhere in the repo.

**Non-Goals:**

- The social-sharing metadata that motivated the rename (`og:site_name`,
  manifest, OG images, icons). Separate changes.
- Any logo or icon artwork.
- Renaming the package, the repository, content keys, or the
  `learning-english:playback:*` localStorage prefix.
- Revisiting the palette, the `IMMERSION CINEMA` eyebrow, or the header's
  shedding order.

## Decisions

### D1 — The wordmark stays literal JSX, not a message key

`ENGLISH·COURSE` is a brand mark, not copy. Keeping it in the component means
there is exactly one place it is defined and no way for a locale to disagree
with another about it.

*Alternative considered:* move it to `Components.Brand.wordmark` in
`src/messages/{en,es,pt}.json`, which is where the project's i18n rule sends
user-facing strings. Rejected: the rule exists so that text a learner reads in
their language gets translated, and this text must be identical in all three. A
message key would invite a translator to localize it, and would spread one
immutable value across three files that could drift. The spec now states the
non-translation explicitly so the exception is recorded rather than assumed.

### D2 — Measure first, retune only if it overflows

The implementation renders `ENGLISH·COURSE` at the current type scale, measures
it at 320px in a real browser, and only then decides whether anything else moves.
Preemptively shrinking the type would be tuning against a guess.

If it does overflow, the retune order preserves the design longest:

1. Reduce mobile tracking (`0.18em` → `0.16em` → `0.14em`). Letter-spacing is
   the cheapest pixel in a letter-spaced mark and the last thing a reader
   notices.
2. Only then reduce the mobile font size (`13px` → `12px`).

Desktop (`sm` and up) is not expected to move — 218px inside a `640px+` viewport
alongside two chips is comfortable — but it is measured too rather than assumed.

### D3 — Width is asserted in Playwright, never in Vitest

jsdom has no layout engine: `getBoundingClientRect()` returns zeros, and
`offsetWidth` is always `0`. A unit test asserting the mark's pixel width would
pass unconditionally and prove nothing. So the split is:

- **Vitest + RTL** owns what the mark *is* — its text, that it is a link, its
  accessible name, its `href`.
- **Playwright** owns what the mark *measures* — that it is inside the viewport
  at 320px, in each locale.

### D4 — The e2e guard asserts geometry, not visibility

`expect(locator).toBeVisible()` passes on an element whose right half is clipped
by an `overflow-hidden` ancestor — the element has a non-zero box and is not
`display:none`. Given that the header deliberately clips rather than scrolls
(see Context), a visibility assertion is exactly the assertion that cannot
detect this change's most likely regression.

The new scenario therefore reads the wordmark's bounding box and asserts its
right edge is within the viewport width, and that the document's
`scrollWidth` has not exceeded its `clientWidth`. It mirrors the geometry
assertions the `responsive-viewport-fit` e2e work already established.

### D5 — The rename stops at what a learner reads

`learning-english:playback:{lessonId}` stays. Every learner who has watched
anything has positions saved under that prefix; renaming it would silently
orphan all of them to make an invisible string match a visible one. Same
reasoning for the package name and the repository — identifiers are not brand.

## Risks / Trade-offs

- **The longer mark clips at 320px in one locale but not the others** → The
  wordmark itself is locale-invariant (D1), so it cannot differ by locale; what
  differs is the space left over by `LocaleSwitcher`, which shows `EN`/`ES`/`PT`
  — all two characters. The risk is low, but the e2e scenario runs all three
  rather than reasoning about it.
- **Retuning tracking weakens the Immersion Cinema look** → Bounded by D2's
  order: tracking moves in small steps before size does, and desktop is
  untouched, so the mark a desktop reader sees is unchanged. If both steps are
  exhausted and it still does not fit, that is a finding to report, not a reason
  to drop the eyebrow or shrink the controls — the spec fixes the shedding order
  and the 44×44 hit areas.
- **A stale `LEARN·ENGLISH` survives somewhere** → A repo-wide grep for both
  `LEARN·ENGLISH` and the `/learn.*english/i` matcher shape is an explicit task,
  run again before the change is declared done. Note that `learning-english`
  (the package/storage prefix) will match a loose grep and is deliberately
  **not** a hit.
- **Storybook and the e2e suite disagree about the brand for one commit** → The
  rename and its assertions land together in the same change; there is no
  intermediate state where the component and its tests differ.

## Testing strategy

Red first on every task, per the project's TDD rule.

| Layer | File | Covers |
| --- | --- | --- |
| Vitest + RTL | `src/components/brand/brand.test.tsx` | The mark renders `ENGLISH·COURSE`; it is a `link`; its accessible name matches `/english.*course/i`; `href` defaults to `/` and honours a custom value. Mirrors the two tests already in that file, with the matcher moved. |
| Vitest + RTL | `src/components/site-header/site-header.test.tsx` | Existing header tests keep passing unchanged — the header composes `Brand` and does not restate its text. No new unit test here; width is not observable in jsdom (D3). |
| Playwright | `e2e/cinema-theme.spec.ts` | The existing chrome test's accessible-name matcher moves to `/english.*course/i`. A new scenario at 320px, parameterized over `en`/`es`/`pt`, asserts the wordmark's bounding box lies within the viewport and the document contributes no horizontal scroll (D4). |
| Storybook | `src/components/brand/brand.stories.tsx`, `src/components/site-header/site-header.stories.tsx` | The header's existing narrow-viewport story is the visual reference; no new story is needed for a text change, but both are opened during the visual check below. |
| Visual (Playwright MCP) | — | The header is driven in a real browser at 320px, 375px and desktop, in all three locales, in both themes, and the measured mobile width is recorded in the `Brand` JSDoc. Required by the project rule that UI work is verified in the browser, not handed back. |

`pnpm verify` (typecheck, format, lint, Vitest) must pass before the change is
done; the Playwright suite is run separately against a dev server per the
project's e2e notes.

## Open Questions

None blocking. The one unknown — the new mark's measured width at 320px — is
resolved by the first implementation task rather than by discussion.

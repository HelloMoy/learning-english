## Why

The site is about to publish a brand name to the outside world: it deploys to
`english-course.online`, and the social-sharing metadata that follows this
change (`og:site_name`, the PWA manifest `name`, the generated Open Graph
images) all need one answer to "what is this called". The header currently
answers `LEARN·ENGLISH`. Shipping the metadata first would leave a learner
reading one name in the browser tab, the bookmark and the WhatsApp preview, and
a different one in the header of the page they are looking at.

The name is settled — **English Course**. The wordmark is the only place the old
one is still visible, so it moves first and the metadata work builds on top of a
brand that already agrees with itself.

## What Changes

- The `Brand` wordmark renders `ENGLISH·COURSE` instead of `LEARN·ENGLISH`. The
  Immersion Cinema typographic form is unchanged: two words, no space to wrap
  at, the middle dot in the gold accent, uppercase, letter-spaced, stepping down
  a type size below `sm`.
- The mark grows by one character, so the phone-width budget it was tuned
  against is re-measured in a real browser and the `Brand` JSDoc restates the
  measured width rather than the stale `139px`. If `ENGLISH·COURSE` no longer
  fits a 320px viewport beside the locale and theme controls, the type scale or
  tracking below `sm` is retuned until it does — the wordmark is never the
  element that gets dropped or clipped.
- Every place that asserts on the old name follows: the two `Brand` unit tests
  matching `/learn.*english/i`, the `cinema-theme.spec.ts` end-to-end assertion,
  and the `LEARN·ENGLISH` mentions in the `Brand` and `SiteHeader` JSDoc.
- The `cinema-home` requirement that names the wordmark literally — twice, once
  in the header requirement and once in the 320px scenario — is updated to the
  new name.

## Capabilities

### New Capabilities

None. This changes the value of an existing requirement, not the set of things
the product does.

### Modified Capabilities

- `cinema-home`: the "Global header shows brand and section chrome" requirement
  names the wordmark literally (`the LEARN·ENGLISH wordmark`), and its "The
  wordmark survives the narrowest width" scenario names it again. Both become
  `ENGLISH·COURSE`. No other clause of that requirement moves — the shedding
  order, the accessible-name rules and the 44×44 hit areas are untouched.

`cinema-theme-tokens` is deliberately **not** listed. It requires that a `Brand`
primitive exist and be accessible; it never states what the mark reads. The
requirement is satisfied identically before and after.

## Impact

**Source**

- `src/components/brand/brand.tsx` — the rendered text, and the JSDoc's measured
  width and tracking rationale
- `src/components/brand/brand.test.tsx` — both accessible-name matchers
- `src/components/site-header/site-header.tsx` — JSDoc naming the wordmark
- `e2e/cinema-theme.spec.ts` — the `getByRole("link", { name: … })` matcher

**Spec**

- `openspec/specs/cinema-home/spec.md` via this change's delta

**Not touched, and deliberately so**

- No message file changes. The wordmark is a fixed brand mark rendered as
  literal JSX, not localized copy — it reads the same in `en`, `es` and `pt`,
  and the `SiteHeader.tagline` (`Immersion Cinema`) is a separate string that
  stays as it is.
- No storage key changes. Playback positions live under
  `learning-english:playback:{lessonId}`; renaming that prefix would orphan
  every saved position on every learner's device for a cosmetic gain.

## Non-goals

- **The social-sharing metadata itself.** `metadataBase`, canonical and
  hreflang, Open Graph, Twitter Cards, icons, the PWA manifest, `robots.ts`,
  `sitemap.ts` and JSON-LD are the following changes. This one exists so those
  have a brand name to publish that matches the screen.
- **A logo or icon mark.** The wordmark is type, not artwork. Designing an app
  icon belongs to the metadata work that needs one.
- **The `IMMERSION CINEMA` section eyebrow**, the design tokens, and the palette.
  The visual language is not being revisited.
- **Renaming the repository, the package, the localStorage prefix, or any
  content key.** The brand a learner reads and the identifiers the code uses are
  separate concerns, and only the first one is changing.
- **Locale-specific wordmarks.** `ENGLISH·COURSE` renders identically in every
  supported locale.

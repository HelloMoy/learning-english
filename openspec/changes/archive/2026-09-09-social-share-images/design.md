## Context

`shareMetadata` already composes every route's head and deliberately omits
`og:image`. Its input carries locale, href, title, description and an optional
duration — the same data a card needs, which is why the image work lands as an
addition to an existing seam rather than a new one.

Four `generateMetadata` functions already resolve their route's data through
cached use cases. `next/og` image routes are *separate* modules with their own
`params`, so each will resolve the same data again. React `cache` does not span
two requests, so an image route pays for its own use-case call — cheap here,
since these resolve from an in-memory catalog.

The brand assets exist after `site-metadata-foundation`: the interpunct mark,
the cinema tokens, and Geist as the app's typeface.

## Goals / Non-Goals

**Goals:**

- One card design, four compositions, three locales, generated from real data.
- A headline that says what the reader would learn, not what the row is called.
- Draft courses stay withheld through the image route too.

**Non-Goals:**

- Lesson posters as share images, per-lesson custom artwork, an authoring UI,
  and `search-discoverability`'s robots/sitemap/JSON-LD.

## Decisions

### D1 — The headline is the description's opening clause, not the course title

`Basic Course` names a row. `American pronunciation from the ground up` tells a
reader what they would get. On X, where the card is now image-only, that
difference is the entire message.

The phrase is taken from the course's own `description` in the manifest, cut at
its first `:` or `.` — `American pronunciation from the ground up: vowel and
consonant sounds, …` yields `American pronunciation from the ground up`. The
catalog name moves to the supporting line, which still identifies the course for
someone who knows it.

*Alternative considered:* a new `shareHeadline` field per course in the content
manifest. Rejected for now — it makes every course's card depend on someone
remembering to write a second description, and the descriptions already open
with exactly the phrase wanted. If a course's description opens badly, editing
that description is the fix, and it improves the course page too.

The derivation is a pure function with its own unit test, because "cut at the
first colon" has edge cases — no colon, a colon inside a number, a description
shorter than the cut — that must degrade to the whole string rather than to an
empty headline.

### D2 — One `ShareCard` component, four thin routes

Each `opengraph-image.tsx` resolves its data and returns
`new ImageResponse(<ShareCard … />)`. Everything visual lives in `ShareCard`.

Four routes each hand-rolling a layout is how the lesson card ends up with a
different wordmark position from the course card, and nobody notices, because
nobody looks at a sharing image unless they go looking.

### D3 — `next/og` constraints shape the card, so state them up front

`ImageResponse` uses Satori, not a browser. It supports flexbox and absolute
positioning, **not** CSS grid; it needs explicit `display: "flex"` on any
multi-child element; it resolves no CSS variables, so the cinema tokens are
written as literal hex; and fonts must be passed as `ArrayBuffer`, not linked.

Geist is loaded from the installed `geist` package's font files at module scope
and reused, rather than fetched per request.

### D4 — The image is declared relative, and Next absolutizes it

`shareMetadata` gains an image declaration pointing at the route's own
`opengraph-image`. It stays relative: `metadataBase`, set in the layout by
`site-metadata-foundation`, is what makes it absolute, so the origin still has
exactly one home.

### D5 — Draft courses fail the image route the same way they fail the page

The image routes resolve through the same use cases as the pages, and those
already withhold a draft course in production. So the protection is inherited
rather than re-implemented — but it is asserted explicitly, because an image
route that quietly rendered a withheld course's title would be a disclosure with
no visible symptom.

## Risks / Trade-offs

- **An image route is a per-request render** → Next caches the response, and the
  data comes from an in-memory catalog. If it ever becomes a cost, these are
  static-generatable; not worth pre-optimising.
- **Satori silently drops unsupported CSS** → It fails by rendering something
  slightly wrong, not by throwing. Mitigated by reviewing all four cards as
  actual PNGs in a browser, in all three locales, rather than trusting the code.
- **The headline derivation is content-dependent** → A course whose description
  has no colon gets the whole description, which may be long. The card's type
  scale must survive a headline three times the expected length; the review pass
  checks the longest real description in the catalog.
- **`geist` may not expose raw font files at a stable path** → If it does not,
  the fallback is to read the woff from `node_modules` explicitly or vendor the
  two weights used. Resolved in task 1, before anything depends on it.

## Testing strategy

| Layer | File | Covers |
| --- | --- | --- |
| Vitest unit | `src/lib/share-headline/share-headline.test.ts` | The derivation: cuts at the first colon; cuts at a sentence end when there is no colon; returns the whole string when there is neither; never returns empty for a non-empty description; trims. Faker for the tail, hardcoded openings, since the cut points are what is under test. |
| Vitest unit | `src/lib/share-metadata/share-metadata.test.ts` | Extended: the returned object now declares `openGraph.images` and `twitter.images` at 1200×630 with the alt text passed in — inverting the current "no images" assertion. |
| Vitest unit | `src/messages/messages.test.ts` | Inherits key parity for `Metadata.imageAlt` from the existing flattening test; no new code. |
| Playwright e2e | `e2e/share-metadata.spec.ts` | The `og:image` absence assertion inverts to presence with dimensions and alt. Each of the four image routes returns 200 and `image/png`. A withheld course's image route does not render its title. |
| Visual (Playwright) | — | All four cards fetched as real PNGs at 1200×630, in `en`/`es`/`pt`, reviewed here — including the course with the longest description in the catalog. This is the only check that catches Satori dropping a style. |

## Open Questions

None. The headline source is settled by D1; if a specific course reads badly the
fix is that course's description.

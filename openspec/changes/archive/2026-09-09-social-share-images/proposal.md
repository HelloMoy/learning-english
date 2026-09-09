## Why

`site-metadata-foundation` gave every route a title, a description, a canonical
and a Twitter card declared as `summary_large_image` — with no image. That was
deliberate: a broken image URL previews worse than none, and the images did not
exist yet. This change supplies them.

The gap it closes is not cosmetic. On X the card renders **only** the image —
title and description stopped appearing in the feed — so a link to a course
currently shows a bare domain. In WhatsApp, Slack and LinkedIn the image is the
element the eye lands on before any text is read.

155 lessons × 3 locales is 465 combinations, plus courses and modules. No static
artwork covers that, so the images are generated per route from the catalog's
own data.

## What Changes

- **A generated Open Graph image per route kind**: home, course, module and
  lesson, each at 1200×630, rendered by `next/og` from the route's real data and
  the active locale. Twitter reuses the same image.
- **The card's design is the app's own.** The Immersion Cinema ground
  (`#08080b`), the double radial gold glow copied from `CinemaBackground`, the
  letterbox scrim, the `ENGLISH·COURSE` wordmark with its gold interpunct, and
  the Geist type the app already loads.
- **The headline is the descriptive phrase, not the catalog name.** A course
  card leads with the opening clause of the course's own description — `American
  pronunciation from the ground up` — rather than `Basic Course`, which names a
  row in a database and tells a reader nothing. The catalog name moves to the
  supporting line, where it identifies without dominating.
- **`og:image` and `twitter:image` are declared** with width, height and
  localized alt text, which `shareMetadata` currently omits.
- **`Metadata.imageAlt`** is added to the three message catalogues — the key
  deliberately deferred from the previous change until an image existed to
  describe.
- **Draft courses generate no image.** A course withheld from the catalog in
  production returns its not-found state, and its image route must not become a
  side channel that renders its title anyway.

## Capabilities

### New Capabilities

None. This completes a capability rather than introducing one.

### Modified Capabilities

- `site-metadata`: the requirement that `og:image` be omitted until a real image
  exists is replaced by its opposite — every route now serves one, and declares
  it with dimensions and alt text. The requirement covering localized sharing
  copy gains the image's alt text.

## Impact

**New source**

- `src/components/share-card/share-card.tsx` — the card's layout and art, shared
  by every image route so the four cannot drift apart
- `src/app/[locale]/opengraph-image.tsx` and the course, module and lesson
  equivalents
- `src/lib/share-card-fonts/share-card-fonts.ts` — loads Geist as an
  `ArrayBuffer`, which `ImageResponse` requires

**Modified source**

- `src/lib/share-metadata/share-metadata.ts` — declares `og:image` and
  `twitter:image`
- `src/messages/{en,es,pt}.json` — `Metadata.imageAlt`
- `e2e/share-metadata.spec.ts` — the assertion that `og:image` is absent inverts

## Non-goals

- **Using a lesson's `poster` as the card.** They are video frames with burnt-in
  text and arbitrary framing; cropped to 1.91:1 they lose their subject and
  carry no brand. They remain the lesson page's poster, not its share image.
- **`robots.ts`, `sitemap.ts` and JSON-LD** — `search-discoverability`.
- **Per-lesson custom artwork** or any authoring UI for it.
- **Rewriting course descriptions.** The headline is derived from the
  description the manifest already carries. If a course's description opens
  badly, that is a content edit under its own change, not a reason to add a
  parallel "share headline" field to the manifest.

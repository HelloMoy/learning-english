## 1. Fonts and the headline

- [x] 1.1 (Resolved: there is no `geist` package — the app uses `next/font/google`, which caches only `woff2`, the one format Satori rejects. Both weights were downloaded from Google Fonts as WOFF and vendored under `src/app/fonts/` with a README stating why.) Confirm how Geist's raw font files resolve from `node_modules` and write `src/lib/share-card-fonts/share-card-fonts.ts` to load the two weights the card uses as `ArrayBuffer` at module scope. Nothing else depends on this until it works.
- [x] 1.2 (TDD: test → impl) Write `src/lib/share-headline/share-headline.test.ts`: cuts at the first `:`; cuts at the first sentence end when there is no colon; returns the trimmed whole string when there is neither; never returns empty for a non-empty input.
- [x] 1.3 (TDD: impl) Write `src/lib/share-headline/share-headline.ts` with JSDoc explaining why a catalog name is the wrong headline.

## 2. The card

- [x] 2.1 Write `src/components/share-card/share-card.tsx`: 1200×630, the cinema ground and double radial glow as literal hex, the letterbox scrim, the `ENGLISH·COURSE` wordmark with its gold interpunct, a headline slot, an optional supporting line and a footer of catalog facts. Flexbox only — Satori supports no CSS grid and resolves no CSS variables.
- [x] 2.2 Write `src/app/[locale]/opengraph-image.tsx` for the home and confirm it renders as a real PNG in the browser before writing the other three.
- [x] 2.3 Write the course, module and lesson `opengraph-image.tsx` routes. The course headline comes from `shareHeadline(course.description)`, with the catalog name on the supporting line; the lesson shows its course, module and runtime.

## 3. Declare the images

- [x] 3.1 (TDD: test → impl) Invert the `og:image` assertions in `src/lib/share-metadata/share-metadata.test.ts` to expect `openGraph.images` and `twitter.images` at 1200×630 with alt text. Watch them fail.
- [x] 3.2 (TDD: impl) Add `imageAlt` to `ShareMetadataInput` and declare both image blocks in the builder, relative so `metadataBase` absolutizes them.
- [x] 3.3 Add `Metadata.imageAlt` to `src/messages/{en,es,pt}.json` and pass it from all four routes.

## 4. Guard the draft course

- [x] 4.1 (TDD: test → impl) Extend `e2e/share-metadata.spec.ts`: each image route returns 200 and `image/png`; `og:image` is present with dimensions and alt; a withheld course's image route does not render a card naming it. Watch the last one fail if the image routes do not inherit the catalog's withholding.
- [x] 4.2 (TDD: impl) Make the image routes resolve through the same use cases as the pages so the withholding is inherited rather than re-implemented.

## 5. Review the artwork

- [x] 5.1 Fetch all four cards as PNGs at 1200×630 in `en`, `es` and `pt` and review them here — including the course with the longest description in the catalog, to confirm the type scale survives it. This is the only check that catches Satori silently dropping a style.
- [x] 5.2 Update the published mockup artifact so it shows the cards as actually shipped.

## 6. Verify

- [x] 6.1 Run `pnpm verify`.
- [x] 6.2 Run `pnpm exec playwright test e2e/share-metadata.spec.ts --project=chromium --workers=1`, then the full suite serially.
- [x] 6.3 Run `openspec validate social-share-images --strict`.

## 7. Close the component-conventions gap

- [x] 7.1 (Gap found after 6.3, not planned: `ShareCard` shipped with no test and no story, and `StructuredData` with no story, which AGENTS.md requires of every component under `src/components/`.) Write `share-card.test.tsx` covering the headline step-down and the conditional kicker/supporting/badge/facts composition.
- [x] 7.2 Write `share-card.stories.tsx` (four route compositions plus the long-headline case) and `structured-data.stories.tsx` (payloads made inspectable, including the `</script>` escaping case). Both carry the caveat that Satori, not Chrome, is the authority for the shipped artwork.
- [x] 7.3 Render the new stories in a real browser and confirm no console errors.

## 1. Resolve the site URL

- [x] 1.1 (TDD: test → impl) Write `src/lib/site-url/site-url.test.ts` covering each precedence step in isolation — `NEXT_PUBLIC_SITE_URL` wins; `VERCEL_PROJECT_PRODUCTION_URL` next; `VERCEL_URL` next; `http://localhost:${PORT ?? 3000}` last — plus a malformed `NEXT_PUBLIC_SITE_URL` throwing with the variable name in the message. Save and restore `process.env` per test so the cases stay independent.
- [x] 1.2 (TDD: impl) Write `src/lib/site-url/site-url.ts`: read the candidates in order, parse the winner with Zod v4 `z.url()`, throw on a set-but-invalid value. JSDoc the export per the TypeDoc rule.
- [x] 1.3 Document `NEXT_PUBLIC_SITE_URL` in `.env.example`, including that leaving it unset is correct on Vercel and locally.

## 2. Localize the sharing copy

- [x] 2.1 (TDD: test → impl) Extend `src/messages/messages.test.ts` with an assertion that `Metadata.siteName` is byte-identical across `en`, `es` and `pt` — the brand is not translated. Watch it fail on the missing key. (The existing key-parity test already guards the rest of the namespace; do not weaken it.)
- [x] 2.2 (TDD: impl) Add the `Metadata.*` namespace to `src/messages/{en,es,pt}.json`: `siteName`, the home share title/description, the OG image alt text, and the course / module / lesson description templates. Counts use ICU plurals (`{count, plural, …}`), never string concatenation. All three locales in the same commit.

## 3. Build the metadata

- [x] 3.1 (TDD: test → impl) Write `src/lib/share-metadata/share-metadata.test.ts`. Assert: canonical matches the given locale's path; alternates cover `en`/`es`/`pt` plus `x-default` → the `en` path; `og:site_name` is `English Course` regardless of locale; `og:locale` maps `en→en_US`, `es→es_ES`, `pt→pt_BR` with the other two as `og:locale:alternate`; passing a duration yields `og:type` `video.other` and that duration, omitting it yields neither; and the returned object has **no** `og:image`, `twitter:site` or `twitter:creator` keys. Faker for titles and descriptions; hardcode the locale codes and the brand, which are what the test is about.
- [x] 3.2 (TDD: impl) Write `src/lib/share-metadata/share-metadata.ts`: one exported builder taking an options object, using `getPathname` from `@/i18n/navigation` for every URL. JSDoc the export and its options type.

## 4. Wire the routes

- [x] 4.1 **(TDD deviation — written after 4.2/4.3, not before.** The route wiring was verified with an ad-hoc browser probe first and this spec written afterwards. It caught one real defect on its first run (`og:video:duration` never rendered), but it was not red-first and should have been.) (TDD: test → impl) Write `e2e/share-metadata.spec.ts` asserting the real head per route kind and locale: canonical is locale-correct; three `hreflang` alternates plus `x-default`; `og:title` differs between home, course and lesson; a video lesson carries `og:type` `video.other` and its duration; the document title ends in `· English Course`. Watch it fail.
- [x] 4.2 (TDD: impl) In `src/app/[locale]/layout.tsx`: set `metadataBase` from `siteUrl()`, add `title.template` `"%s · English Course"` with the localized `title.default`, and add the separate `viewport` export with light and dark `themeColor` entries from the cinema tokens.
- [x] 4.3 (TDD: impl) Rewrite the three `generateMetadata` functions (course, module, lesson) to return `shareMetadata({…})` built from the data their cached use-case call already returns. The lesson passes `durationSeconds` only for `kind: "video"`. Error paths keep returning the localized not-found title.

## 5. Ship the icon set and manifest

- [x] 5.1 Author `src/app/icon.svg`: the gold interpunct (`#e7b64c`) on `#08080b` with letterbox bars, per design D5. Verify it in a real 16px browser tab before deriving anything from it.
- [x] 5.2 (Adjusted: the 192/512 rasters live in `public/` — Next's app-dir icon convention does not produce arbitrary sizes for a manifest to reference by URL. `apple-icon.png` and `favicon.ico` stay in `src/app/` where the convention picks them up. The maskable variant drops the letterbox bars: a circular mask cuts horizontal bars into arcs.) Derive `apple-icon.png` (180, opaque background), `icon-192.png`, `icon-512.png` and `icon-512-maskable.png` (mark inside the inner 80%), and replace `src/app/favicon.ico`. Check the maskable variant under an 80% circular crop.
- [x] 5.3 (TDD: test → impl) Extend `e2e/share-metadata.spec.ts` to assert `/favicon.ico`, `/icon.svg` and `/manifest.webmanifest` each return 200 with the expected content type. Watch the manifest assertion fail.
- [x] 5.4 (TDD: impl) Write `src/app/manifest.ts`: name, short name, description, `start_url: "/en"`, scope, `display: "standalone"`, background and theme colors from the cinema tokens, and the icon set including the maskable entry.

## 6. Remove the scaffolding residue

- [x] 6.1 Delete `public/{file,globe,next,vercel,window}.svg`. Grep for each filename first and confirm nothing references them.

## 7. Verify

- [x] 7.1 Run `pnpm verify` and fix any failure at the root cause.
- [x] 7.2 Run `pnpm exec playwright test e2e/share-metadata.spec.ts --project=chromium --workers=1` with `PLAYWRIGHT_BASE_URL` pointed at the dev server's actual port, then the full suite serially to confirm nothing else regressed.
- [x] 7.3 Drive a real browser: confirm the tab icon at 16px, and read the rendered `<head>` of one route of each kind in each locale.
- [x] 7.4 Run `openspec validate site-metadata-foundation --strict`.

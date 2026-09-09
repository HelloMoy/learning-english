## Why

Every page of the site publishes the same two tags. Verified in Chromium against
the running dev server, the complete `<head>` of the home is:

```html
<meta name="description" content="A simple, focused space to build vocabulary…">
<link rel="icon" href="/favicon.ico?…" sizes="256x256">
```

That is the whole of it. No `og:*`, no `twitter:*`, no `canonical`, no
`alternate`, no `theme-color`, no manifest, and a favicon that is still
`create-next-app`'s default. Two consequences:

1. **Sharing a link produces nothing usable.** A course URL pasted into WhatsApp,
   LinkedIn, Slack or Discord shows no image and the home page's title and
   description — the same text for the home, both courses, all 15 modules and
   all 155 lessons.
2. **Three locales compete with each other.** `localePrefix: "always"` means
   `/en/…`, `/es/…` and `/pt/…` are three URLs for equivalent content, with no
   `canonical` or `hreflang` telling a crawler how they relate.

The site deploys to `english-course.online` under the brand **English Course**,
which the header now carries after `english-course-wordmark`. This change makes
the metadata say the same thing the screen does.

## What Changes

- **A resolved site URL.** A single `siteUrl()` helper resolves, in order:
  `NEXT_PUBLIC_SITE_URL`, `https://${VERCEL_PROJECT_PRODUCTION_URL}`,
  `https://${VERCEL_URL}`, `http://localhost:${PORT ?? 3000}`. Validated with
  Zod; an unparseable value fails loudly rather than silently producing relative
  Open Graph URLs. Feeds `metadataBase`, and later the sitemap and JSON-LD.
- **A title template.** `title.template` = `"%s · English Course"` with
  `title.default` = the localized home title, so a lesson tab reads
  `Introduction · English Course` instead of a bare `Introduction`.
- **Canonical and hreflang on every route.** `alternates.canonical` for the
  current locale plus `alternates.languages` for `en`, `es`, `pt` and
  `x-default` → `/en`, built with `getPathname` from `@/i18n/navigation` so the
  URLs come from the routing config rather than string concatenation.
- **Open Graph on every route.** `og:title`, `og:description`, `og:url`,
  `og:site_name`, `og:locale` + `og:locale:alternate`, `og:type`. Lessons of
  kind `video` additionally emit `og:type: video.other` with `og:video:duration`
  from the manifest's `durationSeconds`.
- **Twitter Cards on every route.** `summary_large_image` with title,
  description and image alt. `twitter:site` and `twitter:creator` are omitted —
  there is no account, and empty handles carry no information.
- **Localized sharing copy.** A `Metadata.*` namespace in each of
  `src/messages/{en,es,pt}.json` carrying the brand name, the home share
  description, and the templates that compose a course, module and lesson
  description from real catalog values (module count, lesson count). No English
  string is left to be translated later. The sharing image's alt text is not
  here — it ships with the image, in `social-share-images`.
- **An icon set replacing the default favicon.** The mark is the wordmark's gold
  interpunct on the Immersion Cinema ground, framed by letterbox bars — the one
  form that survives a 16px browser tab. Shipped as `icon.svg`,
  `apple-icon.png` (180, opaque — iOS ignores transparency), `icon-192.png`,
  `icon-512.png`, `icon-512-maskable.png` (80% safe zone) and a real
  `favicon.ico`, which Next cannot generate from code.
- **A web app manifest** at `src/app/manifest.ts` with name, short name,
  description, `start_url: "/en"` (forced by `localePrefix: "always"`), scope,
  `display: standalone`, background and theme colors from the cinema tokens, and
  the icon set. Plus a `viewport` export with `themeColor` in light and dark
  variants.
- **Removal of the `create-next-app` residue** in `public/`: `file.svg`,
  `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`. Nothing imports them.

## Capabilities

### New Capabilities

- `site-metadata`: what the application publishes about itself to crawlers,
  social platforms and operating systems — the resolved site URL, canonical and
  hreflang relations, Open Graph and Twitter Card tags per route kind, the
  localized sharing copy, the icon set, and the web app manifest.

### Modified Capabilities

- `lesson-view-polish`: its "The Lesson Page sets a per-page `<title>`"
  requirement fixes the title to exactly the lesson title (and exactly
  `HomePage.title` on the home). The title template appends the brand to both,
  so that requirement changes. **This was missed when the proposal was first
  written and caught by two failing end-to-end tests during implementation** —
  the delta is the correction, not an afterthought.

`cinema-home` is not modified: it governs what the header renders, not what the
document head declares. `course-content-storage` is read from, not changed —
`durationSeconds` and the catalog shape are consumed as they already exist.

## Impact

**New source**

- `src/lib/site-url/site-url.ts` — the resolver and its Zod schema
- `src/lib/share-metadata/share-metadata.ts` — builds a `Metadata` object from a
  route's localized copy, its canonical path and its alternates
- `src/app/manifest.ts`
- `src/app/icon.svg`, `apple-icon.png`, `icon-192.png`, `icon-512.png`,
  `icon-512-maskable.png`, and a replaced `favicon.ico`

**Modified source**

- `src/app/[locale]/layout.tsx` — `metadataBase`, title template, viewport export
- the four `generateMetadata` functions (home, course, module, lesson), which
  today return `{ title }` and will return the full object
- `src/messages/{en,es,pt}.json` — the new `Metadata.*` namespace
- `.env.example` — documents `NEXT_PUBLIC_SITE_URL`

**Deleted**

- `public/{file,globe,next,vercel,window}.svg`

## Non-goals

- **Generated Open Graph images.** `opengraph-image.tsx` and the `next/og`
  artwork are the following change (`social-share-images`). This change declares
  the tags and the alt text; the image they point at arrives next. Until it
  does, `og:image` is omitted rather than pointed at a placeholder — a broken
  image URL previews worse than none.
- **`robots.ts`, `sitemap.ts` and JSON-LD.** They need the catalog and the draft
  visibility rules, and belong with `search-discoverability`.
- **Search Console verification tokens.** No property exists yet.
- **A service worker or offline support.** The app streams video from a content
  store; a service worker cannot cache that and would only add an invalidation
  layer to get wrong. The manifest is for the icon, the splash and the theme
  color.
- **Per-locale manifests.** One manifest with `start_url: "/en"` ships now.
  Negotiating the install locale is a real feature, not a detail of this one.
- **Changing `HomePage.title`.** It stays `Learn English` / `Aprende inglés` /
  `Aprenda inglês` — the localized page title. `og:site_name` is the brand,
  `English Course`, and it is correct for the two to differ.

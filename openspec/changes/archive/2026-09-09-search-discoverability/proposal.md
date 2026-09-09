## Why

The site now describes itself to anyone who shares a link. It still tells search
engines nothing:

- **No `robots.txt`.** Every Vercel preview deployment is indexable, and each is
  a byte-for-byte duplicate of production under a different hostname.
- **No `sitemap.xml`.** 155 lessons across 15 modules and 3 locales sit behind
  navigation a crawler has to walk to find, and the locale alternates the pages
  declare are not restated where a crawler looks for them first.
- **No structured data.** `Course` is the schema.org type Google uses to build
  its course results. Without it a pronunciation course competes as generic
  prose, and no amount of Open Graph substitutes — Open Graph is for social
  cards, not for search.

## What Changes

- **`src/app/robots.ts`**, keyed on the deployment environment: production
  allows crawling and points at the sitemap; every other environment disallows
  everything. Nothing has to be remembered at launch.
- **`src/app/sitemap.ts`** listing the home, every course, every module and
  every lesson, in every locale, each entry carrying its `alternates.languages`
  so the locale relations are stated where a crawler reads them first.
- **The sitemap respects the served catalog.** It resolves through the same use
  cases the pages do, so a course withheld in production is absent from it.
- **JSON-LD on four route kinds**: `WebSite` and `Organization` site-wide,
  `Course` on a course, `BreadcrumbList` on course, module and lesson, and
  `VideoObject` on a Lecture — the last only when the lesson declares an upload
  date.
- **An optional `uploadDate` on video lessons** in the content manifest.
  `VideoObject` requires it; emitting one without is invalid structured data,
  which is worse than emitting none. Optional means no back-fill of 155 lessons
  is forced and no invalid markup is ever produced.

## Capabilities

### New Capabilities

- `search-discoverability`: what the application tells crawlers — which
  environments may be indexed, which URLs exist and how their locales relate,
  and the structured description of the catalog behind them.

### Modified Capabilities

- `course-content-storage`: the video lesson manifest gains an optional
  `uploadDate`.

## Impact

**New source**

- `src/app/robots.ts`, `src/app/sitemap.ts`
- `src/components/structured-data/structured-data.tsx` — renders one JSON-LD
  script safely
- `src/lib/course-schema/course-schema.ts` — builds the schema.org objects

**Modified source**

- `src/adapters/persistence/content-manifest/course-manifest-schema/course-manifest-schema.ts`
  — the optional `uploadDate`
- the course, module and lesson pages — each renders its structured data
- `src/app/[locale]/layout.tsx` — `WebSite` and `Organization`

## Non-goals

- **Back-filling `uploadDate` for the existing 155 lessons.** The field is
  optional and lessons without it emit no `VideoObject`. Dating the catalog is
  content work with its own change.
- **Search Console verification.** No property exists yet; adding the token is a
  one-line change once it does.
- **`Rating`, `Offer`, `aggregateRating` or any review markup.** The site has no
  reviews, and inventing them is exactly the abuse those types are policed for.
- **Bing/Yandex-specific directives**, and an RSS or Atom feed.

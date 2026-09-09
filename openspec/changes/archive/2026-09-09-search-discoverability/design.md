## Context

`siteUrl()` and `shareMetadata` exist from `site-metadata-foundation`, and the
image routes from `social-share-images` established that resolving through the
domain use cases is what makes a route inherit the catalog's withholding. Both
patterns carry straight into this change.

The catalog is reachable through `findCourseCatalog`, `findCourseForView` and
`findModuleForView`. The sitemap needs every lesson of every module of every
served course — a walk the existing use cases already support.

`SHOW_DRAFT_COURSES` and the `draft-course-visibility` capability already decide
what the catalog serves. Nothing here re-implements that.

## Goals / Non-Goals

**Goals:**

- Previews never enter an index, without anyone remembering anything.
- Every servable URL discoverable in one fetch, with its locale relations.
- The catalog described in the vocabulary Google actually consumes for courses.
- No structured data that a validator would reject.

**Non-Goals:**

- Back-filling upload dates, Search Console tokens, review/offer markup, feeds.

## Decisions

### D1 — `robots.ts` reads the environment, not a flag

`VERCEL_ENV` is `production`, `preview` or `development`. Production allows and
names the sitemap; anything else disallows `/`.

*Alternative considered:* a `ROBOTS_ALLOW` env var. Rejected — it makes correct
behaviour depend on someone setting a variable on the right deployment, and the
symptom of getting it wrong (an indexed preview cannibalising the real site) does
not surface for weeks.

Locally `VERCEL_ENV` is unset, which falls into the disallow branch. That is the
right default: a local server should never be crawlable if it is ever exposed.

### D2 — The sitemap walks the use cases, never the manifests

Reading `src/content/*.json` directly would be simpler and would list draft
courses, because the JSON is the unfiltered source. Going through
`findCourseCatalog` and `findModuleForView` inherits the withholding instead of
restating it, which is the same reasoning that governs the image routes.

Cost: one catalog walk per sitemap request. Next caches the route, and the
catalog is in memory.

### D3 — Structured data is emitted through one component, not by hand

`<StructuredData>` takes an object and renders a single
`<script type="application/ld+json">`. The reason it exists rather than each
page inlining a template literal is escaping: a course description containing
`</script>` would otherwise break out of the tag. The component serializes with
`JSON.stringify` and escapes `<` — one place to get right.

No library. `schema.org` objects are plain JSON; a dependency here would earn
nothing.

### D4 — `VideoObject` is conditional on `uploadDate`, which is optional

Google requires `name`, `description`, `thumbnailUrl` and `uploadDate` on
`VideoObject`. The catalog has the first three and not the fourth.

Three options were weighed. Emitting `VideoObject` without a date produces markup
validators reject — worse than silence. Making `uploadDate` required forces a
date onto 155 lessons before anything ships, and invented dates are worse than
absent ones. Optional, with the type emitted only when the date is present, lets
the schema be ready now and the content be dated when someone actually knows the
dates.

`duration` is `durationSeconds` formatted as an ISO 8601 duration (`PT8M11S`),
which is the only form schema.org accepts.

### D5 — `uploadDate` is a calendar date, validated in the manifest schema

`z.iso.date()` in the manifest schema. A malformed date fails the manifest load
with the lesson named, consistent with how `InvalidCourseManifestError` already
reports position-free errors.

## Risks / Trade-offs

- **The sitemap grows with the catalog** → 465 URLs today (155 lessons × 3
  locales) plus courses and modules, well inside the 50,000-entry limit. A split
  index is a later problem.
- **Structured data claims must stay true** → The spec forbids ratings, offers
  and reviews outright rather than leaving it to judgement, because that is the
  category of markup that gets sites penalised.
- **`VERCEL_ENV` is absent outside Vercel** → Falls to disallow. If the site ever
  moves hosts, this is the line to revisit, and it fails safe.
- **The manifest schema changes, so the seed regenerates** → `uploadDate` is
  optional and absent from every manifest today, so the generated seed is
  byte-identical until a date is actually added. Confirmed by regenerating and
  diffing rather than assumed.

## Testing strategy

| Layer | File | Covers |
| --- | --- | --- |
| Vitest unit | `src/app/robots.test.ts` | `VERCEL_ENV=production` allows and names the sitemap; `preview`, `development` and unset all disallow `/`. Env saved and restored per test. |
| Vitest unit | `src/lib/course-schema/course-schema.test.ts` | The `Course` object's shape; `BreadcrumbList` ordering; `VideoObject` emitted with a date and **absent** without one; `durationSeconds` → ISO 8601; no rating/offer/review key ever present. |
| Vitest unit | `src/components/structured-data/structured-data.test.tsx` | A description containing `</script>` is escaped rather than closing the tag. |
| Vitest unit | `…/course-manifest-schema.test.ts` | A manifest without `uploadDate` parses; a malformed one fails with the lesson named. |
| Playwright e2e | `e2e/search-discoverability.spec.ts` | `/robots.txt` and `/sitemap.xml` return 200 with the right content type; the sitemap contains a known lesson URL in all three locales, carries alternates, and **omits** a withheld course; a course page's JSON-LD parses and is a `Course`. |

`pnpm verify`, then the full Playwright suite serially.

## Open Questions

None.

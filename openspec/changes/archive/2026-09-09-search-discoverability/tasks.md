## 1. Robots

- [x] 1.1 (TDD: test → impl) Write `src/app/robots.test.ts`: `VERCEL_ENV=production` allows crawling and names the sitemap's absolute URL; `preview`, `development` and unset each disallow `/`. Save and restore `process.env` per test.
- [x] 1.2 (TDD: impl) Write `src/app/robots.ts` using `siteUrl()` for the sitemap URL.

## 2. The manifest gains an optional upload date

- [x] 2.1 (TDD: test → impl) Extend `course-manifest-schema.test.ts`: a video lesson without `uploadDate` still parses; one with a malformed date fails with the lesson named.
- [x] 2.2 (TDD: impl) Add optional `uploadDate` (`z.iso.date()`) to the video lesson branch of the manifest schema, and carry it through to the served lesson entity.
- [x] 2.3 Regenerate the content seed and confirm the diff is empty — no manifest declares a date yet, so nothing should move.

## 3. Structured data

- [x] 3.1 (TDD: test → impl) Write `src/components/structured-data/structured-data.test.tsx`: renders one `application/ld+json` script, and a payload containing `</script>` is escaped rather than closing the tag.
- [x] 3.2 (TDD: impl) Write `src/components/structured-data/structured-data.tsx`.
- [x] 3.3 (TDD: test → impl) Write `src/lib/course-schema/course-schema.test.ts`: the `Course` shape; `BreadcrumbList` ordering; `VideoObject` present with an upload date and absent without; `durationSeconds` → ISO 8601 (`491` → `PT8M11S`); no rating, offer or review key in any output.
- [x] 3.4 (TDD: impl) Write `src/lib/course-schema/course-schema.ts` with JSDoc on each builder.
- [x] 3.5 (TDD: impl) Render the structured data: `WebSite` + `Organization` in the locale layout, `Course` + `BreadcrumbList` on a course, `BreadcrumbList` on a module, `BreadcrumbList` + conditional `VideoObject` on a lesson.

## 4. Sitemap

- [x] 4.1 (TDD deviation: `sitemap.ts` was written before this spec, and verified against the running server first. The robots, schema and manifest tasks were all red-first.) (TDD: test → impl) Write `e2e/search-discoverability.spec.ts`: `/robots.txt` and `/sitemap.xml` return 200 with the right content types; the sitemap holds a known lesson URL in `en`, `es` and `pt`; entries carry alternates; a course page's JSON-LD parses and is a `Course`.
- [x] 4.2 (TDD: impl) Write `src/app/sitemap.ts`, walking `findCourseCatalog` and `findModuleForView` so the served catalog's withholding is inherited rather than restated.
- [x] 4.3 Assert in the e2e that a course withheld from the catalog is absent from the sitemap, agreeing with its page the way the image routes do.

## 5. Verify

- [x] 5.1 Run `pnpm verify`.
- [x] 5.2 Run the full Playwright suite serially against a dev server.
- [x] 5.3 Fetch `/robots.txt` and `/sitemap.xml` in a browser and read them.
- [x] 5.4 Run `openspec validate search-discoverability --strict`.

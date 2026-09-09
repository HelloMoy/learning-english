# site-metadata Specification

## Purpose
TBD - created by archiving change site-metadata-foundation. Update Purpose after archive.
## Requirements

### Requirement: The application resolves one absolute site URL

The application SHALL resolve a single absolute origin for every absolute URL it publishes, from the first of these that is set: `NEXT_PUBLIC_SITE_URL`, `https://${VERCEL_PROJECT_PRODUCTION_URL}`, `https://${VERCEL_URL}`, `http://localhost:${PORT ?? 3000}`.

The resolved value SHALL be validated as an absolute `http(s)` URL. A value that is set but unparseable SHALL fail loudly at resolution rather than being ignored or substituted, because the failure it would otherwise cause — relative Open Graph URLs that no crawler resolves — is invisible in the running application.

The resolved origin SHALL be the document's `metadataBase`, so that every relative URL Next.js emits into the head is absolutized against it.

#### Scenario: An explicit site URL wins
- **WHEN** `NEXT_PUBLIC_SITE_URL` is `https://english-course.online`
- **THEN** the resolved origin is `https://english-course.online`, whatever the Vercel variables say

#### Scenario: A preview deployment resolves to its own origin
- **WHEN** no `NEXT_PUBLIC_SITE_URL` is set and `VERCEL_URL` names the current preview deployment
- **THEN** the resolved origin is that preview's own `https://` origin, so a preview's shared links describe the preview rather than production

#### Scenario: Local development resolves to the running port
- **WHEN** no site URL and no Vercel variables are set
- **THEN** the resolved origin is `http://localhost:` followed by `PORT` when set, and `3000` otherwise

#### Scenario: A malformed site URL is refused
- **WHEN** `NEXT_PUBLIC_SITE_URL` is set to a value that is not an absolute `http(s)` URL
- **THEN** resolution fails with an error naming the variable and the value, rather than falling through to the next candidate

### Requirement: Every route declares its canonical URL and its locale alternates

Every rendered route SHALL declare a canonical URL for the locale it is being served in, and an alternate for each supported locale (`en`, `es`, `pt`) plus an `x-default` pointing at the default locale's equivalent path.

The locale set and the default locale SHALL be read from the routing configuration, so that adding or removing a locale changes every page's alternates with no per-page edit.

The shape of the locale prefix SHALL be asserted by a test rather than assumed. `getPathname` from the navigation wrappers cannot serve this purpose: outside a Next request it resolves to its client build and returns `/` for every input, which would make the one function every canonical depends on untestable.

#### Scenario: A course page declares all three locales
- **WHEN** `/es/courses/basic-course` renders
- **THEN** its canonical is the `es` URL, and it declares alternates for the `en`, `es` and `pt` equivalents of the same course, plus `x-default` pointing at the `en` one

#### Scenario: Alternates follow the routing config
- **WHEN** a locale is added to or removed from the routing configuration
- **THEN** the alternates a page declares change with it, without any per-page edit

#### Scenario: A change to the prefix mode fails a test
- **WHEN** `localePrefix` is changed from `always` to any other mode
- **THEN** a test fails, rather than the site silently publishing canonicals that no longer match its own URLs

### Requirement: Every route publishes Open Graph and Twitter Card metadata

Every rendered route SHALL publish Open Graph tags — title, description, canonical URL, site name, locale, alternate locales and type — and Twitter Card tags of type `summary_large_image` with a title and description.

The site name SHALL be the brand, `English Course`, in every locale. The title and description SHALL describe the route rather than the site: a lesson SHALL NOT publish the home page's description.

A lesson of kind `video` SHALL additionally publish the Open Graph type `video.other` and the video's duration, taken from the lesson's own `durationSeconds` rather than recomputed.

`twitter:site` and `twitter:creator` SHALL be omitted while no account exists. An empty or placeholder handle SHALL NOT be published.

Every route SHALL declare a sharing image with its pixel dimensions and localized alt text, as both `og:image` and `twitter:image`. On X the card renders the image alone — title and description are no longer shown in the feed — so a route without one publishes nothing a reader can act on.

#### Scenario: A lesson describes itself, not the site
- **WHEN** `/en/courses/basic-course/modules/1-introduction/lessons/<id>` renders
- **THEN** its `og:title` names the lesson and its `og:description` describes that lesson, and neither repeats the home page's copy

#### Scenario: A video lesson publishes its duration
- **WHEN** a lesson of kind `video` with `durationSeconds` of 491 renders
- **THEN** it publishes `og:type` of `video.other` and a duration of 491 seconds

#### Scenario: A reading lesson does not claim to be a video
- **WHEN** a lesson of kind `reading` renders
- **THEN** it publishes the default Open Graph type and no video tags

#### Scenario: Absent handles are absent, not empty
- **WHEN** any route renders
- **THEN** no `twitter:site` or `twitter:creator` tag is emitted at all

#### Scenario: The document title carries the brand
- **WHEN** a lesson titled `Introduction` renders
- **THEN** the document title reads `Introduction · English Course`

#### Scenario: Every route offers an image with its dimensions
- **WHEN** any route renders
- **THEN** it declares `og:image` and `twitter:image` at 1200×630 with alt text in the active locale

### Requirement: Sharing copy is localized for every supported locale

Every string the application publishes in its metadata — the brand name, the home share description, the sharing image's alt text, and the templates that compose a course, module and lesson description — SHALL be defined for `en`, `es` and `pt`.

These strings SHALL live in the application's message files under their own namespace, separate from the copy the pages render, so that changing what a page says and changing what a shared link says are separate edits.

Values interpolated into those templates — level, module count, lesson count, duration — SHALL come from the catalog, and counts SHALL be formatted through the application's plural handling rather than concatenated with a number.

The brand name is the one exception: it is not translated, and reads `English Course` in every locale, matching the wordmark the header renders.

#### Scenario: No locale is left behind
- **WHEN** the message files are compared
- **THEN** the metadata namespace has the same key set in `en`, `es` and `pt`, with no key present in one and missing from another

#### Scenario: A count reads naturally in each locale
- **WHEN** a course with 1 module and a course with 5 modules are described
- **THEN** each description uses the correct plural form for the active locale

#### Scenario: The brand is not translated
- **WHEN** a page renders under `es` or `pt`
- **THEN** its `og:site_name` reads `English Course`

### Requirement: The application ships its own icon set

The application SHALL replace the framework's default favicon with its own mark, derived from the brand wordmark's gold interpunct on the Immersion Cinema ground.

The set SHALL cover the surfaces that request different sizes and shapes: a scalable browser icon, a 180×180 Apple touch icon with an opaque background (iOS composites no transparency), 192 and 512 raster icons for Android and the manifest, a 512 maskable variant whose content stays within the inner 80% safe zone, and an `.ico` for clients that request one.

The mark SHALL remain identifiable at a 16×16 browser tab. A mark whose elements merge at that size SHALL NOT be shipped.

#### Scenario: A browser tab shows the brand, not the framework default
- **WHEN** any page is opened
- **THEN** the tab icon is the application's own mark, and no `create-next-app` default remains in the repository

#### Scenario: The maskable icon survives a circular crop
- **WHEN** the 512 maskable icon is cropped to a circle inscribing 80% of its area
- **THEN** the whole mark remains inside the crop

### Requirement: The application declares a web app manifest

The application SHALL serve a web app manifest declaring its name, short name, description, start URL, scope, standalone display, background and theme colors, and its icon set, so that installing it to a home screen produces the brand rather than a screenshot and an untitled entry.

Because the routing configuration always prefixes the locale, the start URL SHALL be a locale-prefixed path; the bare origin SHALL NOT be used, as it only redirects.

The application SHALL declare a theme color for each of its two themes rather than a single value, since it defaults to dark and offers light as an opt-in.

#### Scenario: Installing produces a named, branded app
- **WHEN** a learner adds the site to their home screen
- **THEN** the entry carries the brand name and the application's icon

#### Scenario: The start URL does not bounce through a redirect
- **WHEN** the installed app is launched
- **THEN** it opens a locale-prefixed URL directly, without first hitting a redirect from the bare origin

### Requirement: Every route renders its own sharing image

The application SHALL generate a 1200×630 sharing image per route, from that route's own catalog data and in the locale it is served in, rather than serving one static image for the whole site.

The image SHALL carry the application's visual identity: the Immersion Cinema ground, its radial gold glow, the letterbox scrim, and the `ENGLISH·COURSE` wordmark, so that a card is recognisable as this product before any text is read.

All four route kinds SHALL render through one shared card component. Four independent layouts would drift, and no reviewer sees a sharing image unless they deliberately look for it.

#### Scenario: A course card leads with what the course teaches
- **WHEN** the sharing image for a course whose description begins `American pronunciation from the ground up: …` is generated
- **THEN** the headline reads `American pronunciation from the ground up`, and the catalog name `Basic Course` appears only in the supporting line — a catalog name identifies a row, it does not tell a reader what they would learn

#### Scenario: A lesson card names its place in the course
- **WHEN** the sharing image for a lesson is generated
- **THEN** it shows the lesson's title, the course and module it belongs to, and, for a Lecture, its runtime

#### Scenario: The card follows the locale
- **WHEN** the same course's image is requested under `en` and under `es`
- **THEN** the localized chrome — counts, ordinals, labels — renders in each locale, using that locale's plural forms

### Requirement: A withheld course renders no sharing image

A course withheld from the served catalog SHALL NOT render a sharing image. Its image route SHALL fail the same way its page does rather than disclosing the course's title, description or lesson counts.

#### Scenario: A draft course's image route does not leak it
- **WHEN** the sharing image is requested for a course that the catalog withholds
- **THEN** the request does not return a rendered card naming that course

### Requirement: Metadata generation never throws for an unrecognized locale

Every route under the `[locale]` segment that declares `generateMetadata` SHALL reject a locale that is not in the configured `routing.locales` **before** building any metadata, resolving the request to a 404 instead.

The rejection SHALL go through one shared guard rather than being repeated per route, so a route added later cannot forget it.

The metadata builders SHALL keep treating an unsupported locale as a programming error and MAY throw: the guard exists so they are never reached with one. Softening that contract would trade a loud failure at a real route for a silent wrong canonical URL.

This matters because a path containing a dot is deliberately excluded from the locale middleware's matcher — that exclusion is what keeps `favicon.ico` from being locale-prefixed — so such a path reaches the router unvalidated and matches `[locale]` with whatever segment it carries. Nothing SHALL be written to the server's error log for such a request.

#### Scenario: A dotted path that is not a static file resolves to a clean 404
- **WHEN** a request arrives for `/manifest.json`, which is not a static file and never reaches the locale middleware
- **THEN** the response status is 404 and no error is written to the server log

#### Scenario: An unsupported locale segment resolves to a 404 before metadata is built
- **WHEN** a request arrives for a path whose first segment is not a configured locale
- **THEN** the route resolves to a 404 and no metadata builder is invoked with that segment

#### Scenario: The guard is shared, not duplicated
- **WHEN** any route under `[locale]` declares `generateMetadata`
- **THEN** it validates the locale through the one shared guard, rather than repeating the check inline

#### Scenario: A supported locale is unaffected
- **WHEN** a request arrives for a path under a configured locale
- **THEN** metadata is built exactly as before, with the canonical URL, the locale alternates and the sharing tags the `site-metadata` requirements already specify

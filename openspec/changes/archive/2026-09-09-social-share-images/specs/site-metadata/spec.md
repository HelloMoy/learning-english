## MODIFIED Requirements

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

## ADDED Requirements

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

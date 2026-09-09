# search-discoverability Specification

## Purpose
TBD - created by archiving change search-discoverability. Update Purpose after archive.
## Requirements
### Requirement: Only the production deployment invites crawling

The application SHALL serve a robots policy derived from the deployment environment rather than from a fixed file. The production deployment SHALL allow crawling and name the sitemap; every other deployment — preview, development — SHALL disallow it entirely.

This is decided by the environment and not by a flag someone must remember to flip, because the failure it prevents is silent: a preview deployment is a byte-for-byte duplicate of production under a different hostname, and an indexed preview competes with the site it was built to check.

#### Scenario: Production invites crawlers and points at the sitemap
- **WHEN** the production deployment serves its robots policy
- **THEN** crawling is allowed and the policy names the sitemap's absolute URL

#### Scenario: A preview deployment refuses crawlers
- **WHEN** a preview or development deployment serves its robots policy
- **THEN** it disallows every path, so the duplicate never enters an index

### Requirement: The sitemap lists every servable URL with its locale alternates

The application SHALL publish a sitemap listing the home, every course, every module and every lesson, in every supported locale. Each entry SHALL declare the equivalent URL in each other locale, so the locale relations are stated where a crawler reads them first rather than only in each page's head.

The sitemap SHALL be built from the same catalog the pages are served from. A course withheld from the served catalog SHALL NOT appear in it, nor SHALL its modules or lessons — a sitemap that lists a URL rendering a not-found state is worse than one that omits it.

#### Scenario: Every lesson is reachable without walking the navigation
- **WHEN** the sitemap is requested
- **THEN** it contains an entry for every lesson of every served course, in each supported locale

#### Scenario: A withheld course is absent from the sitemap
- **WHEN** the catalog withholds a course
- **THEN** neither that course, nor any of its modules or lessons, appears in the sitemap

#### Scenario: Entries carry their locale alternates
- **WHEN** a course entry is read
- **THEN** it declares the `en`, `es` and `pt` URLs for that same course

### Requirement: The catalog is described as structured data

The application SHALL describe itself and its catalog in schema.org JSON-LD: the site and its publisher on every page, a `Course` on a course page, and a `BreadcrumbList` on course, module and lesson pages.

A Lecture SHALL be described as a `VideoObject` **only** when the lesson declares an upload date. `VideoObject` requires one; emitting the type without it produces structured data that validators reject, which is worse than emitting none.

Structured data SHALL state only what the catalog actually knows. Ratings, reviews, offers and prices SHALL NOT be emitted, because the site has none.

#### Scenario: A course page describes its course
- **WHEN** a course page renders
- **THEN** it emits a `Course` naming the course, its description, its provider and the language it teaches

#### Scenario: A lesson without an upload date emits no VideoObject
- **WHEN** a Lecture that declares no upload date renders
- **THEN** no `VideoObject` is emitted for it, and the page's other structured data is unaffected

#### Scenario: A lesson with an upload date describes its video
- **WHEN** a Lecture that declares an upload date renders
- **THEN** it emits a `VideoObject` with the lesson's name, description, thumbnail, upload date and its duration in ISO 8601

#### Scenario: Nothing is invented
- **WHEN** any page's structured data is read
- **THEN** it contains no rating, review, offer or price, because the catalog holds none


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

The application SHALL publish a sitemap that lists, in every supported locale, the home and the two legal routes — the privacy policy and the terms — and nothing else. Those three are the application's only pages an anonymous visitor can read. Course, module and lesson routes SHALL NOT appear in it, because they require a session and answer an anonymous crawler with the sign-in page. Each entry SHALL declare the equivalent URL in each other locale, so the locale relations are stated where a crawler reads them first rather than only in each page's head.

#### Scenario: The sitemap lists the home in every locale
- **WHEN** the sitemap is requested
- **THEN** it contains exactly one entry per supported locale, each pointing at that locale's home

#### Scenario: The sitemap lists the legal routes in every locale
- **WHEN** the sitemap is requested
- **THEN** it contains one entry per supported locale for `/privacy`, and one per supported locale for `/terms`

#### Scenario: No course URL is listed
- **WHEN** the sitemap is requested
- **THEN** no entry's URL contains `/courses/`

#### Scenario: Entries carry their locale alternates
- **WHEN** the `en` home entry is read
- **THEN** it declares the `en`, `es` and `pt` home URLs

#### Scenario: Legal entries carry their locale alternates
- **WHEN** the `en` privacy entry is read
- **THEN** it declares the `en`, `es` and `pt` privacy URLs

#### Scenario: Nothing beyond the three public paths is listed
- **WHEN** the sitemap is requested
- **THEN** it contains exactly three entries per supported locale

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

### Requirement: Personal learner routes are kept out of search

The onboarding, My learning, Achievements and Profile routes and the account pages SHALL declare `robots` metadata that asks search engines not to index them while still following their links, in every locale and on every deployment. The account pages are sign-in, sign-up, forgot-password and reset-password. The sitemap SHALL NOT list any of them.

#### Scenario: My learning is not indexable
- **WHEN** the metadata for `/en/learning` is generated
- **THEN** it declares `index: false` and `follow: true`

#### Scenario: Achievements is not indexable
- **WHEN** the metadata for `/en/achievements` is generated
- **THEN** it declares `index: false` and `follow: true`

#### Scenario: Sign-in is not indexable
- **WHEN** the metadata for `/en/sign-in` is generated
- **THEN** it declares `index: false` and `follow: true`

#### Scenario: The sitemap omits personal routes
- **WHEN** the sitemap is requested
- **THEN** no entry's URL ends in `/start`, `/start/avatar`, `/learning`, `/achievements`, `/profile`, `/sign-in`, `/sign-up`, `/forgot-password` or `/reset-password`


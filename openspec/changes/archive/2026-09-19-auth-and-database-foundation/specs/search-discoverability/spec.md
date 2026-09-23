## MODIFIED Requirements

### Requirement: The sitemap lists every servable URL with its locale alternates

The application SHALL publish a sitemap that lists the home in every supported locale, and only the home. Course, module and lesson routes SHALL NOT appear in it, because they require a session and answer an anonymous crawler with the sign-in page. Each entry SHALL declare the equivalent URL in each other locale, so the locale relations are stated where a crawler reads them first rather than only in each page's head.

#### Scenario: The sitemap lists the home in every locale
- **WHEN** the sitemap is requested
- **THEN** it contains exactly one entry per supported locale, each pointing at that locale's home

#### Scenario: No course URL is listed
- **WHEN** the sitemap is requested
- **THEN** no entry's URL contains `/courses/`

#### Scenario: Entries carry their locale alternates
- **WHEN** the `en` home entry is read
- **THEN** it declares the `en`, `es` and `pt` home URLs

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

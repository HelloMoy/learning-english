## MODIFIED Requirements

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

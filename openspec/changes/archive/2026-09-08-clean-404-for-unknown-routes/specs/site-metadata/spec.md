## ADDED Requirements

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

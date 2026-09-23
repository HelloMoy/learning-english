## MODIFIED Requirements

### Requirement: An unknown path under a supported locale renders a localized Page Not Found

When the application receives a request whose locale segment is one of the configured `routing.locales` but whose remaining path matches no route (e.g. `/es/error`, `/en/typo`, or `/xx` after the proxy rewrites it to `/en/xx`), it SHALL render a localized "Page not found" state.

The response SHALL carry HTTP status 404. That status SHALL be decided before the response begins streaming — in the proxy — rather than by the catch-all route. Every page under the locale segment sits behind a `loading.tsx`, so the server commits to `200 OK` in order to send the shell, and a `notFound()` thrown while rendering can no longer change it. The catch-all still renders the page; the proxy is what makes the status honest.

The set of servable path segments the proxy judges against SHALL be checked against the route tree by a test, so a route added or removed on disk cannot silently start answering the wrong status.

Only the first segment after the locale SHALL decide. What follows is data rather than routing: an unknown course slug or lesson identifier is answered by the application's own inline recovery state, which is more useful than a bare missing page.

The page SHALL offer a link back to the home of the **active** locale, not the default locale: the learner's language is known and working, so sending a Spanish reader to the English home would discard information the request already carried.

The copy SHALL state that the *page* is missing. It SHALL NOT attribute the failure to the learner's language, which is supported in every case that reaches it.

The copy SHALL exist in every configured locale, so no learner reaching it sees a raw message key or another language's text.

#### Scenario: A mistyped path under a supported locale says the page is missing
- **WHEN** a user visits `/es/error`
- **THEN** the page states in Spanish that the page was not found, and does not state that the language is unsupported

#### Scenario: An unrecognized first segment is a missing page, not a missing language
- **WHEN** a user visits `/xx`
- **THEN** they are redirected to `/en/xx` and shown the page-not-found state, not a message about unsupported languages

#### Scenario: The response is still a 404
- **WHEN** a user visits any unknown path under a supported locale
- **THEN** the HTTP status is 404, not 200

#### Scenario: A real route is left alone
- **WHEN** a user visits a path the router serves, including one whose later segments are unknown data such as `/en/courses/no-such-course`
- **THEN** the proxy does not answer 404, and the application renders its own state

#### Scenario: The segment list cannot drift from the routes
- **WHEN** the route tree under `[locale]` is compared with the list the proxy judges against
- **THEN** they name the same segments

#### Scenario: The home link preserves the active locale
- **WHEN** a user on `/pt/does-not-exist` activates the "go home" affordance
- **THEN** they land on the Portuguese home, and that page returns 200

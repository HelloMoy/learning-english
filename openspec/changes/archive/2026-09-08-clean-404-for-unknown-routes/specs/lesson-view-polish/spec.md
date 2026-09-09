## REMOVED Requirements

### Requirement: The Locale Not Found page is localized

**Reason**: The page it describes cannot be reached, and its scenario asserted the
wrong cause. `src/proxy.ts` normalizes any first segment that is not a configured
locale into a path under the default locale — `/xx` is answered with a 307 to `/en/xx`,
and `/de/courses` with a 307 to `/en/de/courses`. Both then match no route and fall to
the catch-all. So a request never arrives at the application carrying an unsupported
locale; what arrives is a **supported locale and an unknown path**.

The requirement's own scenario ("a user visits `/xx`" → "Locale not supported") was
therefore satisfied only by accident: the catch-all's `notFound()` rendered a page whose
copy blamed the language. That accident is the defect this change exists to fix — it is
what made `/es/error` tell a Spanish reader that Spanish is unsupported.

A path that bypasses the proxy entirely, such as `/manifest.json`, is turned away by the
locale guard before any locale context exists, and resolves to the framework's own
not-found page. There is no locale to localize a message into, and no learner to read
it.

**Migration**: The replacement is "An unknown path under a supported locale renders a
localized Page Not Found", below. `src/app/[locale]/not-found.tsx` keeps its place as
the segment's not-found boundary and its structure, and changes only its copy and its
home link. The `LocaleNotFound` message namespace is removed from
`src/messages/{en,es,pt}.json` and replaced by `PageNotFound`.

## ADDED Requirements

### Requirement: An unknown path under a supported locale renders a localized Page Not Found

When the application receives a request whose locale segment is one of the configured `routing.locales` but whose remaining path matches no route (e.g. `/es/error`, `/en/typo`, or `/xx` after the proxy rewrites it to `/en/xx`), it SHALL render a localized "Page not found" state.

The response SHALL carry HTTP status 404.

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

#### Scenario: The home link preserves the active locale
- **WHEN** a user on `/pt/does-not-exist` activates the "go home" affordance
- **THEN** they land on the Portuguese home, and that page returns 200

#### Scenario: Every locale carries the copy
- **WHEN** the page renders in `en`, `es` or `pt`
- **THEN** it shows that locale's own text, and never a message key or a fallback in another language

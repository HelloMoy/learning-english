# legal-pages Specification

## Purpose
TBD - created by archiving change legal-pages. Update Purpose after archive.
## Requirements
### Requirement: The privacy policy and terms are public routes in every locale

The application SHALL serve a privacy policy at `/<locale>/privacy` and terms of service at `/<locale>/terms`, for every locale in `routing.locales`. Both SHALL render without a session, because an anonymous visitor — and Google's consent screen review — must be able to read them. Both SHALL be reachable by their URL alone, so they can be named from an external console that knows nothing about the app's navigation.

#### Scenario: The privacy policy renders signed out
- **WHEN** `/en/privacy` is requested with no session cookie
- **THEN** the page renders its content with a 200 status

#### Scenario: The terms render signed out
- **WHEN** `/en/terms` is requested with no session cookie
- **THEN** the page renders its content with a 200 status

#### Scenario: Both routes exist in every supported locale
- **WHEN** `/<locale>/privacy` and `/<locale>/terms` are requested for each of `en`, `es` and `pt`
- **THEN** each renders that locale's text, and none falls back to another locale's copy

### Requirement: The privacy text names every processor the code actually uses

The privacy policy SHALL describe the data the running application collects and the third parties it is handed to, and SHALL NOT describe processing the code does not perform. It SHALL cover, each as its own subject: the account record Better Auth stores (address, display name, and for a Google sign-in the linked provider account); the learning data written to Turso (lesson progress, playback position, earned rewards); transactional mail delivered through Resend; bot scoring by Cloudflare Turnstile on the sign-in, sign-up and password-reset endpoints; and error reports sent to Sentry with addresses and message bodies stripped.

It SHALL state that account deletion is available from the account pages and removes the account record, because the product already offers it.

#### Scenario: Every processor in the code is named
- **WHEN** the privacy policy is read in any locale
- **THEN** it names Turso, Resend, Cloudflare Turnstile and Sentry, and describes what each one receives

#### Scenario: Nothing is invented
- **WHEN** the privacy policy is read
- **THEN** it claims no analytics, advertising or profiling processing, because the application performs none

#### Scenario: The Sentry description matches the code's redaction
- **WHEN** the section on error reporting is read
- **THEN** it states that email addresses and message bodies are stripped before a report is sent

### Requirement: A site footer links the legal pages from every page

The application SHALL render a footer on every page under the locale layout, carrying a link to the privacy policy and a link to the terms. Both links SHALL be locale-aware, resolved through `@/i18n/navigation` so the active locale is preserved. The footer SHALL be a landmark a screen reader can reach, and SHALL NOT be rendered inside the main content region.

#### Scenario: Every page carries the footer
- **WHEN** any page under `[locale]` renders
- **THEN** the footer is present with links to that locale's privacy and terms routes

#### Scenario: The links keep the locale
- **WHEN** the footer renders under the `es` locale
- **THEN** its links point at `/es/privacy` and `/es/terms`, not at `/privacy` and `/terms`

#### Scenario: The footer is its own landmark
- **WHEN** the page structure is inspected
- **THEN** the footer is a `contentinfo` landmark outside the `main` element

### Requirement: Both pages carry their own title and description

Each legal page SHALL set a per-page `<title>` and description through `generateMetadata`, translated for the locale being rendered, so a shared link and a search result name the page rather than the site default.

#### Scenario: The privacy page titles itself
- **WHEN** metadata is generated for `/es/privacy`
- **THEN** the title is the Spanish privacy title, and the layout template appends the brand

#### Scenario: The terms page titles itself
- **WHEN** metadata is generated for `/pt/terms`
- **THEN** the title is the Portuguese terms title

### Requirement: The legal text states when it last changed

Each legal page SHALL display a last-updated date, formatted for the active locale through `next-intl`'s `format.dateTime` rather than as a hardcoded string, so the reader can tell which version they are looking at.

#### Scenario: The date is shown in the locale's format
- **WHEN** the privacy policy renders under `pt`
- **THEN** the last-updated date is formatted for `pt`, not in a fixed `en` order


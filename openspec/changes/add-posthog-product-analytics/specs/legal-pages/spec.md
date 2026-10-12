## MODIFIED Requirements

### Requirement: The privacy text names every processor the code actually uses

The privacy policy SHALL describe the data the running application collects and the third parties it is handed to, and SHALL NOT describe processing the code does not perform. It SHALL cover, each as its own subject: the account record Better Auth stores (address, display name, and for a Google sign-in the linked provider account); the learning data written to Turso (lesson progress, playback position, earned rewards); transactional mail delivered through Resend; bot scoring by Cloudflare Turnstile on the sign-in, sign-up and password-reset endpoints; error reports sent to Sentry with addresses and message bodies stripped; and usage data sent to PostHog.

The passage on usage data SHALL state:

- that PostHog stores it in the United States, the region the code delivers it to;
- that the reader is asked first, and what each answer means: accepting allows cookies and browser storage, links activity to the reader's account by its ID, and records sessions; rejecting still counts the visit, anonymously, with nothing stored in the browser, no link to the account and no recording;
- what is collected: pages visited, clicks and the text of what was clicked, named actions such as playing a video, and the browser and device type;
- what is never collected: anything typed into a form, the email address, anything after the question mark in a page address, and recordings of the sign-in, sign-up and password pages;
- that the choice can be changed from the footer at any time.

It SHALL state that account deletion is available from the account pages and removes the account record, and that it also erases the usage data and recordings PostHog holds for that account.

#### Scenario: Every processor in the code is named
- **WHEN** the privacy policy is read in any locale
- **THEN** it names Turso, Resend, Cloudflare Turnstile, Sentry and PostHog, and describes what each one receives

#### Scenario: Nothing is invented
- **WHEN** the privacy policy is read
- **THEN** it claims no advertising and no sale of data, because the application performs neither, and it does not deny any processing the code performs

#### Scenario: The cookies passage matches the consent choice
- **WHEN** the passage on cookies is read
- **THEN** it names the locale and session cookies as always set, and says PostHog's cookie and browser storage exist only after the reader accepts

#### Scenario: The Sentry description matches the code's redaction
- **WHEN** the section on error reporting is read
- **THEN** it states that email addresses and message bodies are stripped before a report is sent

#### Scenario: The PostHog description matches the code's configuration
- **WHEN** the passage on usage data is read
- **THEN** every claim it makes about what is and is not collected corresponds to an option the client is started with or a requirement of the `product-analytics` capability

#### Scenario: Deletion covers usage data
- **WHEN** the passage on the reader's choices is read
- **THEN** it says that deleting the account also erases the usage data and recordings held for it

### Requirement: The legal text states when it last changed

Each legal page SHALL display a last-updated date, formatted for the active locale through `next-intl`'s `format.dateTime` rather than as a hardcoded string, so the reader can tell which version they are looking at. Each document SHALL carry its own date, so that editing one does not change the date shown on the other.

#### Scenario: The date is shown in the locale's format
- **WHEN** the privacy policy renders under `pt`
- **THEN** the last-updated date is formatted for `pt`, not in a fixed `en` order

#### Scenario: Editing the privacy policy does not re-date the terms
- **WHEN** the privacy policy's wording and date change and the terms are untouched
- **THEN** the terms still show the date their own wording last changed

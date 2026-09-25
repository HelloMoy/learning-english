## MODIFIED Requirements

### Requirement: Account forms are protected against bots and bursts

The sign-up, sign-in and forgot-password forms SHALL carry a Cloudflare Turnstile challenge, and the server SHALL reject those requests when the challenge token is missing or invalid. Better Auth's rate limiting SHALL be enabled in production builds and stored in the database, so that limits hold across server instances. It SHALL stay off in development and in the e2e suite, where many parallel sign-ins share one address. Every refusal SHALL show a localized message rather than a raw error.

Local development and the e2e suite SHALL use Cloudflare's published always-pass test keys, so no real challenge is ever solved in automation.

Outside the development server, the challenge SHALL stay hidden unless Cloudflare needs the visitor to interact, and while it is hidden it SHALL take no space in the form, not even the spacing between the form's elements. On the development server the challenge SHALL always be visible, in space the form reserves for it.

The challenge SHALL be the last element of each account form: after "Continue with Google" on sign-in and sign-up, and after the submit button on forgot-password. The card's footer links come after it.

#### Scenario: A request without a challenge token is refused
- **WHEN** a sign-in request reaches the server without a Turnstile token
- **THEN** it is refused, and no session is created

#### Scenario: Bursts are limited
- **WHEN** a production build's sign-in endpoint receives more attempts from one client than the configured window allows
- **THEN** further attempts are refused with a localized "too many attempts" message until the window passes, and the counter lives in the database

#### Scenario: A production build hides a challenge the visitor does not need to solve
- **WHEN** a visitor opens the sign-in form in a production build and Cloudflare passes them without interaction
- **THEN** no Turnstile box is shown, the space between "Continue with Google" and the footer links is the same as with no challenge at all, and the form still submits with the challenge token

#### Scenario: A production build shows the challenge when interaction is required
- **WHEN** Cloudflare needs a visitor on a production build to interact
- **THEN** the Turnstile checkbox appears in the form

#### Scenario: The development server always shows the challenge
- **WHEN** a developer opens the sign-in form on the development server
- **THEN** the Turnstile box is visible in its reserved space

#### Scenario: The challenge comes last in the form
- **WHEN** a visitor opens `/en/sign-in` or `/en/sign-up`
- **THEN** the Turnstile challenge comes after "Continue with Google" in the page, and before the footer link to the other account page

#### Scenario: The challenge comes last on forgot-password
- **WHEN** a visitor opens `/en/forgot-password`
- **THEN** the Turnstile challenge comes after the submit button

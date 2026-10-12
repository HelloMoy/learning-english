## MODIFIED Requirements

### Requirement: The provisioning runbook covers every external dependency

`DEPLOYMENT.md` SHALL list, in order, every manual step needed for a first production deploy: the Turso database, region and auth token; the Resend domain (DNS records) and API key; the Google OAuth production client and its redirect URI; the Turnstile widget and its hostname; the Sentry project and DSN; the PostHog project, its token and its personal API key; the Vercel project, its function region (matching Turso's) and every environment variable the server environment schema declares. It SHALL say how to roll back a bad deploy, which is Vercel's instant rollback and holds because migrations are additive.

For PostHog it SHALL state:

- that the project is created in the US region, and that the region cannot be changed afterwards;
- the project settings the code depends on: cookieless tracking enabled, or every event from a visitor who rejected is discarded; session replay enabled; console log capture and network capture left off;
- that the personal API key is a secret, scoped to deleting persons and recordings, and must never be given a `NEXT_PUBLIC_` name;
- that two-factor authentication is enabled on the PostHog account, because recordings show learners using the site;
- that no card is added, so the free plan pauses instead of billing;
- how to authenticate `posthog-cli`.

#### Scenario: Every declared variable is documented
- **WHEN** the server environment schema's variable names are compared with `DEPLOYMENT.md`
- **THEN** every name appears in the runbook

#### Scenario: The PostHog settings the code depends on are documented
- **WHEN** the PostHog step of `DEPLOYMENT.md` is read
- **THEN** it names the US region, the cookieless tracking setting and the session replay setting, and says what happens when the cookieless setting is left off

#### Scenario: The secret is called out
- **WHEN** the PostHog step of `DEPLOYMENT.md` is read
- **THEN** it says the personal API key is server-only and names the scopes it needs

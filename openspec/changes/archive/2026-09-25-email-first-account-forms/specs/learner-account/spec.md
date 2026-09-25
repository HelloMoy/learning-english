## MODIFIED Requirements

### Requirement: A learner signs in with Google

The sign-in and sign-up pages SHALL offer "Continue with Google". Completing Google's consent SHALL sign the learner in, creating the account on first use, and SHALL open the validated `next` path or `/[locale]/learning`. An account created through Google SHALL count as verified.

On both pages the email-and-password form SHALL come first, and "Continue with Google" SHALL come second, after the form's submit button and after an "or" divider between the two.

When the Google account's address already belongs to an email-and-password account, the two SHALL be linked into one account rather than creating a second one.

#### Scenario: First Google sign-in creates the account
- **WHEN** a visitor with no account completes Google sign-in
- **THEN** an account exists for that Google address, marked verified, and a session is open

#### Scenario: Google links to an existing password account
- **WHEN** a learner who signed up with `ana@example.com` and a password later completes Google sign-in as `ana@example.com`
- **THEN** there is still exactly one account for that address, and it can sign in both ways

#### Scenario: Email and password come before Google on sign-in
- **WHEN** a visitor opens `/en/sign-in`
- **THEN** the email field and the "Sign in" button come before "Continue with Google" in the page

#### Scenario: Email and password come before Google on sign-up
- **WHEN** a visitor opens `/en/sign-up`
- **THEN** the name field and the "Create account" button come before "Continue with Google" in the page

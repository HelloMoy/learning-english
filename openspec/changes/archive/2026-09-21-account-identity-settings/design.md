## Context

The app already runs Better Auth 1.7 behind `src/lib/auth/auth.ts`, with email-and-password
(verification required), Google with account linking, Turnstile on the three public forms, database
rate limiting and an account-deletion flow confirmed by email. Three React Email templates exist
(`verify-email`, `reset-password`, `delete-account`), composed through
`composeAccountEmail(kind, actionUrl)`, which reads the locale out of the link's `callbackURL`.

Two gaps sit on top of that base:

- The onboarding already has the learner's name — sign-up collects it, Google supplies it — and asks
  for it again on an empty card. Nothing reads `session.user.name` outside the header.
- The Profile page edits the learner card and offers account deletion, and nothing else. The
  account's address is never shown, and neither the password nor the address can be changed.

Constraints that shape the work: the domain layer may import only `zod` and `neverthrow`, so none of
this belongs there — it is delivery-layer wiring around Better Auth; every string goes through
`next-intl` in `en`, `es` and `pt`; `src/lib/auth/**` is `server-only`; and the account forms call the
Better Auth browser client directly rather than going through Server Actions, because the client
already handles cookies and extra headers.

## Goals / Non-Goals

**Goals:**

- Read the signed-in account's name, address and sign-in methods once, on the server, and hand them to
  the pages that need them.
- Seed onboarding step 1 with the account's name, and make step 2's card name editable with the same
  field.
- Add an Account section to the Profile page: the address, the sign-in methods, a change-password form
  and a change-email form.
- Use Better Auth's own two-link email-change flow, with the first link going to the address on file.
- Keep every refusal a localized message keyed off Better Auth's error codes, never raw server text.

**Non-Goals:**

- Setting a first password on a Google-only account (`/set-password` is server-only in Better Auth and
  needs a flow of its own), and linking or unlinking providers.
- Two-factor authentication, a session list, or a standalone "sign out everywhere".
- Renaming the Better Auth user when the learner card's name changes. The card's name and the
  account's name stay two separate things; the account's name is only ever read, as a seed.

## Decisions

### One server helper reports the account's identity

New `src/lib/auth/current-account/current-account.ts`, `server-only`:

```ts
export async function currentAccount(): Promise<LearnerAccountIdentity | null>;
```

The shape it returns lives one module over, in `src/lib/account-identity/account-identity.ts`,
which is **not** `server-only`:

```ts
export type SignInMethod = "password" | "google";
export type LearnerAccountIdentity = {
  name: string;
  email: string;
  signInMethods: ReadonlyArray<SignInMethod>;
};
```

That split is the same one `LearnerSnapshot` already makes against `currentLearnerSnapshot`: the
data crosses to the client as a prop, so the client components that type that prop must be able to
name it without importing a module that refuses to be bundled.

It reads `getAuth().api.getSession({ headers })` and, when there is one,
`getAuth().api.listUserAccounts({ headers })`, mapping `providerId` (`credential` → `password`,
`google` → `google`) and dropping anything else. It sits beside `currentLearnerSnapshot` and
`requireLearnerSession`, which already own the other two shapes of "who is asking".

_Alternative considered:_ reading the accounts table directly through Drizzle. Rejected — Better Auth
owns that table's shape, and `listUserAccounts` is the supported read. _Alternative considered:_ a
narrower `currentAccountName()` for `/start`, to skip the accounts query there. Rejected — one concept
with one name beats two helpers that differ by a query the page never notices.

### `/start` and `/profile` pass the identity down as props

Both pages are Server Components under `personal-route-layout`, so a session is guaranteed by the time
they render. Each calls `currentAccount()` and passes what it needs into the existing client component:
`OnboardingNameStep` gains `accountName`, `OnboardingAvatarStep` needs nothing new, and `ProfileView`
gains `account`.

The seeded name is the initial value of the step's `useState`, so it is present in the first client
render — no flash of an empty field, no effect, no dependency on hydration order. When the account's
name is blank or whitespace the seed is `""` and the step behaves exactly as it does today.

_Alternative considered:_ `authClient.useSession()` in the client component. Rejected — it would paint
an empty field and then fill it, and it costs a round trip the server already made.

### One name field component, used by both onboarding steps

`LearnerCard` already takes a `nameField` slot; step 1 passes an `<input>` built inline. That input is
now needed twice, so it moves to `src/components/learner-card-name-field/learner-card-name-field.tsx`
with its own stories and tests, and both steps render it. Step 2 keeps its own state (`name`, `avatar`)
seeded from the stored profile and saves both on **Continue**, matching how it already treats the
avatar: choosing changes the card, only Continue writes.

### The password form uses `changePassword` with `revokeOtherSessions`

`authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true })`. Better Auth
verifies the current password, deletes every session of the user, creates a fresh one and sets its
cookie — so the browser that made the change stays signed in and every other device is out. That is the
behavior the spec asks for, and it comes free with the flag.

Length is validated in the browser first with a new `changePasswordSchema` built from the same
`password` piece the other account schemas share, so a short password never leaves the page.

### The email form uses `changeEmail` with a confirmation on the address on file

`user.changeEmail` is enabled in `createAuth` with `sendChangeEmailConfirmation`. Because the learner's
address is verified, Better Auth takes the confirm-then-verify path:

1. `authClient.changeEmail({ newEmail, callbackURL })` → `sendChangeEmailConfirmation` fires with the
   **current** address and the requested one; the app sends the new `change-email` template there.
2. Opening that link makes Better Auth mint a `change-email-verification` token and call
   `emailVerification.sendVerificationEmail` for the **new** address — the existing `verify-email`
   template, unchanged.
3. Opening the second link writes the new address, marks it verified and sets the session cookie.

Two properties come from the library and are worth naming, because the spec depends on them: a
`newEmail` that already belongs to another account returns `200` and mails nobody, so the form cannot
enumerate accounts; and both endpoints sit behind `sensitiveSessionMiddleware`, which demands an
authoritative session rather than a cached cookie.

`callbackURL` is `getPathname({ href: "/profile", locale })`, exactly as the other forms do it: the
locale-qualified path is what `localeFromActionUrl` reads back to decide the email's language.

_Alternative considered:_ `updateEmailWithoutVerification`. Rejected — it only applies to unverified
addresses and would let one open session move an account to an address nobody proved they own.

_Alternative considered:_ requiring the current password on the email form too. Rejected — Better Auth
does not take one on this endpoint, and the confirmation link sent to the address on file is the
stronger control: a hijacked session still cannot complete the move.

### Turnstile stays off these two endpoints

The captcha plugin lists the three public form endpoints. `/change-password` and `/change-email` are
reachable only with an authoritative session, and Better Auth's database-backed rate limiting already
covers bursts. Adding a challenge would mean mounting a widget inside the Profile page for no gain.

### Localized refusals extend the existing map

`account-error-key` gains `INVALID_PASSWORD → invalidPassword` and
`CREDENTIAL_ACCOUNT_NOT_FOUND → noPassword`. "Submitting the address you already have" is refused by
Better Auth with a message and no code, so the form checks it before submitting, against the address
the server already gave the page, and reports it as a validation error.

### The email composer learns to carry values

`composeAccountEmail(kind, actionUrl)` becomes `composeAccountEmail(kind, actionUrl, values?)`, passing
`values` into each `t(key, values)` call so `Emails.ChangeEmail.body` can interpolate `{newEmail}`. The
three existing kinds pass nothing and are unaffected.

### The Account section is three components, not one

`src/components/account-section/` renders the address, the sign-in methods, and — only when
`signInMethods` includes `"password"` — `src/components/change-password-section/` and
`src/components/change-email-section/`. Each form owns its own state and status; splitting them keeps
each component to one responsibility and lets the Google-only case be a single conditional rather than
a set of flags threaded through one large form. All three reuse `AccountField` and the
`Account.validation.*` keys the account pages already use.

## Risks / Trade-offs

- **A learner loses access to the address on file mid-change** → The confirmation link never arrives and
  nothing happens; the account keeps its current address and the learner can still use the existing
  forgot-password flow. No state is left half-written, because Better Auth writes only on the second
  link.
- **The second link lands in a browser with no session** → Better Auth creates one for that user, which
  is how it already behaves for `verify-email`. The token is single-use, short-lived and bound to both
  addresses, so this is the same exposure sign-up verification already carries.
- **`listUserAccounts` adds a query to `/start` and `/profile`** → Both are personal routes rendered per
  request, already reading the session and the learner snapshot; one indexed read by `userId` is noise
  next to that.
- **Revoking other sessions on a password change logs the learner out of their phone** → That is the
  point, and the confirmation says so in as many words, so it is not a surprise.
- **`user.changeEmail` is now enabled globally** → `/api/auth/change-email` becomes reachable for every
  signed-in account, including Google-only ones, even though the UI hides the form. The exposure is
  bounded by the same confirm-then-verify flow: nothing changes without a link opened from the address
  on file.

## Testing strategy

Red before green on every task, per `AGENTS.md`.

**Vitest unit** (`src/**/*.test.ts`, colocated):

- `src/lib/auth/current-account/current-account.test.ts` — mirrors
  `current-learner-snapshot.test.ts`: `vi.mock` on `next/headers` and `@/lib/auth/auth`, a stubbed
  `getSession`/`listUserAccounts`. Covers no session, password only, Google only, both, and an
  unknown `providerId` being dropped.
- `src/lib/account-form-schemas/account-form-schemas.test.ts` — the new `changePasswordSchema` and
  `changeEmailSchema`, including the length and address messages.
- `src/lib/account-error-key/account-error-key.test.ts` — the two new codes.
- `src/lib/account-emails/account-emails.test.ts` — extends the existing file: the `change-email` kind
  renders in the link's locale and interpolates the new address.

**Vitest component + RTL** (`src/**/*.test.tsx`, colocated):

- `learner-card-name-field.test.tsx` — label, placeholder, max length, typing.
- `onboarding-name-step.test.tsx` — extends the existing file: the field opens holding `accountName`;
  a blank account name opens empty with Continue disabled; the seed can be rewritten and what is saved
  is what the field holds.
- `onboarding-avatar-step.test.tsx` — extends the existing file: the card's name is editable, typing
  saves nothing, Continue saves name and avatar together, an emptied name disables Continue.
- `account-section.test.tsx` — the address is shown as text; the method line for password, Google and
  both; Google-only shows neither form.
- `change-password-section.test.tsx` — a stubbed `authClient.changePassword`: success clears both
  fields and announces the status, a refusal is an alert and the fields keep their values, a short
  password sends nothing.
- `change-email-section.test.tsx` — a stubbed `authClient.changeEmail`: the confirmation names the
  address on file, an invalid address sends nothing, the current address is refused before submitting.
- `profile-view.test.tsx` — extends the existing file: the section renders between the card form and
  the delete-account section, and is absent when no account is passed.
- Every new component also gets a colocated `*.stories.tsx` (prefix `Components/`), per `AGENTS.md`.

**Playwright e2e** (`e2e/account-identity.spec.ts`, mirroring `account-deletion.spec.ts` and
`learner-account.spec.ts`, using `learner-account-fixture.ts` and `mailpit-inbox.ts`):

- Changing the password: the new one signs in, the old one does not, and a second browser context that
  was signed in before the change can no longer open `/en/learning`.
- Changing the address: the Spanish confirmation reaches the address on file and names the new one;
  opening it puts a verification email in the new address's inbox; opening that one changes the address,
  and signing in follows it.
- An address that already belongs to another account gets the same confirmation, and that account's
  inbox stays empty.

The Google-only case is covered at the component layer rather than end to end: the e2e environment has
no Google provider, and what the requirement asserts — which forms render — is a rendering decision.

## Why

The sign-in and sign-up pages open with "Continue with Google", which makes Google the default way in and pushes the email-and-password form below the fold on small screens. Email and password is the main path. Google should be offered as the alternative.

## What Changes

- On `/[locale]/sign-in` and `/[locale]/sign-up`, the email-and-password form comes first: its fields, the "Forgot your password?" link (sign-in only), the Turnstile challenge and the submit button.
- The "or" divider and "Continue with Google" move below the form's submit button, in that order.
- The "password updated" confirmation on sign-in stays at the top of the card, above the form.
- Nothing else changes: same copy, same Google behavior, same wait indicator (it still pauses the Google button during a submission).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `learner-account`: the "A learner signs in with Google" requirement now says where the Google option sits, after the email-and-password form and its submit button.

## Impact

- `src/components/sign-in-form/sign-in-form.tsx` and `src/components/sign-up-form/sign-up-form.tsx`: reorder the JSX.
- `src/components/sign-in-form/sign-in-form.test.tsx` and `src/components/sign-up-form/sign-up-form.test.tsx`: add an assertion on the order.
- No message, API, dependency or data changes. `e2e/learner-account.spec.ts` finds the Google button by role, so the new order does not affect it.

## Non-goals

- Changing any copy, including the divider's "or".
- Restyling the Google button or the divider.
- Changing the forgot-password, reset-password or verification pages.
- Changing what Google sign-in does (account creation, linking, redirect).

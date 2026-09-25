## Why

The Cloudflare Turnstile box shows on the sign-in, sign-up and forgot-password forms in
production for every visitor, even though Cloudflare passes almost all of them without a
click. It is visual noise on the most important forms of the site. Cloudflare's own docs
call the `interaction-only` appearance "the cleanest experience": the widget stays hidden
and only appears when the visitor has to interact. On the development server the box is
useful. It shows at a glance that the challenge ran and that the test key is in use, so it
stays visible there.

## What Changes

- The Turnstile widget uses the `interaction-only` appearance in every build except the
  development server. Visitors Cloudflare passes silently see no box. A visitor Cloudflare
  flags sees the checkbox appear at the end of the form.
- Outside the development server the form no longer reserves the widget's 65px, and the
  hidden widget takes no part in the form's layout, so it leaves no gap at all. It rejoins
  the layout, with the form's usual spacing, the moment Cloudflare shows it.
- The challenge moves to the end of each account form: under "Continue with Google" on
  sign-in and sign-up, under the submit button on forgot-password. Whenever it does show,
  it sits just above the card's footer links instead of between "Forgot your password?"
  and the submit button.
- On the development server (`pnpm dev`, Storybook dev) the widget stays always visible,
  in the reserved space, exactly as today.
- `DEPLOYMENT.md` stops justifying Managed mode by "the widget reserves visible space".
  It still says to use Managed mode and not Invisible mode.

## Non-goals

- Changing the widget mode in the Cloudflare dashboard. It stays **Managed**.
- Invisible mode, and the privacy-policy addendum Cloudflare requires for it.
- Server-side verification, rate limiting, keys or the localized refusal messages. None of
  them change.
- A per-environment variable to choose the appearance. The development/production split is
  the whole requirement.
- Animating the form when the checkbox appears for a flagged visitor.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `learner-account`: "Account forms are protected against bots and bursts" gains the rule
  that the challenge is hidden outside the development server unless Cloudflare needs the
  visitor to interact, takes no space while hidden, is always visible on the development
  server, and comes last in each account form.

## Impact

- `src/components/turnstile-challenge/turnstile-challenge.tsx` and its test and stories.
- A new `AccountChallenge` component (the challenge as an account form places it).
- `AccountSubmitArea` loses the challenge and its `challenged` prop.
- `SignInForm`, `SignUpForm` and `ForgotPasswordForm` place the challenge last.
- `DEPLOYMENT.md`, step 4 (Turnstile).
- Production, the `develop` preview and the e2e suite all run production builds, so all
  three hide the widget. The e2e suite waits for the submit button to be enabled, not for
  the widget, so it is unaffected.
- No dependency, API or data changes.

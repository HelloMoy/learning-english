## Why

Every account request in the product — signing in, signing up, asking for a reset link,
setting a new password, requesting account deletion — is acknowledged by one thing: the submit
button swaps its label. Nothing moves. On a slow Turnstile check or an irregular network the
learner stares at a form that looks exactly as it did before they pressed the button, and the
only way to tell the difference is to read the button again. The most common response to a page
that looks idle is to press the button a second time.

The waits are also unequal, and the label swap flattens them. Sign-in's wait continues past the
credentials being accepted, into the navigation where the learner's progress is read; deletion's
wait is the most anxious in the product because the action is destructive. All of them deserve
motion that says "still happening", and none of them deserves a claim about how far along it is.

## What Changes

The treatment is the artifact's «Botón en vuelo» and «Haz de proyector» combined: the form stays
exactly where it is, and the wait is layered onto it rather than replacing it.

- A new `SpinnerArc` primitive — the gold arc that turns on a button's ink.
- A new `PendingButton` — a `Button` that swaps its label for a pending label and turns a
  `SpinnerArc` beside it while a request is in flight. This is the "Botón en vuelo", and it is
  the single place that behaviour is defined.
- A new `AccountWait` compound component owning the rest of the wait: `AccountWait` puts an
  indeterminate gold beam across the top edge of the surface, `AccountWait.Paused` dims the part
  of the surface that is out of play and makes it `inert` so nothing inside can be typed into,
  focused or re-submitted, and `AccountWait.Status` is the one live region naming the wait. Idle,
  all three render their children and nothing else.
- `AccountSubmitArea` renders `PendingButton` in place of its bare `Button`. All four forms that
  share it inherit the arc for free: `SignInForm`, `SignUpForm`, `ForgotPasswordForm`,
  `ResetPasswordForm`. Each wraps its own fields in `AccountWait.Paused` and names its own wait.
- `SignInForm` keeps the wait up from the moment it submits until the navigation takes the page
  away, so the form does not flash back between the credentials being accepted and the route
  changing. Only a refusal returns it.
- `DeleteAccountSection` is brought in line with the other four rather than given a parallel
  implementation. Today it hand-rolls its own label swap on a bare `Button`; it drops that in
  favour of the same `PendingButton` and the same `AccountWait` wrapper, so the destructive
  action waits exactly the way every other account action waits. Its own status and error
  messages and its terminal "email sent" state are unchanged — only the waiting is homologated.
- New localized copy under `Components.AccountWait` and per-surface status lines, in `en`, `es`
  and `pt`.
- Each waiting screen announces itself through exactly one `role="status"` region. The beam, the
  arc and the dimmed body are hidden from assistive technology.
- **Nothing is added to `globals.css`'s reduced-motion handling.** The global
  `prefers-reduced-motion` block already stills every animation in the app; the beam and the arc
  are ordinary CSS animations and are covered by it. What survives it is the dimming, the inert
  body and the status line — which is the part that carries the meaning.

**Supersedes a withdrawn design.** The «Anillo por pasos» treatment (a segmented `ProgressRing`
over three named stages, replacing the form body) was built and then withdrawn by the user before
it was committed, in favour of this one. Its `AccountProgress` component, its `ProgressRing`
`completed` prop and its `Components.AccountProgress` copy are not part of the codebase and are
not reinstated here. The two are mutually exclusive: the ring removes the form, this keeps it.

**No stage is named or counted.** Both treatments here are indeterminate by construction — a
sweeping beam and a turning arc make no claim about progress. The status line names *what* is
being waited on ("Checking your details…"), never *how far along* it is. This is the deliberate
difference from the withdrawn design, which had to pace two of its three stages on a timer
because nothing observable separated them.

## Capabilities

### New Capabilities

- `account-wait-indicator`: the wait an account form shows while its request is in flight — the
  beam, the arc on the submit button, the dimmed and inert body, the status line, the single
  announcement, and how all of it behaves under reduced motion and on failure.

### Modified Capabilities

- `learner-account`: four existing requirements gain the requirement that their wait is covered
  by the indicator rather than by a label swap alone — "A learner signs up with email and
  password and verifies the address", "A learner signs in with email and password" (which also
  gains that the form does not come back once the credentials are accepted), "A learner resets a
  forgotten password by email", and "A learner deletes their account after confirming by email".

## Non-goals

- **The other three treatments explored in the artifact** — «Cierre de sala» (the letterbox
  curtain), «Anillo por pasos» (the stepped ring, withdrawn) and «Esqueleto del destino» (the
  destination skeleton). Only the first two are being built, combined.
- **The brand wordmark's flickering dot** from the artifact's mock. `Brand` sits in the page
  header, outside the form's tree; syncing it would mean lifting one form's pending state into
  global state for a decorative flicker. Not worth the coupling. The beam carries the same
  reading on its own.
- **`GoogleSignInButton`.** It leaves the page for Google's consent screen, so its wait belongs
  to a different document and ends by navigation, not by a response. It stays as it is.
- **Any route's `loading.tsx`.** Sign-in's navigation still hands off to the destination's own
  shell; this change covers the part before that, not the part after.
- **A progress percentage, a stage count, or an estimated time.** Nothing the client can observe
  supports any of them — see "No stage is named or counted" above.
- **Domain, adapter or persistence code.** This change is entirely in the delivery layer.
- **Replacing `useAccountSubmission`.** Its `isPending` is already the signal the indicator needs;
  only `SignInForm` adds state of its own, for the window between the response and the navigation.

## Impact

- **New**: `src/components/spinner-arc/spinner-arc.tsx`,
  `src/components/pending-button/pending-button.tsx`,
  `src/components/account-wait/account-wait.tsx`, each with its colocated test and stories.
- **Changed**: `src/components/account-submit-area/account-submit-area.tsx` — `PendingButton` in
  place of the bare `Button`; its colocated test and stories follow.
- **Changed**: `src/components/account-shell/account-shell.tsx` — the card becomes the beam's
  positioning context and clips it. No new prop, no state; it stays a server component.
- **Changed**: `src/components/sign-in-form/sign-in-form.tsx` — wraps its fields, names its wait,
  and holds the wait through the navigation.
- **Changed**: `src/components/sign-up-form/sign-up-form.tsx`,
  `src/components/forgot-password-form/forgot-password-form.tsx`,
  `src/components/reset-password-form/reset-password-form.tsx` — wrap their fields and name their
  waits.
- **Changed**: `src/components/delete-account-section/delete-account-section.tsx` — drops its
  hand-rolled label swap for `PendingButton` and `AccountWait`.
- **Changed**: `src/messages/{en,es,pt}.json` — a `Components.AccountWait` namespace and a
  `waiting` key alongside each surface's existing `submitting` / `sending` key.
- **Changed**: `src/app/globals.css` — the beam sweep and the arc spin keyframes, next to the
  animations already there.
- **Changed**: `e2e/learner-account.spec.ts` — the covered wait, which jsdom cannot observe.
- **Reused unchanged**: `useAccountSubmission`, `AccountConfirmation`, `TurnstileChallenge`,
  `DeleteAccountModal`, `Button`, and the global `prefers-reduced-motion` block.
- No new dependency. No domain, adapter or persistence code is touched.

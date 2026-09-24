## Why

The account emails are hard to read in the Gmail app on iPhone with dark mode on. Gmail iOS
ignores the `color-scheme` meta the shell relies on and inverts every solid colour, but leaves
`background-image` alone. The cinema gradient is a background image, so the frame stays dark,
while the `#f4f1ea` heading and body are inverted to dark gray on that dark frame, the black
letterbox bars turn white, the rule turns white and both buttons flip. Mailpit renders the HTML
untouched, which is why the problem never showed up locally. Every account email a learner opens
in Gmail on iPhone — including the one that confirms their address — is affected today.

## What Changes

- Paint the letterbox bars and the rule through a one-colour `background-image` as well as their
  `background-color`, so Gmail's inversion, which spares images, leaves them as designed.
- Give the shell an embedded stylesheet that only Gmail applies (the `u + .body` selector) and wrap
  the light neutral text in `mix-blend-mode` layers that cancel Gmail's inversion, so the wordmark,
  heading, body and fine print read in their cinema colours again. Both buttons keep inverting as
  a unit — fill and label together — which already reads.
- Add Outlook dark-mode overrides (`[data-ogsc]`, `[data-ogsb]`) that pin the same colours when an
  Outlook app re-maps them.
- Correct the `transactional-email` spec: declaring `color-scheme: dark` is kept, but it is no
  longer claimed to stop inversion, and the requirement now states what the message does against
  a client that inverts regardless.

## Non-goals

- A light variant of the emails. The palette stays baked dark.
- Gmail apps showing a non-Google account (Gmail's "GANGA" mode), which drops embedded styles,
  gradients and blend modes. There the fallback is Gmail inverting the whole message evenly — a
  light message with dark text, readable but not cinema-styled. No extra work targets it.
- Changing any email copy, subject, or the templates' props.
- Automated rendering in real mail clients. Mailpit and Playwright do not reproduce Gmail's
  inversion; the final check is a real message opened in Gmail on the user's iPhone.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `transactional-email`: the dark-palette requirement stops claiming `color-scheme` prevents
  inversion, and gains a requirement that the message keeps its cinema colours when a client
  (Gmail iOS, Outlook apps) inverts colours anyway.

## Impact

- `src/emails/_shared/account-email.tsx` and its test — the shared shell every account email uses.
- The five account templates under `src/emails/*` render through the shell and change only through
  it; their props and copy stay the same.
- No dependency, API or message-file changes.

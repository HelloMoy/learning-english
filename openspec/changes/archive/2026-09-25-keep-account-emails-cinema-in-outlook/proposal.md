## Why

In the Outlook app on iPhone with dark mode on, the account emails lose the cinema look: the
near-black frame turns a flat mid gray (`#4c4c4e`) and the gold glow is gone. Two probe emails
opened on the user's iPhone showed why. Outlook iOS leaves neutral grays alone (`#000000`,
`#111111`, `#1a1a1a` and `#080808` came back unchanged) but re-maps any tinted colour, however
dark: `#08080b` came back as `#4c4c4e` and the `#26262f` rule as `#4c4c56`. It also draws no CSS
gradient at all, linear or radial, even over a neutral ground, and neither a one-colour gradient
nor an `[data-ogsb]` override stops the re-mapping. It does draw a CSS `background-image: url(...)`.

The same probes confirmed the Gmail app on iPhone already renders every account email correctly
since the previous change; the one broken Gmail screenshot was sent minutes before that change
reached production.

## What Changes

- The frame's ground and the rule move to neutral grays (`#080808` and `#262626`), which Outlook
  iOS does not re-map. On screen they are indistinguishable from `#08080b` and `#26262f`.
- The cinema glow is also painted by a hosted PNG, baked from the same two radial layers over the
  neutral ground and served from the app's `public/` folder. It sits on a layer of its own, above
  the CSS gradients, stretched to the frame, so a client that draws images but not gradients —
  Outlook iOS — still shows the glow, and a client that blocks images still gets the gradients.
- The image's address is built from the origin of the link the email delivers, so an email sent by
  the develop preview loads the image from the develop preview, and one from production from
  production.
- Correct the `transactional-email` spec: the ground colour, the rule colour, the glow image, and
  what Outlook iOS was found to do.

## Non-goals

- The call-to-action buttons in Outlook iOS. Outlook re-maps both (the gold to a dark gold with a
  light label, the destructive fill to a lighter red); both still read, and no probed technique
  stops it without an image of the button.
- Outlook for Windows, which needs VML for any background image. Not probed; untouched.
- Changing the app's `--background` token. Only the email moves to the neutral gray.
- A light variant, copy, subjects or template props.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `transactional-email`: the dark-palette requirement names the neutral ground and the glow image;
  the inversion requirement names the neutral rule and records Outlook iOS's behaviour.

## Impact

- `src/emails/_shared/account-email.tsx` and its test — the shared shell of all five account emails.
- New static asset `public/emails/cinema-glow.png`, loaded by mail clients from the deployed app.
- No dependency, API, message-file or template-prop changes.

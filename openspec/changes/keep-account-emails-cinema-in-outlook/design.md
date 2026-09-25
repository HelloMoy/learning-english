## Context

`src/emails/_shared/account-email.tsx` is the shell all five account emails render through. After
`account-emails-survive-dark-mode-inversion` it reads correctly in the Gmail app on iPhone, but the
Outlook app on iPhone (dark mode) shows the frame as flat `#4c4c4e` gray with no glow.

Two probe emails, sent through Resend and opened on the user's iPhone, measured what Outlook iOS
does (colours sampled from the screenshots):

| Probe strip                                  | Sent                    | Outlook iOS shows       |
| -------------------------------------------- | ----------------------- | ----------------------- |
| `background-color`                           | `#000000`               | `#000000`               |
| `background-color`                           | `#111111`, `#1a1a1a`    | unchanged               |
| `background-color`                           | `#080808`               | unchanged               |
| `background-color`                           | `#08080b`               | `#4c4c4e`               |
| `background-color` + one-colour gradient     | `#08080b`               | `#4c4c4e`               |
| `background-color` + `[data-ogsb]` override  | `#08080b`               | `#4c4c4e`               |
| `background-color` + one-colour gradient     | `#26262f`               | `#4c4c56`               |
| `background-color`                           | `#262626`               | unchanged               |
| `background-color`                           | `#e7b64c`               | `#684700`               |
| radial or linear gradient over `#080808`     | glow / gold ramp        | not drawn               |
| `background-image: url(png)` over `#080808`  | image                   | drawn, sized as asked   |
| `bgcolor` + `background` HTML attributes     | image                   | not drawn               |

So Outlook iOS keeps neutral grays and re-maps any tinted colour however dark — `#08080b` has a
hint of blue, `#26262f` more. It ignores the one-colour gradient and `[data-ogsb]`, and draws no
CSS gradient at all, but does draw a CSS `url()` background image.

The same round confirmed Gmail iOS renders the current shell and the neutral-gray candidate alike:
cinema frame, black bars, legible text, rule visible.

## Goals / Non-Goals

**Goals:**

- The frame reads near-black in Outlook iOS, and the bars and rule stay as designed.
- The gold glow shows in Outlook iOS.
- Gmail iOS, Apple Mail and Mailpit render as they do now.

**Non-Goals:**

- The buttons in Outlook iOS (re-mapped, still readable — see proposal).
- Outlook for Windows and its VML backgrounds.
- The app's `--background` token.

## Decisions

### 1. Fills that must stay dark are neutral grays

The ground goes from `#08080b` to `#080808` and the rule from `#26262f` to `#262626`. Each keeps
its lightness and loses its tint (≤ 3/255 on one channel for the ground), which the eye cannot tell
apart on a phone but Outlook iOS treats as the difference between "leave" and "re-map". The
letterbox is `#000000` already. The two radial layers' outer stop is the ground, so it moves too,
and the glow wash (`--glow` at 16% over the ground) is recomputed over `#080808`:
`0.16 × (240,200,105) + 0.84 × (8,8,8)` = `(45.1, 38.7, 23.5)` → `#2d2718`, two steps of blue
below today's `#2d271a`. The wash is part of a gradient, which Outlook iOS does not draw, so its
tint does not matter there.

`CINEMA.ground` stops mirroring `--background` exactly; its comment says why.

_Alternative:_ keep `#08080b` and pin it for Outlook. The probe shows neither `[data-ogsb]` nor a
one-colour gradient does that in Outlook iOS.

### 2. The glow is also a hosted PNG on a layer of its own

Outlook iOS draws `url()` backgrounds but no gradients, so the glow has to reach it as an image.
The shell nests one full-width `Section` inside `Body`'s cell (which keeps the CSS gradients) and
gives it only `background-image: url(<origin>/emails/cinema-glow.png)`, `background-size:
100% 100%`, `background-repeat: no-repeat` — no colour. The bars and the frame move inside it.

- **Stretched to 100% × 100%**: CSS percentage radial gradients scale with their box, so a bitmap
  of the same gradients stretched to the box draws the same glow at any width and height.
- **Opaque, baked over `#080808`**: where the image loads it covers the CSS gradients beneath, so
  the glow is never painted twice; where it does not, the gradients show.
- **Its own layer**: Gmail's web client is documented to drop an element's whole `style` when it
  holds a `url()`. On a layer that holds nothing else, that costs the image only; the ground colour
  and gradients live on the cell underneath.
- **Gmail iOS** spares background images, so the image stays as designed there as the gradients do.

_Alternatives:_ the `background` HTML attribute — not drawn by Outlook iOS (probe W). One
`background-image` list holding both the `url()` and the gradients — a client that rejects a
gradient may drop the whole declaration, and Gmail web would strip the ground with it.

### 3. The image address comes from the email's own link

Every account email's link points at the deployment that sent it (Better Auth builds it from the
app's base URL; the password-changed notice links to the app directly). The shell resolves
`/emails/cinema-glow.png` against that link's origin, so develop-preview mail loads the develop
asset, production mail the production one, and Mailpit mail `localhost`. No new prop, no env read
in the template. The proxy's matcher skips any path with a dot, so the file is served as-is.

### 4. The PNG is baked once, from the same numbers

The image is 600 × 900, opaque, drawn by evaluating the two CSS radial gradients (same centres,
radii, stops and colours as the shell) per pixel over `#080808` and encoding with sharp. It is a
generated asset: committed, not rebuilt on install. The design records the parameters; if the
gradients in the shell change, the PNG is baked again with them.

## Risks / Trade-offs

- [Remote images blocked] → the CSS gradients underneath still draw in clients that support them;
  Outlook iOS then shows the flat neutral frame, still near-black.
- [Proportions differ from 600 × 900] → stretching distorts the bitmap exactly as the CSS gradients
  distort with their box, so the shape matches; upscaling a smooth glow does not visibly soften it.
- [8-bit banding in the dark ramp] → the same as the CSS gradient's; accepted.
- [The develop preview is behind Vercel Authentication] → mail clients fetch images anonymously,
  so an email sent by `develop.english-course.online` cannot load its glow image: Gmail and Apple
  Mail fall back to the CSS gradients, Outlook iOS to the flat neutral frame. Production is public,
  so its mail is unaffected. Accepted for a preview.
- [An email opened after the asset moves] → the image 404s and the gradients remain. The path is
  new and dedicated (`/emails/`), so nothing else should move it.

## Testing strategy

Vitest unit tests on rendered HTML, colocated in `src/emails/_shared/account-email.test.tsx`,
mirroring its pattern (`// @vitest-environment node`, `render()` from `react-email`,
Arrange/Act/Assert, faker copy, colour literals hardcoded as the contract):

- The ground is `#080808`, and `#08080b` appears nowhere; the radial layers end on `#080808`.
- The rule is `#262626` with its one-colour gradient, and `#26262f` appears nowhere; the
  `[data-ogsb]` rules carry the new values.
- A layer with no `background-color` carries `url(<origin of the link>/emails/cinema-glow.png)`,
  sized `100% 100%` and not repeated, where the origin is a faker URL's origin.

The per-template tests assert copy and stay unchanged. No Playwright spec: no browser reproduces
Outlook iOS. The rendered emails are sent through Resend to the user's Outlook and Gmail inboxes
and checked on the iPhone.

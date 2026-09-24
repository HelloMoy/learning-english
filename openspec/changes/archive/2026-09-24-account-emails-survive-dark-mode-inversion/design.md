## Context

`src/emails/_shared/account-email.tsx` is the one shell all five account emails render through.
It paints the Immersion Cinema dark palette with inline styles: a `#08080b` ground under two
radial gradients (as `background-image`), black letterbox bars, `#f4f1ea` heading and body,
`#9b968c` fine print, a `#d9a37a` link, a `#26262f` rule, and a gold or destructive button. Its
head declares `color-scheme: dark`, on the belief that this stops clients re-mapping the palette.

Screenshots from the Gmail app on iPhone in dark mode show why that belief fails. Gmail iOS
ignores `color-scheme` and inverts lightness of every solid colour, keeping hue, but never touches
`background-image`:

| Element          | Source colour                  | In Gmail iOS dark                | Why                         |
| ---------------- | ------------------------------ | -------------------------------- | --------------------------- |
| Letterbox bars   | `#000000`                      | white                            | colour inverted             |
| Frame ground     | radial gradients (image)       | still dark                       | images spared               |
| Heading, body    | `#f4f1ea`                      | dark gray on dark — barely reads | colour inverted, ground not |
| Fine print       | `#9b968c`                      | mid gray — reads                 | mid gray inverts to itself  |
| Link             | `#d9a37a`                      | darker bronze — reads            | hue kept, lightness lowered |
| Gold button      | `#e7b64c` / label `#1a1200`    | dark gold / white label          | both inverted together      |
| Destructive      | `#331512` / label `#ef9d8c`    | light pink / dark red label      | both inverted together      |
| Rule             | `#26262f` border               | white                            | colour inverted             |

Mailpit renders the HTML untouched, so every local check passed. react-email's `render` keeps a
doctype, a `<style>` element in `<Head>`, and a `className` on `<Body>` (probed), which is what the
Gmail-only selector below needs.

## Goals / Non-Goals

**Goals:**

- Heading, body, wordmark and fine print read in their cinema colours in Gmail iOS dark mode.
- Letterbox bars stay black and the rule stays dark.
- Both buttons still read, even where they invert.
- Outlook apps that re-map colours get told the intended ones.
- Nothing changes in clients that do not invert (Mailpit, Apple Mail, Gmail web light).

**Non-Goals:**

- Gmail showing a non-Google account ("GANGA"): no `<style>`, gradients or blend modes. It keeps
  today's even-inversion fallback.
- A light variant, copy changes, or template prop changes.

## Decisions

### 1. Solid fills that must not flip are also painted as a one-colour gradient

Letterbox bars carry `backgroundImage: linear-gradient(c, c)` next to their `backgroundColor: c`. Gmail spares images, so they stay as designed; a client that drops images
still has the colour. The rule cannot be an image as a border, so it becomes a 1px-high block with
no border, painted by `backgroundColor` and the same one-colour gradient.

_Alternative:_ drop every background image so Gmail inverts the whole message evenly. Readable, but
it turns the email light in Gmail dark mode and loses the cinema look for the client that most of
the learners use. Kept only as the GANGA fallback, which happens on its own.

### 2. Light neutral text is pinned with Remi Parmentier's blend-mode layers

The head gains a stylesheet selected through `u + .body` — Gmail replaces the doctype with `<u></u>`
right before the body, so only Gmail matches it — with the body carrying `className="body"`:

```css
u + .body .gmail-screen { background: #000; mix-blend-mode: screen; }
u + .body .gmail-difference { background: #000; mix-blend-mode: difference; }
```

Wordmark text, heading, body and both fine-print lines render as
`<span class="gmail-screen"><span class="gmail-difference">…</span></span>`. The arithmetic, with
Gmail inverting lightness `v → 1 − v` of both the text and the layers' black:

- Not inverted: white text on black, `difference` against black is identity, `screen` of black over
  the frame is transparent → white text on the frame.
- Inverted: dark text on white, `difference` against the (inverted) white outer layer flips it back
  to light-on-black, `screen` → light text on the frame.

Only neutral colours survive this: `difference` inverts RGB, which flips hue, while Gmail's inversion
keeps hue. The gold wordmark dot and the bronze link would come out blue, so they are **not** wrapped
— Gmail darkens them with their hue kept, and the screenshots show both still read.

_Alternative:_ `@media (prefers-color-scheme: dark)` or `color-scheme` alone — Gmail honours neither.

### 3. The layers are blocks, except in the wordmark

Found while checking decision 2 under a simulated Gmail inversion (Playwright, lightness-inverting
every computed colour and putting `<u>` before `.body`). As inline spans, the two layers' boxes
differ by a fraction of a pixel and the inverted black shows through as hairlines along every
line of text. As `inline-block` the horizontal ones went, but wherever a layer's edge falls on a
fractional pixel, anti-aliasing blends the two layers only partly and a vertical hairline shows.
As `display: block` the layers take the frame's edges — whole pixels, from its 32px padding — and
the heading, body and fine print came out clean at 375 and 390 wide, at 1x and 3x.

The wordmark cannot be a block: its gold dot sits between the two words and must stay outside the
layers (decision 2). Its word layers stay `inline-block`, and the simulation still draws faint
hairlines beside the dot at some widths. The alternatives were worse — the whole wordmark as one
block turns the dot blue, and leaving it unwrapped keeps it dim — so this is left to the device
check.

### 4. Both buttons invert as a unit

Planned first: paint the gold with a one-colour gradient and pin the dark label with mirror-image
layers (`multiply` on black over `difference` on white). The arithmetic holds, but the simulation
drew dark hairlines on the gold at the label's fractional edges, and a label cannot become a block
inside react-email's `Button` without moving its padding, which Outlook desktop reads.

Left alone, Gmail inverts a button's fill and label together: dark gold with a light label, or a
light pink warning button with a dark red label. Both read — the user's own screenshots show
them — so neither button carries a gradient or a layer.

### 5. Outlook overrides in the same stylesheet

Outlook.com and the Outlook apps mark elements whose colours they re-map with `data-ogsc` (text) and
`data-ogsb` (background) on an ancestor, so `[data-ogsc] .cinema-foreground { color: #f4f1ea !important }`
and friends restore them. The classes that carry these rules are the ones the text and fills already
need; the colours come from the same literals the inline styles use, so one constant feeds both.

### 6. Colours live in one palette object

Today the literals are repeated inline. The stylesheet needs them too, so the shell gains a single
`CINEMA` palette constant (still commented with the `globals.css` token each mirrors) that the inline
styles, the one-colour gradients and the embedded stylesheet all read from. That keeps "change a
colour in one place" true after the change.

## Testing strategy

All coverage is Vitest unit tests on rendered HTML, colocated in
`src/emails/_shared/account-email.test.tsx`, mirroring its existing pattern (`// @vitest-environment
node`, `render()` from `react-email`, Arrange/Act/Assert, faker copy, colour literals hardcoded as
the contract):

- Letterbox bars and rule each carry `linear-gradient(<colour>,<colour>)` matching their
  `background-color`.
- The head stylesheet holds the `u + .body` screen/difference rules as blocks, the wordmark's
  `inline-block` override, and the body carries the `body` class.
- The heading, body and fine-print copy sit inside a `gmail-screen` > `gmail-difference` pair; the
  link and wordmark dot do not.
- Neither button carries a gradient, and neither label sits in a blend layer.
- The stylesheet carries `[data-ogsc]` and `[data-ogsb]` rules.
- Existing tests keep passing, except the `color-scheme` test, renamed to match the corrected spec.

The per-template tests (`verify-email.test.tsx`, etc.) assert copy and must stay green unchanged.

No Playwright spec: neither Playwright nor Mailpit reproduces Gmail's inversion. The rendered
templates were checked by hand through Playwright MCP, plain and under a simulated Gmail iOS
inversion. The check on a real iPhone is out of this change's tasks; the user runs it once the
change is deployed.

## Risks / Trade-offs

- [Gmail changes its DOM and `u + .body` stops matching] → The layers then match nothing and the
  message falls back to today's rendering; no worse than now.
- [Gmail's inversion is not exactly `1 − v`] → Heading and body come back close to, not exactly,
  `#f4f1ea` (a slight cool tint). Acceptable; confirmed on a real iPhone after deploy.
- [The wordmark's inline layers show hairlines beside the dot on a real iPhone] → Checked on the
  user's iPhone after deploy.
  Fallback: leave the wordmark unwrapped; it then reads dim in Gmail dark mode, as today.
- [Gmail Android partially inverts and may treat the black and white layers differently] → Mitigated
  only by device testing if an Android device is available; otherwise an accepted unknown.

## Open Questions

- Does the user also read these emails in the Outlook app on iPhone? The screenshots so far are the
  Gmail app. Decision 5 is cheap, but its effect is unverified until a screenshot from Outlook.

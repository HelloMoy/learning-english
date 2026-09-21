## Context

`src/emails/_shared/account-email.tsx` is the single shell behind all three account emails;
`verify-email`, `reset-password` and `delete-account` each render it and add nothing but preview
props. Its `styles` object is light: `#f6f1e6` ground, white card, black button, no wordmark and no
gradient. `composeAccountEmail` renders it outside any request, passing `{ lang, copy, url }` and
translating the six copy slots itself.

Three constraints shape everything below:

- **A mail client is not a browser.** No `color-mix()`, no CSS custom properties, no external
  stylesheet, no webfont worth relying on, and Gmail and Outlook frequently drop
  `background-image`. Every value has to be a literal, inline, with a fallback that degrades to
  something legible.
- **The email cannot know the learner's theme.** `next-themes` is a browser concern. The palette is
  baked at render time, and `cinema-theme-tokens` already settles which one: dark is the default a
  visitor is served, so dark is what the email commits to.
- **The copy contract is fixed.** `AccountEmailCopy`'s six slots and the `Emails.*` message keys
  are consumed by `composeAccountEmail`; this change must not move them.

## Goals / Non-Goals

**Goals:**

- One shell, redrawn in the Immersion Cinema dark palette with the letterbox composition.
- The `CinemaBackground` gradient carried into the message with its `color-mix()` resolved, layered
  over a `background-color` that survives a client stripping images.
- A call to action whose colour states what the link does: gold for routine, destructive for the
  one irreversible link.
- No change to `composeAccountEmail`, to the message files, or to the three template files beyond
  declaring which action they carry.

**Non-Goals:**

- A light variant, a per-template layout, embedded fonts, an Outlook VML background, or any change
  to sending. All listed in the proposal's non-goals and not revisited here.

## Decisions

### The action kind is a prop the template sets, not something the shell infers

The shell needs to know whether its link is destructive. Three options:

1. **Infer from the copy** — e.g. look for the word "delete". Rejected: the copy is localized into
   three languages and is free to change; a shell that reads English strings to pick a colour is a
   bug waiting for a translator.
2. **Widen `AccountEmailProps`** so `composeAccountEmail` passes the kind. Rejected: it already
   knows the kind (`AccountEmailKind`), but making it pass a presentation concern spreads styling
   into the compose layer, which exists to resolve locale and copy.
3. **The template declares it.** Chosen. `DeleteAccount` renders
   `<AccountEmail {...props} action="destructive" />`; the other two pass nothing and take the
   default. The public `AccountEmailProps` that `composeAccountEmail` satisfies is unchanged, and
   the fact that deletion is destructive lives in the delete template — the one file that is about
   deletion.

The prop is `action: AccountEmailAction`, `"routine" | "destructive"`, defaulting to `"routine"`.
`destructive` is the word the project's `Button` already uses for this treatment, so the vocabulary
carries over instead of inventing a synonym.

### The gradient is three literal layers over a solid ground

`CinemaBackground` composes `radial-gradient(… color-mix(in oklab, var(--glow) 16%, var(--background)) …)`.
Resolved for the dark theme, `--glow #f0c869` at 16% over `--background #08080b` is `#2d271a`, and
the focal layer's 24% glow becomes `rgba(240, 200, 105, 0.24)`. Both go into a single
`backgroundImage` on `<Body>`, focal layer first so it paints over the base wash, with
`backgroundColor: "#08080b"` beneath. A client that honours neither still renders near-black, and
every text colour is chosen against that near-black rather than against the glow — so the message
is legible whether or not the gradient survives.

The letterbox scrim is not a fourth gradient layer. It is the top black bar, which the composition
already calls for; drawing both would darken the same 26px twice.

### The bars are full-bleed `Section`s, the content stays in a `Container`

The black bars sit directly in `<Body>`, outside the `<Container>`, so they run edge to edge like a
real letterbox while the content keeps its 480px measure. An empty `Section` collapses in several
clients, so each bar carries a zero-size non-breaking space and an explicit `height`, `lineHeight`
and `fontSize: 0` — the standard spacer-row idiom.

### The destructive fill is a solid hex, not `rgba()`

The app's `destructive` button variant is a translucent tint (`bg-destructive/10`). Word-rendered
Outlook ignores `rgba()` outright, which would leave the button with no fill at all, so the tint is
flattened against the ground it sits on: `#b3402f` over `#08080b` resolves to `#331512`. The label
`#ef9d8c` reads at 7.7:1 on that fill, and the `#b3402f` border at 3.5:1 against the page — both
clear of WCAG AA. Same treatment, one fewer thing for a client to drop.

### Styles stay an inline `styles` object

The file already keeps one `styles` constant of inline style objects and `react-email` inlines
them. Keeping that beats introducing the `Tailwind` component for one file: the app's Tailwind
config is built on CSS custom properties, which is exactly what a mail client cannot resolve, so
the tokens would have to be hardcoded anyway. The object gains a comment naming the globals.css
token each literal came from, so the next palette change has a thread to follow.

### The dark scheme is declared, not assumed

`<Head>` gains `<meta name="color-scheme" content="dark" />` and
`<meta name="supported-color-schemes" content="dark" />`. Without them, Gmail's and Outlook.com's
dark-mode filters re-map an already-dark palette and the gold comes out muddy.

## Testing strategy

All three layers of the project's stack, used where each one belongs:

- **Vitest, node environment** — the only layer this change needs. Email templates render to an
  HTML string through `render()` from `react-email`; there is no DOM to interact with and no
  browser flow, so neither RTL nor Playwright applies. This mirrors the existing
  `src/emails/verify-email/verify-email.test.tsx`, which is already `// @vitest-environment node`
  and asserts on the rendered string.
- **New: `src/emails/_shared/account-email.test.tsx`** — the shell has no test of its own today.
  It gets one, covering the requirements the shell alone is responsible for: the `#08080b` ground
  present as a `background-color` and not only inside the gradient, both radial layers present, the
  two black bars, the wordmark with its gold dot, the `color-scheme` meta, and the two call-to-action
  treatments (gold for `routine`; the destructive fill, border and label — and no `#e7b64c` button
  — for `destructive`).
- **Extended: the three template tests** — each gains one case asserting the treatment it carries,
  so the wiring is covered where it is declared. Their existing cases (link twice, every copy line,
  `lang`, plain text, preview props) are untouched and must keep passing.
- **`@faker-js/faker` for the URL**, as the existing tests already do. The colour literals are
  hardcoded on purpose: the test verifies behaviour tied to the exact value, which is the one case
  the project's conventions say to hardcode.
- **Visual check** — `pnpm email:dev` serves the three templates at `localhost:3030`. The rendered
  result is reviewed in the browser before the change is called done; a test asserting on hex
  strings proves the values shipped, not that the composition reads well.

## Risks / Trade-offs

- **Gmail and Outlook drop the gradient** → Accepted, and mitigated by the `background-color`
  beneath it: the fallback is flat `#08080b`, which is still the brand. Contrast is computed
  against that flat ground, never against the glow.
- **Word-rendered Outlook ignores `background-image` entirely and renders the bars as plain table
  rows** → Accepted. The composition degrades to centred cream-on-black, which is legible and still
  recognisably the product. A VML background is out of scope.
- **Geist will not load in most clients** → The stack is
  `Geist, "Helvetica Neue", Helvetica, Arial, sans-serif`. What carries the wordmark is its
  letter-spacing and weight, both of which survive the fallback.
- **A dark email in a light inbox is a strong choice** → Deliberate. `cinema-theme-tokens` already
  makes dark the default the product serves, and the alternative — a light email opening a dark app
  — is the inconsistency this change exists to remove.
- **Asserting on hex literals makes the tests brittle to a palette change** → Intended. The palette
  is a contract with `globals.css`; if a token moves, the email must be updated deliberately and a
  failing test is the reminder.

## Open Questions

None blocking. One deferred: whether to ship a pre-rendered PNG of the glow for Outlook. That is a
separate change, and only worth opening if the flat fallback proves unacceptable in a real inbox.

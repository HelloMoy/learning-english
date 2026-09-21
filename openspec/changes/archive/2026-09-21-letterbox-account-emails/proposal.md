## Why

The three account emails are the only surface of the product that reaches a learner outside the
app, and they look like they belong to a different one: `src/emails/_shared/account-email.tsx`
renders cream `#f6f1e6` paper, a white card and a black button, with no gradient and no wordmark.
Immersion Cinema is a dark design — `cinema-theme-tokens` already states the dark variant is the
default a visitor is served — so an email in the light palette contradicts the app a learner is
about to open, and the first thing a new sign-up ever sees from the course is off-brand.

## What Changes

- Redraw the shared account-email shell on the Immersion Cinema **dark** tokens: near-black
  `#08080b` ground, cream `#f4f1ea` text, `#9b968c` for fine print.
- Carry the `CinemaBackground` gradient into the message: the same two radial layers and the
  letterbox scrim, with `color-mix()` resolved to static hex because no mail client supports it.
- Adopt the **Letterbox** composition: a solid black bar across the top and the bottom cropping the
  glow into a film frame, content centred between them.
- Print the `ENGLISH·COURSE` wordmark, gold middle dot included, above the heading.
- Give the call to action the palette its action deserves: the gold `#e7b64c` primary for
  `verify-email` and `reset-password`, and the destructive tinted treatment
  (a `#331512` fill on a `#b3402f` border, `#ef9d8c` label) for `delete-account`, which is the
  one irreversible link the course sends.
- Add the `color-scheme` / `supported-color-schemes` meta so Gmail and Outlook.com stop inverting a
  palette that is already dark.
- Keep every colour reachable by a client that drops `background-image`: the gradient layers sit on
  top of a `background-color` fallback, so the worst case is flat near-black, never white.

The six `AccountEmailCopy` slots — `preview`, `heading`, `body`, `button`, `linkIntro`, `ignore` —
and the `Emails.*` message keys are untouched. No template file, no locale file, no copy changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `transactional-email`: adds a requirement that the shared shell renders in the Immersion Cinema
  dark palette with the letterbox composition, and that the destructive email's call to action is
  visually distinct from the other two. The existing requirements on links, locales, plain text,
  preview props and SMTP are unchanged.

## Non-goals

- **No copy changes.** Subjects, headings, bodies and button labels stay exactly as they are in
  `en.json`, `es.json` and `pt.json`.
- **No new template.** All three emails keep sharing one shell; this change does not give any of
  them a layout of its own.
- **No light variant.** The emails commit to dark, the way the app's default does. There is no
  `prefers-color-scheme` branch to design or test.
- **No webfont.** Geist is requested with a real fallback stack and nothing breaks without it; the
  change does not embed or host font files for mail clients.
- **No Outlook VML background.** The flat `background-color` fallback is the accepted result on
  Word-rendered Outlook; a pre-rendered glow image is a separate change if it is ever wanted.
- **No change to sending.** `EmailSender`, the SMTP adapter, Mailpit and `composeAccountEmail` are
  not touched.

## Impact

- `src/emails/_shared/account-email.tsx` — the whole visual shell is rewritten.
- `src/emails/_shared/account-email.test.tsx` — new; the shell has no test of its own today, its
  behaviour is only covered indirectly through the three templates.
- `src/emails/{verify-email,reset-password,delete-account}/*.tsx` — each needs to tell the shell
  which call to action it carries. Their tests gain a case for it.
- `openspec/specs/transactional-email/spec.md` — one added requirement, via the delta spec.
- No dependency, schema, route or environment change.

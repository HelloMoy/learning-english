# transactional-email Specification

## Purpose
TBD - created by archiving change auth-and-database-foundation. Update Purpose after archive.
## Requirements
### Requirement: Emails are React Email templates rendered to HTML and plain text

Every email the application sends SHALL be a React Email template under `src/emails/<name>/<name>.tsx`. Sending SHALL render the template to HTML and derive a plain-text alternative from it, and both SHALL go out in the same message. Each template SHALL declare preview props so the preview server can render it without a running app.

The first templates SHALL be `verify-email` and `reset-password`. Each SHALL carry exactly one call-to-action link, and the link SHALL also be printed as text for clients that do not render buttons.

#### Scenario: A verification email carries its link twice
- **WHEN** `verify-email` is rendered with a verification URL
- **THEN** the HTML holds a button linking to that URL and the URL printed as text, and the plain-text part holds the URL

#### Scenario: The preview server lists the templates
- **WHEN** `pnpm email:dev` runs
- **THEN** its preview lists `verify-email` and `reset-password` and renders both from their preview props

### Requirement: Emails are sent in the locale the learner acted in

An email SHALL be written in the locale of the route the learner was on when they caused it: the sign-up page's locale for verification and the forgot-password page's locale for a reset. Its subject, preview text, body and button SHALL come from the `Emails.<Template>.*` namespace of that locale's messages in `en`, `es` and `pt`. The link SHALL point back into that same locale.

#### Scenario: A Portuguese sign-up gets a Portuguese email
- **WHEN** a visitor signs up on `/pt/sign-up`
- **THEN** the verification email's subject and body render from `pt.json`, and its link returns to a `/pt/` route

### Requirement: Emails are sent over SMTP through a sender port

The application SHALL send email through an `EmailSender` interface with one SMTP implementation. The SMTP host, port, security, credentials and `from` address SHALL come from the validated server environment. In development they SHALL point at the Compose Mailpit service, which accepts any recipient and delivers nothing. In production they SHALL point at Resend's SMTP relay. No code path SHALL differ between the two.

A send that fails SHALL surface as a failure to its caller and SHALL be logged. It SHALL NOT be swallowed.

#### Scenario: Development mail lands in Mailpit
- **WHEN** a password reset is requested locally
- **THEN** the message appears in the Mailpit inbox at `http://localhost:8025`

#### Scenario: A refused send is reported
- **WHEN** the SMTP server rejects a message
- **THEN** the sender reports the failure to its caller instead of resolving as sent

### Requirement: The delete-account email confirms an irreversible action

The application SHALL provide a `delete-account` React Email template, localized under `Emails.DeleteAccount.*` in `en`, `es` and `pt`, sent in the locale of the page where deletion was requested. It SHALL state that following the link deletes the account and all progress permanently, that nothing happens if the learner ignores the email, and that the learner must be signed in when following it. Like the other templates, it SHALL carry exactly one call-to-action link, also printed as text, and it SHALL declare preview props.

#### Scenario: The email states the consequence and the escape
- **WHEN** `delete-account` is rendered in English
- **THEN** it says the deletion is permanent, says that ignoring the email keeps the account, and holds the link as a button and as text

### Requirement: Account emails render in the Immersion Cinema dark palette

Every account email SHALL render in the Immersion Cinema dark palette, from one shared shell, so
the message a learner reads matches the app they are about to open. The shell SHALL ground the
message on the neutral near-black `#080808`, set body text in `#f4f1ea` and fine print in
`#9b968c`, and print the `ENGLISH·COURSE` wordmark with its gold `#e7b64c` middle dot above the
heading.

The ground SHALL be a neutral gray (equal red, green and blue) rather than the app's `#08080b`
token, because the Outlook app on iOS re-maps any tinted colour in dark mode — `#08080b` comes
back as a mid gray `#4c4c4e` — while it leaves neutral grays as they are. The two are
indistinguishable on screen.

The shell SHALL carry the `CinemaBackground` gradient — its two radial layers and its letterbox
scrim — as static colour values, because mail clients do not support `color-mix()`. Those layers
SHALL sit on top of a `background-color` of `#080808`, so a client that drops background images
renders flat near-black rather than falling back to white.

The same two radial layers SHALL also be painted by a hosted PNG, `emails/cinema-glow.png`, baked
over the `#080808` ground and served from the app's public folder. The image SHALL sit on a layer
of its own inside the gradient layer, carrying only the image and its sizing — no colour — and
SHALL be stretched to cover that layer. A client that draws images but no CSS gradients, as
Outlook iOS does, then still shows the glow; a client that blocks remote images still shows the
CSS gradients; and a client that strips an element's styles because it holds a `url()` loses only
the image. The image's address SHALL be absolute, built from the origin of the link the email
delivers, so the message loads it from the deployment that sent it.

The message SHALL declare a dark colour scheme in its head. The declaration is a hint that some
clients honour; it SHALL NOT be relied on to stop a client from inverting colours — that defence
is the requirement _Account emails keep their colours when a client inverts them_.

The emails SHALL NOT offer a light variant. Immersion Cinema is a dark design and an email cannot
read the learner's stored theme, so the palette is baked.

#### Scenario: The shell renders on the cinema ground

- **WHEN** any account email is rendered
- **THEN** its body carries the `#080808` background colour, the two radial gradient layers and the
  letterbox scrim, and prints the `ENGLISH·COURSE` wordmark

#### Scenario: The ground is a neutral gray

- **WHEN** any account email is rendered
- **THEN** no background colour in it is `#08080b`

#### Scenario: The glow is also an image from the sending deployment

- **WHEN** an account email is rendered for a link on `https://develop.example.com`
- **THEN** a layer holding no background colour carries
  `url(https://develop.example.com/emails/cinema-glow.png)` stretched to cover it

#### Scenario: A client that drops background images still reads

- **WHEN** a client strips `background-image` from the message
- **THEN** the remaining `background-color` is `#080808` and every text colour on it stays legible

#### Scenario: The message declares its dark colour scheme

- **WHEN** the message is rendered
- **THEN** its head declares `color-scheme` and `supported-color-schemes` as dark

### Requirement: The letterbox composition frames every account email

The shared shell SHALL use the letterbox composition: a solid black bar across the top of the
message and another across the bottom, cropping the glow into a film frame, with the heading, body,
call to action, link and closing line centred between them.

#### Scenario: Black bars crop the frame

- **WHEN** any account email is rendered
- **THEN** a solid black bar sits above the content and another below it, and the content between
  them is centre-aligned

### Requirement: An irreversible email's call to action is visually distinct

An account email SHALL declare which kind of action its link performs, and the shell SHALL style
the call to action accordingly. A routine action — confirming an address, choosing a new password,
approving a move to another address, recovering an account after a password notice — SHALL use the
gold `#e7b64c` primary with `#1a1200` text. A destructive action SHALL instead use the destructive
treatment: a `#b3402f`-tinted fill, a `#b3402f` border and a `#ef9d8c` label, so the one irreversible
link the course sends never wears the same button as a routine one.

Both treatments SHALL meet WCAG 2.1 AA contrast against the ground they sit on.

#### Scenario: Confirming an address offers a gold button

- **WHEN** `verify-email`, `reset-password`, `change-email` or `password-changed` is rendered
- **THEN** its call to action is the gold primary

#### Scenario: Deleting an account does not

- **WHEN** `delete-account` is rendered
- **THEN** its call to action uses the destructive treatment, and no gold button appears in the
  message

### Requirement: The change-email email confirms the move on the address on file

The application SHALL provide a `change-email` React Email template, localized under
`Emails.ChangeEmail.*` in `en`, `es` and `pt`, sent in the locale of the page where the change was
requested. It SHALL be addressed to the account's current address, SHALL name the address the account
would move to, and SHALL state that ignoring the email leaves the address unchanged. Like the other
templates, it SHALL render from the shared shell in the Immersion Cinema dark palette, carry exactly
one call-to-action link, also printed as text, and declare preview props.

The address the change would move to SHALL reach the template as a value passed to the message, so the
copy stays in the locale's message file and no address is built into it.

#### Scenario: The email names the new address and the escape
- **WHEN** `change-email` is rendered in English for a move to `ana.g@example.com`
- **THEN** it names `ana.g@example.com`, says that ignoring the email keeps the current address, and holds the link as a button and as text

#### Scenario: A Spanish request gets a Spanish email
- **WHEN** the change is requested from `/es/profile`
- **THEN** the email's subject and body render from `es.json` and its link returns to a `/es/` route

#### Scenario: The preview server lists the template
- **WHEN** the email preview server runs
- **THEN** it lists `change-email` and renders it from its preview props

### Requirement: The password-changed email warns without carrying a key

The application SHALL provide a `password-changed` React Email template, localized under
`Emails.PasswordChanged.*` in `en`, `es` and `pt`, sent in the locale the learner acted in. It SHALL
say that the account's password was changed and that the other sessions were signed out, and its
closing line SHALL tell a learner who did not make the change to recover the account through the
link rather than to ignore the message — the one account email whose "if this was not you" is an
instruction instead of a reassurance.

Like the other templates, it SHALL render from the shared shell in the Immersion Cinema dark
palette, carry exactly one call-to-action link, also printed as text, and declare preview props. Its
action SHALL be routine, so the call to action wears the gold primary.

The link SHALL be a locale-qualified `/[locale]/forgot-password` path and SHALL carry no token.

#### Scenario: The email states the change and offers recovery
- **WHEN** `password-changed` is rendered in English
- **THEN** it says the password changed and the other devices were signed out, and its button opens the forgot-password page

#### Scenario: The email carries nothing that opens the account
- **WHEN** `password-changed` is rendered
- **THEN** its HTML and its plain text hold no `token` query parameter

#### Scenario: A Spanish change gets a Spanish notice
- **WHEN** the password is changed from `/es/profile`
- **THEN** the notice's subject and body render from `es.json` and its link opens `/es/forgot-password`

#### Scenario: The preview server lists the template
- **WHEN** the email preview server runs
- **THEN** it lists `password-changed` and renders it from its preview props

### Requirement: Account emails keep their colours when a client inverts them

The shared shell SHALL hold its cinema colours against clients that invert an email's colours in
dark mode whatever it declares: the Gmail app on iOS inverts every solid colour — backgrounds, text
and borders — but leaves background images alone, and the Outlook app on iOS re-maps every tinted
colour but leaves neutral grays alone and draws no CSS gradient.

- Both letterbox bars and the rule SHALL be painted by a one-colour `background-image` of their
  own colour as well as their `background-color`, so a client that inverts colours but spares
  images leaves them as designed, and a client that drops images still has the colour.
- Every fill that must stay dark — the ground, the letterbox bars and the rule — SHALL be a
  neutral gray, so Outlook iOS leaves it as designed: the bars `#000000` and the rule `#262626`.
- The shell SHALL carry an embedded stylesheet whose rules only Gmail applies (selected through
  the `<u>` element Gmail puts before the body, with the body carrying a dedicated class). Under
  those rules, the light neutral text — the wordmark letters, heading, body and fine print — SHALL
  sit inside blend layers (`mix-blend-mode: screen` over `mix-blend-mode: difference`, each on
  black) that cancel Gmail's inversion. The layers SHALL be blocks, so their edges fall on the
  frame's whole pixels and no hairline shows where they meet; only the wordmark's layers stay
  inline, so its gold dot keeps its place between the words. Outside Gmail these rules match
  nothing and the message renders as it does today.
- Coloured text — the gold wordmark dot and the bronze link — SHALL NOT be wrapped, because the
  blend layers invert hue; Gmail darkens them with their hue kept and they stay legible.
- Both calls to action SHALL be left to invert as a unit, fill and label together: a label cannot
  be blended back without hairlines on its fill, and an inverted button still reads — a dark gold
  button with a light label, or a light warning button with a dark one. Outlook iOS re-maps them
  the same way.
- The stylesheet SHALL also carry Outlook's dark-mode overrides (`[data-ogsc]` for text colour,
  `[data-ogsb]` for background colour) pinning the same colours, for the Outlook clients that
  honour them. Outlook iOS does not.

A client that drops embedded styles, gradients and blend modes together — Gmail showing a
non-Google account — is out of reach; there the message SHALL still invert evenly, because every
background image has a matching `background-color` underneath.

#### Scenario: Solid fills survive an inversion that spares images

- **WHEN** any account email is rendered
- **THEN** both letterbox bars and the rule each carry a one-colour `linear-gradient` background
  image of the same colour as their `background-color`

#### Scenario: The rule is a neutral gray

- **WHEN** any account email is rendered
- **THEN** the rule is painted `#262626`, and no colour in the message is `#26262f`

#### Scenario: Gmail's inversion is cancelled for light text

- **WHEN** any account email is rendered
- **THEN** its head holds a stylesheet with `u + .body` rules setting `mix-blend-mode: screen` and
  `mix-blend-mode: difference` on black as blocks, its body carries the `body` class, and the
  wordmark letters, heading, body and fine print each sit inside a screen layer wrapping a
  difference layer, while the link and the wordmark dot do not

#### Scenario: The wordmark's layers stay inline

- **WHEN** any account email is rendered
- **THEN** its stylesheet makes the blend layers inside the wordmark `inline-block`

#### Scenario: Both buttons invert as a unit

- **WHEN** any account email is rendered, with a routine or a destructive action
- **THEN** its call to action carries neither a background image nor blend layers

#### Scenario: Outlook is told the colours to keep

- **WHEN** any account email is rendered
- **THEN** its stylesheet carries `[data-ogsc]` rules restoring the text colours and
  `[data-ogsb]` rules restoring the background colours

#### Scenario: Outside Gmail and Outlook nothing changes

- **WHEN** the message is opened in a client that neither inverts colours nor matches `u + .body`
  or `[data-ogsc]`
- **THEN** it renders with the same colours, layout and text as before this change


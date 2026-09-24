## MODIFIED Requirements

### Requirement: Account emails render in the Immersion Cinema dark palette

Every account email SHALL render in the Immersion Cinema dark palette, from one shared shell, so
the message a learner reads matches the app they are about to open. The shell SHALL ground the
message on `#08080b`, set body text in `#f4f1ea` and fine print in `#9b968c`, and print the
`ENGLISH·COURSE` wordmark with its gold `#e7b64c` middle dot above the heading.

The shell SHALL carry the `CinemaBackground` gradient — its two radial layers and its letterbox
scrim — as static colour values, because mail clients do not support `color-mix()`. Those layers
SHALL sit on top of a `background-color` of `#08080b`, so a client that drops background images
renders flat near-black rather than falling back to white.

The message SHALL declare a dark colour scheme in its head. The declaration is a hint that some
clients honour; it SHALL NOT be relied on to stop a client from inverting colours — that defence
is the requirement _Account emails keep their colours when a client inverts them_.

The emails SHALL NOT offer a light variant. Immersion Cinema is a dark design and an email cannot
read the learner's stored theme, so the palette is baked.

#### Scenario: The shell renders on the cinema ground

- **WHEN** any account email is rendered
- **THEN** its body carries the `#08080b` background colour, the two radial gradient layers and the
  letterbox scrim, and prints the `ENGLISH·COURSE` wordmark

#### Scenario: A client that drops background images still reads

- **WHEN** a client strips `background-image` from the message
- **THEN** the remaining `background-color` is `#08080b` and every text colour on it stays legible

#### Scenario: The message declares its dark colour scheme

- **WHEN** the message is rendered
- **THEN** its head declares `color-scheme` and `supported-color-schemes` as dark

## ADDED Requirements

### Requirement: Account emails keep their colours when a client inverts them

The shared shell SHALL hold its cinema colours against clients that invert an email's colours in
dark mode whatever it declares: the Gmail app on iOS inverts every solid colour — backgrounds, text
and borders — but leaves background images alone, and the Outlook apps re-map colours they judge
too light or too dark.

- Both letterbox bars and the rule SHALL be painted by a one-colour `background-image` of their
  own colour as well as their `background-color`, so a client that inverts colours but spares
  images leaves them as designed, and a client that drops images still has the colour.
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
  button with a light label, or a light warning button with a dark one.
- The stylesheet SHALL also carry Outlook's dark-mode overrides (`[data-ogsc]` for text colour,
  `[data-ogsb]` for background colour) pinning the same colours.

A client that drops embedded styles, gradients and blend modes together — Gmail showing a
non-Google account — is out of reach; there the message SHALL still invert evenly, because every
background image has a matching `background-color` underneath.

#### Scenario: Solid fills survive an inversion that spares images

- **WHEN** any account email is rendered
- **THEN** both letterbox bars and the rule each carry a one-colour `linear-gradient` background
  image of the same colour as their `background-color`

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

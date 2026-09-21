## ADDED Requirements

### Requirement: Account emails render in the Immersion Cinema dark palette

Every account email SHALL render in the Immersion Cinema dark palette, from one shared shell, so
the message a learner reads matches the app they are about to open. The shell SHALL ground the
message on `#08080b`, set body text in `#f4f1ea` and fine print in `#9b968c`, and print the
`ENGLISH·COURSE` wordmark with its gold `#e7b64c` middle dot above the heading.

The shell SHALL carry the `CinemaBackground` gradient — its two radial layers and its letterbox
scrim — as static colour values, because mail clients do not support `color-mix()`. Those layers
SHALL sit on top of a `background-color` of `#08080b`, so a client that drops background images
renders flat near-black rather than falling back to white.

The message SHALL declare a dark colour scheme, so clients that adapt colours for dark mode leave
an already-dark palette alone.

The emails SHALL NOT offer a light variant. Immersion Cinema is a dark design and an email cannot
read the learner's stored theme, so the palette is baked.

#### Scenario: The shell renders on the cinema ground

- **WHEN** any account email is rendered
- **THEN** its body carries the `#08080b` background colour, the two radial gradient layers and the
  letterbox scrim, and prints the `ENGLISH·COURSE` wordmark

#### Scenario: A client that drops background images still reads

- **WHEN** a client strips `background-image` from the message
- **THEN** the remaining `background-color` is `#08080b` and every text colour on it stays legible

#### Scenario: A dark-mode client is told not to invert

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
the call to action accordingly. A routine action — confirming an address, choosing a new password —
SHALL use the gold `#e7b64c` primary with `#1a1200` text. A destructive action SHALL instead use
the destructive treatment: a `#b3402f`-tinted fill, a `#b3402f` border and a `#ef9d8c` label, so
the one irreversible link the course sends never wears the same button as a routine one.

Both treatments SHALL meet WCAG 2.1 AA contrast against the ground they sit on.

#### Scenario: Confirming an address offers a gold button

- **WHEN** `verify-email` or `reset-password` is rendered
- **THEN** its call to action is the gold primary

#### Scenario: Deleting an account does not

- **WHEN** `delete-account` is rendered
- **THEN** its call to action uses the destructive treatment, and no gold button appears in the
  message

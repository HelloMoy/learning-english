## MODIFIED Requirements

### Requirement: The control exists only where the flow is possible and useful

The header control SHALL be rendered when the app is not already running from the home screen
and the browser offers **some** way to get it there. There are two such ways, and the control
SHALL route to the one that applies:

- **Safari on an iPhone**, which exposes no install API, SHALL reach the guide. Teaching the
  flow is the only thing the application can do there.
- **A browser that has offered an install** — one that has fired `beforeinstallprompt` and
  whose event has not been spent — SHALL reach the install prompt, which confirms intent and
  hands off to the browser's own dialog.

Where both hold the install prompt SHALL win, because performing the install beats describing
it. In practice they do not overlap: Safari fires no such event.

Where neither holds — Firefox, Safari on a desktop, any browser whose event has not arrived —
**no control SHALL be rendered**. A control that opens a guide for a flow the application has
not verified would teach a menu the learner may not have.

Every one of those is a property of the browser, unknowable while rendering on the server, so
the control SHALL be decided after hydration and SHALL render nothing until then. It SHALL NOT
cause the header's other controls to move when it appears.

An app already launched from the home screen SHALL NOT offer the control: the learner has
already done it.

#### Scenario: An iPhone Safari learner who has not installed sees the guide

- **WHEN** the browser is Safari on an iPhone and the app is not running standalone
- **THEN** the control is rendered, and activating it opens the guide

#### Scenario: A browser that offered an install reaches the prompt

- **WHEN** the browser has fired `beforeinstallprompt`, its event is unspent, and the app is
  not running standalone
- **THEN** the control is rendered, and activating it opens the install prompt

#### Scenario: Everyone else does not

- **WHEN** the browser is neither iPhone Safari nor one that has offered an install, or the app
  is already running from the home screen
- **THEN** no control is rendered

#### Scenario: It is not decided during hydration

- **WHEN** the header renders on the server or during the hydration pass
- **THEN** no control is rendered, so the server and client markup agree

### Requirement: The guide is reached from a header control, in a modal

The site header SHALL carry a control that opens a modal dialog, alongside the locale and theme
chips. Where the guide is the applicable path — see *The control exists only where the flow is
possible and useful* — that dialog SHALL contain the guide. The guide is a reference a learner
returns to, not a one-shot prompt, so it SHALL remain reachable rather than appearing once and
being gone.

The control SHALL NOT use a download glyph. Nothing is downloaded, and iOS marks this flow with
the add-to-home-screen glyph, so the control SHALL use that one and thereby teach the learner
the icon they are about to hunt for. It SHALL carry the same glyph on every platform: the
control means the same thing everywhere, and only what it opens differs.

The control's accessible name SHALL describe what activating it does on that platform, so that
a learner routed to the prompt is not told they are about to be shown instructions.

The dialog SHALL carry an accessible name and SHALL be dismissible by the dialog's own means;
closing it SHALL NOT be reported to anything as a decision to never show the guide again.

#### Scenario: The header control opens the guide

- **WHEN** the learner activates the header control on iPhone Safari
- **THEN** a modal dialog containing the guide is shown

#### Scenario: The control is named and glyph-marked

- **WHEN** the control is rendered
- **THEN** it carries a localized accessible name describing what it opens on that platform,
  and the add-to-home-screen glyph

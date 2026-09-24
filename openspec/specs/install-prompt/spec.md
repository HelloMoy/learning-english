# install-prompt Specification

## Purpose
TBD - created by archiving change install-prompt-direct-confirm. Update Purpose after archive.
## Requirements
### Requirement: The application registers a pass-through service worker

The application SHALL register a service worker that carries a `fetch` handler, and that
handler SHALL do nothing but forward the request to the network.

It exists for exactly one reason: Chrome will not fire `beforeinstallprompt` for a site whose
service worker has no `fetch` handler. The worker SHALL therefore hold no cache, SHALL NOT
serve any response from storage, and SHALL NOT intercept, rewrite or defer a request. The
decision recorded against a caching worker — that the app streams video a worker cannot
usefully cache, so caching would add an invalidation layer to get wrong and nothing else —
stands unchanged.

Registration SHALL happen from the client after load, and SHALL NOT be awaited by anything the
learner is waiting for. A browser that has no service worker support, or that refuses the
registration, SHALL leave the rest of the application working exactly as it does today.

#### Scenario: The worker forwards and stores nothing

- **WHEN** a request passes through the service worker's `fetch` handler
- **THEN** the network response is returned unmodified, and no cache is read or written

#### Scenario: A browser without service worker support is unaffected

- **WHEN** the browser exposes no service worker API, or the registration is rejected
- **THEN** nothing throws, and every other part of the application behaves as before

### Requirement: The install prompt exists only where the browser can perform the install

The prompt SHALL be reachable only when the browser has offered the application an install:
that is, when `beforeinstallprompt` has fired and its event has not yet been used, and the app
is not already running from the home screen.

**The offer SHALL survive arriving before the application is ready to hear it.** Chromium fires
`beforeinstallprompt` as soon as it judges the site installable, which is routinely before the
client has hydrated, and it does not fire again. A listener attached from a component effect is
therefore not enough on its own: the event SHALL also be captured by a listener installed before
any page script runs, held, and handed to the application when it asks. Without this the prompt
never appears at all on a browser that fires early, which is the ordinary case.

The default action of `beforeinstallprompt` SHALL be prevented wherever it is captured, so that
the browser does not show its own promotion banner alongside this one.

The event arrives asynchronously and cannot be known while rendering on the server, so the
prompt SHALL be decided after hydration and SHALL be treated as unavailable until the event has
actually arrived — whether it arrived before hydration or after. A browser that never fires the
event — Firefox, Safari on any platform — SHALL therefore never reach the prompt.

#### Scenario: The event fired before the application hydrated

- **WHEN** `beforeinstallprompt` fires before any component has mounted
- **THEN** the offer is still available once the application asks

#### Scenario: The event fires after the application hydrated

- **WHEN** `beforeinstallprompt` fires while the application is running
- **THEN** the offer becomes available

#### Scenario: The browser's own banner is suppressed

- **WHEN** `beforeinstallprompt` fires, before or after hydration
- **THEN** its default action is prevented and the event is retained

#### Scenario: The event has not fired

- **WHEN** the browser has not fired `beforeinstallprompt`
- **THEN** the install prompt is not available

#### Scenario: It is not decided during hydration

- **WHEN** the application renders on the server or during the hydration pass
- **THEN** the install prompt is not available, so the server and client markup agree

### Requirement: The prompt confirms intent and then hands off

The prompt SHALL present **a picture of where the app will come to rest**, one statement of what
the learner gains, and exactly two controls: one that proceeds with the install and one that
dismisses.

The picture SHALL be the platform's own resting place: on a handheld, the icon on the home
screen among the learner's other apps; on a desktop, the application among the learner's other
applications. A guide that stops at the confirmation asks for effort and never shows the payoff,
and a prompt that shows only its own icon makes the same omission in one screen.

The picture SHALL be drawn rather than photographed, so that it carries no operating system the
learner may not have, and it SHALL be decorative: hidden from assistive technology, with the
prompt remaining complete from its text alone.

The prompt SHALL NOT also carry a separate identity row. The picture already shows the icon.

Activating the proceeding control SHALL call the retained event's own prompt method, from within
the learner's gesture, and SHALL close the modal. What the learner sees next is the browser's own
install dialog; the modal SHALL NOT present itself as having installed anything, and SHALL NOT
report success, because the outcome belongs to a dialog this application does not draw.

The retained event is single-use. Once it has been used, the prompt SHALL NOT be offered again
for that event.

#### Scenario: The prompt shows where the app will land

- **WHEN** the prompt is shown
- **THEN** it draws that platform's resting place, carrying the course's icon

#### Scenario: The picture is decorative

- **WHEN** the prompt is shown
- **THEN** the picture contributes nothing to the accessible name, and the prompt's text alone
  states what the learner gains

#### Scenario: The icon is not shown twice

- **WHEN** the prompt is shown
- **THEN** it carries no identity row beside the picture

#### Scenario: Proceeding calls the browser's install

- **WHEN** the learner activates the proceeding control
- **THEN** the retained event's prompt method is called and the modal closes

#### Scenario: Nothing claims the install succeeded

- **WHEN** the modal closes after the learner proceeded
- **THEN** no success message is shown, and the application does not assert the app was installed

#### Scenario: The offer is not repeated with a spent event

- **WHEN** the retained event has already been used
- **THEN** the install prompt is no longer available

### Requirement: The proceeding control is named in the platform's own words

The proceeding control and the prompt's explanatory sentence SHALL use the vocabulary the
learner's own browser uses for this act: on a handheld, the wording of adding to a home
screen; on a desktop, the wording of installing an application.

A desktop has no home screen — it has a dock or a taskbar — so wording a desktop control as
adding to a home screen names a place the learner does not have. This is the same rule the iOS
guide already follows when it names «···» rather than "share".

The explanatory sentence SHALL state what the learner will observe — the course opening full
screen, without the browser's own bar around it — rather than asserting that it will behave
"like an app", which names nothing the learner can check.

#### Scenario: A handheld is offered the home screen wording

- **WHEN** the prompt is shown on a handheld
- **THEN** the proceeding control carries that platform's add-to-home-screen wording

#### Scenario: A desktop is offered the install wording

- **WHEN** the prompt is shown on a desktop
- **THEN** the proceeding control carries the install wording, and no copy in the prompt refers
  to a home screen

### Requirement: Dismissal closes the prompt and nothing more

The dismissing control SHALL close the modal and SHALL NOT record that the learner declined.

The prompt is reached from a header control the learner chose to press, so it is a reference
they can return to rather than a one-shot offer. Storing a refusal would take that control away
from a learner who pressed it a second time on purpose.

The prompt SHALL NOT appear on its own: not on a timer, not on a scroll position, and not after
any number of lessons.

#### Scenario: Declining is not remembered

- **WHEN** the learner dismisses the prompt and then activates the header control again
- **THEN** the prompt is shown again

#### Scenario: The prompt never appears unbidden

- **WHEN** the learner browses the application without activating the header control
- **THEN** the prompt is not shown

### Requirement: An installed app stops offering to install

The prompt SHALL become unavailable, without a reload, once the application is running from
the home screen or the browser has reported that it was installed.

#### Scenario: The browser reports the install

- **WHEN** the browser fires `appinstalled`
- **THEN** the install prompt becomes unavailable

#### Scenario: A standalone launch is never offered the prompt

- **WHEN** the application is running in standalone display mode
- **THEN** the install prompt is not available

### Requirement: The prompt is a named dialog, localized in its own namespace

The prompt SHALL be shown in a modal dialog carrying an accessible name, dismissible by the
dialog's own means, and SHALL be opened imperatively so that any part of the application can
reach it without the modal being threaded through the tree.

All of its copy SHALL be read from the `Components.InstallPrompt` namespace via `next-intl`,
and that namespace SHALL carry a translation in every locale the application supports. No
string in the prompt SHALL be hardcoded, including the application's own name where it appears
as copy rather than as the brand mark.

#### Scenario: The dialog is named

- **WHEN** the prompt is shown
- **THEN** the dialog carries a localized accessible name and can be dismissed by the dialog's
  own means

#### Scenario: Copy is read from the component's own namespace

- **WHEN** the prompt is rendered
- **THEN** its translations are read from `Components.InstallPrompt`

#### Scenario: Every locale carries the namespace

- **WHEN** the application's message files are compared
- **THEN** every locale defines every key under `Components.InstallPrompt`


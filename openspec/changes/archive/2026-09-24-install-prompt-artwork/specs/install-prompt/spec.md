## MODIFIED Requirements

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

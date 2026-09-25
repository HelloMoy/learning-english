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

#### Scenario: Rendering on the server does not fail

- **WHEN** a page that can offer the install is rendered where no browser exists — on the server, with no `window`
- **THEN** the render completes, the install prompt is not available, and nothing throws

## Why

Every page under `/[locale]` answers **500** on a production build: the first deployment of the
`develop` preview failed on `/en`, `/es`, `/en/sign-in` and `/en/privacy` with
`ReferenceError: window is not defined`. `useInstallPrompt` reads the pre-hydration offer stash
while rendering, and on the server there is no `window` to read it from. The site header uses the
hook, so no page survives. `develop` carries the bug today; merging it into `main` would take
production down with it.

The `install-prompt` spec already says the prompt is not available while rendering on the server.
The implementation broke that promise and no test noticed, because every Vitest suite runs in
jsdom, where `window` always exists.

## What Changes

- Reading the install-offer stash where there is no browser reports that nothing is waiting
  instead of throwing.
- A regression test renders `useInstallPrompt` on the server, in a Node environment without a
  DOM, and asserts that it reports no offer rather than throwing.
- The `install-prompt` requirement gains a scenario that states it outright: rendering on the
  server never fails because of the install prompt.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `install-prompt`: the requirement "The install prompt exists only where the browser can perform
  the install" gains a scenario making server rendering an explicit, tested contract rather than
  an implied one.

## Non-goals

- Changing when or how the prompt appears in the browser. The capture before hydration, the
  adoption after it and the hand-off to the browser dialog stay as they are.
- Auditing every other `window` access in the app. The production build is re-run after the fix to
  confirm no other page fails, and anything found there becomes its own change.
- The Vercel preview configuration. It is already in place and is not part of this change.

## Impact

- `src/lib/install-offer-stash/install-offer-stash.ts`: `takeStashedOffer` becomes safe to call
  outside a browser.
- New server-render test next to `src/hooks/use-install-prompt/`.
- `openspec/specs/install-prompt/spec.md`, through the delta.
- No dependency, API or configuration change.

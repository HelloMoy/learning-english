## Context

The header already carries one install control. `useCanInstallToHomeScreen` sniffs the user
agent for iPhone Safari, `SiteHeader` renders `InstallAppButton` when it says yes, and the
button opens `AddToHomeScreenModal`, which plays a five-step guide. That path is only necessary
because iOS exposes no install API — the guide's own spec says so, and forbids the guide from
being built on `beforeinstallprompt`.

Chromium browsers do expose one. `beforeinstallprompt` fires, the page keeps the event, and a
later `event.prompt()` from inside a user gesture opens the browser's own install dialog. Two
facts constrain how that gets wired here:

1. **Chrome will not fire the event without a service worker that has a `fetch` handler.** The
   app has none, and `src/app/manifest.ts` argues in prose against adding a caching one.
2. **`prompt()` must be called synchronously from a real gesture.** A click handler that awaits
   anything before calling it loses the gesture and the call is refused.

The delivery side is where all of this lives: nothing here touches `src/domain/**`.

## Goals / Non-Goals

**Goals:**

- Android and desktop Chromium learners get a one-decision install, reached from the same header
  chip iOS learners use for the guide.
- The header chip never renders a control that cannot do anything.
- The iOS guide's behaviour, copy and tests are untouched.
- The event plumbing stays behind one hook, so no component reads a non-standard browser API.

**Non-Goals:**

- Offline support, precaching, or any cache at all in the service worker.
- A menu-based guide for Firefox or desktop Safari.
- Remembering a refusal, or prompting on a schedule.
- Reporting whether the install succeeded.

## Decisions

### A pass-through service worker, registered from the client

`public/sw.js` holds an `install`/`activate` pair that claims clients immediately and a `fetch`
handler that is a bare `event.respondWith(fetch(event.request))` — actually not even that: the
handler is registered and returns without calling `respondWith`, which lets the browser do its
own default fetch while still satisfying the installability check. Registration happens in a
small client hook mounted from `GlobalProviders`, after load, unawaited.

**Why not a caching worker:** the objection recorded in `manifest.ts` is to the invalidation
layer, not to the file existing. A worker that stores nothing cannot serve anything stale, so
the objection does not apply to it. The reasoning is worth writing into `sw.js` itself, because
the next person to open that file will otherwise assume it is an unfinished cache.

**Why not skip the worker and ship an inert button:** the spec would then describe a feature no
learner can reach, and the chip would render on Android and do nothing. Rejected.

**Alternative considered — `next-pwa` or `@serwist/next`:** both are build-time integrations
that generate a precache manifest. They bring exactly the machinery this change is trying not to
have. A twelve-line static file is the smaller thing.

### `useInstallPrompt`, one hook holding the event

A client hook subscribes to `beforeinstallprompt` on mount, calls `preventDefault()` so Chrome
does not also show its own mini-infobar, and stores the event in state. It exposes the
availability flag and a `promptInstall` callback. It also subscribes to `appinstalled` and to
the standalone media query so a successful install clears the event without a reload.

**Why state and not a ref:** availability has to re-render the header when the event lands,
which is typically a moment after hydration.

**Why not `useSyncExternalStore`:** the event is not an external store being read — it is
captured once and consumed once. `useState` plus two `useEffect` subscriptions is the plainer
shape, and it mirrors what `useCanInstallToHomeScreen` already does with hydration.

**Gesture preservation:** `promptInstall` calls `event.prompt()` first and only then closes the
modal and clears state. Nothing is awaited before the call. The returned `userChoice` promise is
deliberately not consumed — the spec says the application does not assert the outcome — beyond
clearing the retained event so it cannot be offered twice.

### The header chip routes; it does not decide

`InstallAppButton` grows a prop, or reads both hooks, and picks which modal to show. The
cleanest split, given the existing shape: `SiteHeader` keeps asking one question — *is there any
install path?* — and `InstallAppButton` asks *which one?*. That keeps the header's layout logic
where it is and puts the routing next to the two modals it routes between.

A new `useInstallPath` returns `"guide" | "prompt" | "none"`, composed from the two existing
signals, and both `SiteHeader` and `InstallAppButton` read it. `useCanInstallToHomeScreen` is
left exactly as it is — it answers a real, separate question (is this iPhone Safari, uninstalled)
and it already has a spec and a test suite. Widening it would conflate two conditions with
different evidence: a user-agent string versus an event that actually fired.

**Precedence:** prompt over guide. They cannot both be true today, but writing the precedence
down means a future WebKit that fires the event does the better thing without another change.

### Platform wording chosen by pointer, not by user agent

Android gets "Añadir a inicio", desktop gets "Instalar". The discriminator is
`matchMedia("(pointer: coarse)")`, not another user-agent regex: the question is really "does
this device have a home screen", and a touch-primary device is the honest proxy. It also keeps
the change from adding a second UA sniff to a codebase that has been careful to have exactly
one, for a case where no alternative existed.

Two message sub-namespaces, `Components.InstallPrompt.handheld` and
`Components.InstallPrompt.desktop`, each with its own title, body and confirm label. The
dismiss label and dialog title are shared.

### The modal reuses the existing primitives

`InstallPromptModal` is a `NiceModal.create` wrapper around the shadcn `Dialog`, mirroring
`AddToHomeScreenModal` — same `onAnimationEnd` remove, same `useModal` hide. Unlike that one it
keeps `showCloseButton`, because it draws no dismiss control of its own inside the panel: it has
two real buttons instead, and the panel's own ✕ is the third way out.

The app identity row draws the icon as an `<img src="/icon-192.png">` through `next/image`,
rather than re-drawing the mark in CSS — it is the same file the browser's own dialog will show
a second later, and a mismatch there would read as a different app.

## Risks / Trade-offs

- **Registering a service worker is a durable change to every visitor's browser.** A worker
  sticks around, and a future bad `sw.js` could break the site for people who already have the
  old one. → The worker never calls `respondWith`, so even a broken one cannot serve a wrong
  response; and it claims clients on activate so a replacement takes effect on next load rather
  than after every tab closes.
- **Chrome may change the installability criteria again.** The requirement has already moved
  once. → If the event stops firing, `useInstallPath` returns `"none"` and the chip disappears
  on those platforms. The failure mode is the state the app is in today, not a broken control.
- **Two dialogs in a row.** The learner confirms in our modal, then confirms again in Chrome's.
  This is the accepted cost of variant A and was chosen with it in view. → The modal's body
  states what the learner gains rather than repeating the question Chrome is about to ask, so
  the second dialog reads as the confirmation and not as a repeat.
- **`beforeinstallprompt` is non-standard and Chromium-only.** → It is typed locally and read in
  exactly one hook; nothing else in the app knows it exists.
- **jsdom has neither service workers nor the event.** → Both are stubbed the way
  `use-can-install-to-home-screen.test.ts` already stubs `navigator` and `matchMedia`, with
  `vi.stubGlobal`.

## Migration Plan

No data migration. The change is additive on every platform but one: an Android or desktop
Chromium learner who previously saw no chip will now see one. Rollback is deleting the
registration call — the chip reverts to iPhone-Safari-only and any already-registered worker
becomes inert rather than harmful, since it stores nothing.

## Testing strategy

Red before green on every task, per `AGENTS.md`.

| Behaviour | Layer | Mirrors |
| --- | --- | --- |
| `useInstallPrompt` captures the event, prevents its default, exposes availability, clears on `appinstalled` and after use | **Vitest unit** (`renderHook`) | `src/hooks/use-can-install-to-home-screen/use-can-install-to-home-screen.test.ts` — same `vi.stubGlobal` + `afterEach(unstubAllGlobals)` shape, dispatching a fake event rather than setting a user agent |
| `useInstallPath` resolves `guide` / `prompt` / `none` and prefers `prompt` | **Vitest unit** (`renderHook`) | same file; both source hooks mocked, as that test already mocks `useIsHydrated` |
| Service-worker registration is attempted once, after load, and swallows a rejection | **Vitest unit** (`renderHook`) | new; `navigator.serviceWorker` stubbed via `vi.stubGlobal` |
| The modal renders the platform's wording, calls `prompt()` on confirm, closes on dismiss, and records nothing | **Vitest component + RTL** | `src/components/modals/add-to-home-screen-modal/add-to-home-screen-modal.test.tsx` |
| The header chip opens the prompt modal where the path is `prompt`, and the guide modal where it is `guide` | **Vitest component + RTL** | `src/components/install-app-button/install-app-button.test.tsx` — same `vi.spyOn(NiceModal, "show")` assertion |
| Every locale carries the `Components.InstallPrompt` keys | **Vitest unit** | `src/messages/messages.test.ts`, which already walks the locale files |
| The chip is absent on a desktop browser that never fired the event | **Vitest component + RTL** (`site-header.test.tsx`) | existing header tests |

**Not Playwright.** Every behaviour here is component-level and the one browser signal that
matters — `beforeinstallprompt` — is not something Playwright can make Chromium fire on demand.
An e2e test would assert only that a chip is absent, which the component tests already cover.
`AGENTS.md` is explicit that a case Vitest + RTL can cover does not go to Playwright.

**Storybook.** `InstallPromptModal` gets `install-prompt-modal.stories.tsx` with a handheld and
a desktop story, per the four-rule checklist for new reusable components. The stories render the
panel directly rather than through `NiceModal`, so no provider is needed.

## Open Questions

None blocking. One to revisit after shipping: whether the desktop wording should name the dock
or the taskbar specifically. It currently names neither, which is correct on both and vivid on
neither.

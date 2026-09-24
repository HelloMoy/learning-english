## Context

`useInstallPrompt` subscribes to `beforeinstallprompt` from a `useEffect`. Measured on Android
Chrome 149: the event fires before that effect runs, is never replayed, and the header chip
therefore never appears. Everything else the browser needs is already correct — manifest, icons,
service worker, secure origin — which is why this went unnoticed: the feature was verified by
dispatching a synthetic event *after* load, the one case that cannot fail.

The prompt itself shows the app icon at 48px. The Safari guides all end on a frame showing the
icon in place, for a reason their spec states plainly.

## Goals / Non-Goals

**Goals:**

- An event that arrives before hydration still reaches the prompt.
- The prompt shows the payoff, per platform.
- One drawn picture per platform, no OS screenshots.

**Non-Goals:**

- Changing the guides, the pacing, or the number of decisions the prompt asks for.
- Artwork that varies by operating system within a platform.

## Decisions

### Capture before hydration, read on mount

`captureInstallOffer()` runs from `src/instrumentation-client.ts`, which Next executes before
the application starts. It prevents the event's default and stashes it on `window`.
`useInstallPrompt` adopts whatever is waiting there on mount and also subscribes, so it is
correct whichever side of hydration the event lands on.

**Three earlier attempts failed, and are worth not repeating.** Each was measured on the
rendered document rather than assumed:

| Attempt | What happened |
| --- | --- |
| Inline `<script>` in a `<head>` rendered from the root layout | Never reached the HTML; the App Router absorbs a hand-written `<head>` |
| Inline `<script>` as the first child of `<body>` | Appeared only inside Next's streamed payload; no executable tag, stash undefined at `DOMContentLoaded` |
| `next/script` with `beforeInteractive` | Documented for external `src` scripts; with inline content it emitted nothing |

The reason all three fail is the same: this layout's body is streamed, so anything rendered from
it arrives *during* hydration by definition. `instrumentation-client` is the only hook the
framework offers that is genuinely earlier.

**A fourth attempt, a static `public/install-capture.js` loaded with `<script src>`, failed the
same way** — the tag reached the flight payload and never the document.

**Why a `window` property:** the capture runs in the instrumentation bundle and the read happens
inside a React hook. They are separate bundles with no module in common, and a global is the one
thing both reach. It lives behind three named functions so nothing else touches the key.

### One art component, two drawings

`InstallPromptArt` takes the surface and draws either the home screen or the application
switcher. Fixed pixel sizes and its own colours, not the project's theme tokens, for the same
reason the guide depictions use Apple's: it is a picture of the learner's system, not of this
app, and it should not follow this app's light/dark mode.

**Why the switcher for desktop, over the window comparison:** the window comparison argues from
absence — the tabs that are gone — which the learner cannot check until afterwards. The switcher
argues from presence, and the claim is exact: a browser tab never appears there. It is also the
only desktop option that looks the same on macOS and Windows.

**Why the home screen for a handheld:** it is the frame the iOS and iPad guides already end on,
so all four surfaces now tell the learner the same story.

### The identity row goes

Two copies of the icon in a 300px dialog, one of them 48px and one inside a picture, is one too
many. The picture carries the identity.

### Desktop copy follows its picture

`desktop.body` becomes the switching claim rather than the tab-absence claim, so the sentence and
the drawing make the same argument.

## Risks / Trade-offs

- **A listener added on every page load.** → One listener and one assignment, in a bundle that
  already runs. It is also the only place early enough to work.
- **A global on `window`.** → Behind three named functions in one module, read in one hook, and
  cleared when the offer is spent.
- **The switcher needs recognising.** A learner who never uses it sees a row of icons. → The
  title names it, and the row reads as "among your apps" even without the shortcut.
- **Drawn art can drift from the real thing.** → It is deliberately generic: no OS chrome, no
  vendor marks, nothing that claims to be a specific system.

## Testing strategy

Red before green.

| Behaviour | Layer | Mirrors |
| --- | --- | --- |
| `captureInstallOffer` stashes the offer and prevents its default | **Vitest unit** | new; dispatching a fake event |
| The hook adopts an offer captured before mount, and still captures one that arrives later | **Vitest unit** (`renderHook`) | its own existing suite |
| Accepting clears the stash, so the offer is not re-adopted on the next mount | **Vitest unit** | same |
| `InstallPromptArt` draws the home screen for a handheld and the switcher for a desktop, carries the icon, and is `aria-hidden` | **Vitest component + RTL** | `safari-window-screen.test.tsx` |
| The modal draws the art, carries no identity row, and still calls `onAccept` | **Vitest component + RTL** | its own existing suite |
| Every locale still writes the prompt's keys | **Vitest unit** | `messages.test.ts` |

**Not Playwright.** The one thing e2e could add — a real early `beforeinstallprompt` — cannot be
made to fire on demand. It is verified on the Android emulator by hand instead.

**Storybook.** `install-prompt-art.stories.tsx` with a handheld and a desktop story.

**Visual check.** The Android emulator over CDP, for the chip actually appearing; and the desktop
prompt in the browser.

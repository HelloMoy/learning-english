## Context

The double-tap seek shipped in PR #40 with a single constant, `SEEK_STEP_SECONDS = 10`,
whose JSDoc already anticipated this change: _"a future setting for the interval has one
value to write."_ That constant is read in four places — the two `Gesture` actions, the
run's arithmetic, and the indicator's label — plus five test and story files.

The surrounding machinery is already the right shape. `src/lib/seek-run/seek-run.ts` is a
pure module that knows nothing about the player; `useSeekRun` holds the run and hands
back a target; `PlaybackGestures` performs the seek. Only the number is fixed.

Three constraints shape the design:

1. **The player is Vidstack's `DefaultVideoLayout`.** It already renders a settings menu
   with a gear button, in both the large and the small (phone) layout, and positions its
   popover correctly inside the player box — including while the player is pinned by
   `lesson-video-player--enlarged`. Whatever we add should ride on that, not beside it.
2. **The domain must stay clean.** `src/domain/**` may import only `zod` and `neverthrow`,
   and ESLint enforces it. Everything the app currently persists in `localStorage` —
   playback position, continue-watching, progress — goes through a domain port and a
   `browser-local-storage` driven adapter, because all three are *learner data*. A seek
   step is not.
3. **Hydration.** The lesson page is server-rendered. Anything read from `localStorage`
   during the first client render makes the hydration pass disagree with the server's
   HTML — the problem `useIsHydrated` exists for, and which D3 settles for this hook.

## Goals / Non-Goals

**Goals:**

- One source for the step in force, read by the gestures, the run arithmetic and the
  indicator alike.
- A control in the player's own settings menu that looks and behaves like the entries
  already there (Speed, Quality, Captions), in both layouts and while enlarged.
- Persistence in `localStorage` that degrades to the default rather than throwing.
- A run in flight that cannot be rewritten by a change made mid-run.
- No new runtime dependency.

**Non-Goals:**

- A domain port or use case for the preference — see Decision 1.
- Changing the lapse window, the anchor arithmetic, the turn-around, or the absorbed
  middle tap. Only the size of a step becomes variable.
- Governing the layout's own seek buttons or the keyboard shortcuts; those keep
  Vidstack's step.
- A settings surface outside the player.

## Decisions

### D1 — The preference is presentation state: a hook over `localStorage`, not a domain port

**Chosen:** `src/hooks/use-seek-step/use-seek-step.ts` owns the browser storage
directly, under the app's existing key namespace (`learning-english:seek-step`). No port,
no adapter, no use case.

**Why.** The project has two established shapes for persisted state, and they split on
what the state *is*:

| State | Shape | Why |
| --- | --- | --- |
| Playback position, continue-watching, completion | domain port + `browser-local-storage` adapter | learner data; use cases reason about it |
| Theme | provider + `localStorage`, no port (`next-themes`) | presentation preference; the domain never sees it |

How far a tap on the video skips is the second kind. It has no meaning outside the
player's chrome, no use case reads it, and no domain rule depends on it. Giving it a
`SeekStepRepository` in `src/domain/ports/` would put an interface in the hexagon's
centre that nothing in the centre ever calls — the cost of consistency-by-appearance is
a domain that no longer describes the domain.

What is kept from the adapter pattern is the part that actually matters: the
`learning-english:` key prefix, the guard against a `localStorage` that is absent or
denied, and a `storage`-parameter seam so tests never monkey-patch a global.

**Alternative considered:** a `browser-local-storage-seek-step-repository` implementing a
new port. Rejected on the above. **Also considered:** `zustand` with its `persist`
middleware — rejected because it would be the only store in the app for a single number,
and it does not solve the hydration problem any better than the hook does.

### D2 — Pure parsing in `lib`, browser I/O in the hook

`src/lib/seek-run/seek-run.ts` gains the vocabulary and keeps its purity:

- `SEEK_STEP_OPTIONS_SECONDS = [3, 5, 10]` — the closed set, ascending, in menu order.
- `DEFAULT_SEEK_STEP_SECONDS = 5` — named rather than indexed: it is neither the
  first nor the last of the list, but the phrase-length interval the gesture is for.
- `parseSeekStepSeconds(raw: string | null): number` — total: anything that is not one of
  the three options becomes the default. A `null`, `"abc"`, `"7"`, `"NaN"`, `"5.0"` — and
  `"20"`, which this app offered during development — all resolve without throwing.

`SEEK_STEP_SECONDS` is **removed**. Leaving it would give the codebase two answers to the
same question, which is the bug the spec's "The step is read from one source" scenario
exists to catch.

The hook does the reading, the writing and the sharing; the lib module does the deciding.
That keeps every branch of the fallback rule testable without a DOM.

### D3 — The value is shared through `useSyncExternalStore`

Two consumers need the same value in the same tree — `PlaybackGestures` and
`SeekStepMenu` — and a third party (another tab) can change it. A module-level listener
set plus `useSyncExternalStore` covers all three without a context provider:

- `getServerSnapshot` returns `DEFAULT_SEEK_STEP_SECONDS`, so the server's HTML and the
  hydration render agree by construction.
- `subscribe` is a module-level constant, so React never tears the subscription down and
  rebuilds it on a re-render. It registers the listener and listens for the `storage`
  event (cross-tab).
- `getSnapshot` reads storage and returns a `number`, which `useSyncExternalStore`
  compares by value — no cached-object trap.
- Writing notifies the listeners itself; the `storage` event does not fire in the tab
  that wrote.

**No hydration nudge is needed, and this was measured rather than assumed.** The sibling
`useIsHydrated` carries a one-shot `setTimeout(onStoreChange, 0)` in its own `subscribe`,
citing facebook/react#26095 — React not re-rendering when `getSnapshot` disagrees with
`getServerSnapshot` after hydration. On React 19 that no longer holds for this hook: the
`renderToString` + `hydrateRoot` test in `use-seek-step.test.tsx` shows React adopting the
stored value on its own, with no recoverable error and no timer to run. The nudge was
written first and then deleted when the test passed without it. `useIsHydrated` is left
alone — its pattern is not this one, and changing it is not this change's business.

**Alternative considered:** `useIsHydrated()` plus `useState`. Rejected: adopting the
stored value would need a `setState` in an effect, which the React 19
`react-hooks/set-state-in-effect` rule forbids.

**Consequence to accept:** for one commit after hydration the gestures are at five
seconds even for a learner who chose ten. A double tap cannot physically land in it, and
the menu reads the same store, so it can never show a step the gestures do not have.

### D4 — A run carries the step it started with

`SeekRun` gains `stepSeconds`, and `seekRunSeconds(run)` becomes
`run.steps * run.stepSeconds`. `tap` takes the step in force as a third argument and uses
it **only when a run starts** — a fresh run, or the new run a turn-around begins.
Extending a run on its own side reads `run.stepSeconds`.

This is what makes the indicator honest. Without it, choosing ten seconds mid-run
would retroactively relabel a run that had already seeked five, and the next target would
be computed from an anchor the label no longer describes. The spec's "A run in flight
keeps the step it started with" scenario is exactly this case.

A turn-around adopting the newly chosen step is intentional and consistent with the
spec's own wording — the opposite edge "starts a **new** run".

### D5 — The menu is built from Vidstack's own default-layout parts, in `settingsMenuItemsEnd`

`SeekStepMenu` composes `Menu.Root` / `Menu.Items` from `@vidstack/react` with
`DefaultMenuButton` and `DefaultMenuRadioGroup` from
`@vidstack/react/player/layouts/default` — the exact composition the library's own
`DefaultSpeedMenu` and `DefaultQualityMenu` use, which can be read in
`node_modules/@vidstack/react/dev/player/vidstack-default-components.js`.

**Why those parts rather than a shadcn `DropdownMenu`:** the gear button, the popover's
placement in each layout, the focus trap, the roving `radiogroup` semantics, the small-
layout sheet and the `vds-*` theme classes all already exist and are already correct
inside the pinned/enlarged player. Rebuilding them for one setting would be three
regressions waiting to happen, the worst of them on the phone — which is where the
gesture is actually used.

**Why `settingsMenuItemsEnd` rather than `...Start`:** the library's own entries keep
their familiar order and the app-specific one is appended, so a learner's muscle memory
for Speed does not move.

`DefaultMenuRadioGroup` speaks in `string` values; the component maps seconds to and from
their decimal string at its own boundary and the rest of the code keeps `number`.

Copy comes from `next-intl` under `Components.SeekStepMenu` — the namespace convention
every component in this repo follows — not from Vidstack's `translations` map, which is
keyed by the library's own English words and is reserved for the library's own controls.
The option labels reuse an ICU plural so "5 seconds" is phrased by each locale.

### D6 — The e2e tests drive the setting instead of assuming ten seconds

Every current e2e and component assertion that reads `SEEK_STEP_SECONDS` is really
asserting "one step". They are rewritten against `DEFAULT_SEEK_STEP_SECONDS`, and one new
case per layer chooses a different option first and asserts the video moved by *that*
instead — which is the only assertion that can fail if the wiring regresses.

## Risks / Trade-offs

- **The gear button might not render for a YouTube-sourced lesson** if every built-in
  submenu hides itself (`DefaultQualityMenu` returns `null` without qualities,
  `DefaultCaptionMenu` without tracks). → `DefaultSettingsMenu` has no such early return,
  so the button should always paint; verified in the browser as the first UI task, before
  any copy or persistence work is built on top of it.
- **The popover inside the enlarged player** shares a stacking context with the pinned
  box and the `ScrollDownHint`. → Verified in the browser and on the iOS simulator in both
  states; the geometry rules live in `lesson-video-player.css` if an override is needed.
- **The default changes from 10 s to 5 s for every existing learner**, including those
  who liked ten. → Accepted and called out in the proposal; the menu is the way back, and
  it takes two taps.
- **A frame of default before the stored value is adopted** (D3). → No gesture can land
  in it; the menu's own selected option is painted from the same store, so it cannot show
  a value the gestures do not have.
- **`localStorage` denied** (private mode, hardened settings) → every read and write is
  wrapped; the player falls back to five seconds and keeps working.
- **Turbopack serves a stale `globals.css`** if any stylesheet is touched during
  verification. → `rm -rf .next` and restart the dev server before trusting a visual check.

## Testing strategy

Red first on every task, per AGENTS.md. Layers, and the file each mirrors:

| Behaviour | Layer | File |
| --- | --- | --- |
| Option set, default, `parseSeekStepSeconds` fallbacks (null / garbage / out-of-set / float / a step no longer offered) | Vitest unit | `src/lib/seek-run/seek-run.test.ts` (existing; extend) |
| Step-aware `startSeekRun` / `extendSeekRun` / `seekRunSeconds` / `seekRunTarget`, and a turn-around adopting the new step | Vitest unit | `src/lib/seek-run/seek-run.test.ts` |
| Reading the stored value, writing it, notifying every consumer, `storage`-event sync, absent/denied storage, corrupt value | Vitest unit | `src/hooks/use-seek-step/use-seek-step.test.ts` (new) — mirrors `use-playback-position.test.ts` for the injected-`Storage` seam |
| `tap` passing the step through, and an in-flight run keeping its own | Vitest unit | `src/hooks/use-seek-run/use-seek-run.test.ts` (existing; extend) |
| The submenu renders three options, marks the one in force, reports a choice, is localized | Vitest component + RTL | `src/components/lesson-view/seek-step-menu/seek-step-menu.test.tsx` (new) |
| A double tap seeks and labels in the chosen step | Vitest component + RTL | `src/components/lesson-view/lesson-video-player/lesson-video-player.test.tsx` (existing; extend — reuses its gesture harness and `useMediaRemote` mock) |
| The submenu is actually mounted in the layout's settings slot | Playwright e2e **only** | The Default Layout renders no controls under jsdom — the player defers loading behind an `IntersectionObserver` that never fires, so `.vds-video-layout` stays empty and no slot mounts. That is why the enlarge control's assertions already live in e2e, and the same applies here. Mocking `DefaultVideoLayout` to spy on its `slots` prop is rejected: the theme test asserts against the real `.vds-video-layout` class. |
| Choosing 10 s in the real gear menu, then a double click on the right edge moving `currentTime` by 10 s; the choice surviving a reload and a navigation to another lesson | Playwright e2e | `e2e/lesson-video-player.spec.ts` (existing; extend both the desktop and the iPhone-emulation `describe`) |
| The three locales render the control | Storybook | `src/components/lesson-view/seek-step-menu/seek-step-menu.stories.tsx` (new), locale toolbar |

Beyond the automated layers, two manual checks are part of the definition of done, driven
by me and not handed back to the user:

- **Desktop browser** via Playwright MCP: open the gear, choose each option, double-click
  each edge, confirm the indicator's count and the video's position, then reload.
- **Real iPhone Safari** via the iOS simulator (Xcode), against `localhost` — not the LAN
  IP — in the page and with the video enlarged, portrait and landscape. Playwright's
  WebKit emulation is not a substitute: the small layout's menu is a sheet and the
  YouTube provider's own chrome only exists there.

`pnpm verify` (typecheck, format, lint, Vitest) must pass before the change is done;
Playwright runs separately with `PLAYWRIGHT_BASE_URL` and `--workers=1`.

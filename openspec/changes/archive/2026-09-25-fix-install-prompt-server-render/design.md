## Context

`useInstallPrompt` seeds its state with `useState(takeStashedOffer)`. React calls a lazy
initializer on every first render, **including the server render**, and `takeStashedOffer` reads
`window.__installOffer`. Node has no `window`, so the read throws `ReferenceError`. The site
header uses the hook, so every page under `/[locale]` fails with a 500.

This was reproduced on a local `next build && next start` of `develop`. The source-mapped stack
points at `install-offer-stash.ts:61`, called from `use-install-prompt.ts:100`. `/robots.txt`,
which renders no header, still answers 200.

The rest of the hook is already server-safe. Its `window` listeners live in an effect, and its
answer is forced to "no offer" until `useIsHydrated` reports hydration. Only the initializer
escapes.

## Goals / Non-Goals

**Goals:**

- A server render of anything that uses `useInstallPrompt` completes, and reports no offer.
- A test that fails today for exactly this reason, so the regression cannot return unnoticed.

**Non-Goals:**

- Any change to browser behaviour: capture before hydration, adoption, `accept`, withdrawal.
- A sweep of other `window` reads. The production build is re-run afterwards to find any.

## Decisions

### Make `takeStashedOffer` answer "nothing waiting" where there is no browser

`takeStashedOffer` returns `null` when `window` is undefined, and reads the stash otherwise. The
function's contract is "the offer captured before hydration, if one is waiting". On the server
nothing can have been captured, so `null` is the true answer, not a workaround. It also protects
any future caller, not just this hook.

**Alternatives considered:**

- *Start the state at `null` and adopt the stash in the mount effect.* This keeps the stash
  browser-only, but it adds a `setState` inside an effect, which the React 19 lint rules flag,
  and a second render on every page load for an offer that is almost always absent. The hook's
  first client render also changes from "has the offer, hidden until hydrated" to "has nothing",
  which is a behaviour change to a hook this fix has no reason to touch.
- *Guard at the call site* (`typeof window === "undefined" ? null : takeStashedOffer()`). This
  fixes one caller and leaves the trap armed for the next one.

`captureInstallOffer` and `forgetStashedOffer` stay unguarded. The first runs only from
`instrumentation-client`, which never executes on the server. The second runs only from event
handlers and effects.

## Testing strategy

- **Vitest, Node environment**: new file `src/hooks/use-install-prompt/use-install-prompt.server.test.tsx`
  with `// @vitest-environment node`, the same header the transactional-email tests use
  (`src/emails/reset-password/reset-password.test.tsx`). It renders a tiny component that calls
  `useInstallPrompt` through `renderToString` from `react-dom/server`, as
  `src/components/module-route/module-route.test.tsx` does, and asserts that the render does not
  throw and reports no offer. This is the test that fails today: jsdom provides `window`, so no
  existing suite can see the bug.
- **Vitest, Node environment, unit**: in the same file, `takeStashedOffer()` returns `null` when
  there is no `window`.
- **Existing jsdom suites** (`install-offer-stash.test.ts`, `use-install-prompt.test.ts`) stay
  as they are and must stay green. They prove the browser behaviour is unchanged.
- **Production build check**: `next build && next start` locally, then every `/[locale]` route
  sampled earlier (`/en`, `/es`, `/en/sign-in`, `/en/privacy`) answers 200. Then the Vercel
  `develop` preview is redeployed and checked the same way.

No Playwright test is added. The e2e suite runs against a production build and would catch a
500, but the Vitest server-render test pins the cause far more cheaply and precisely.

## Risks / Trade-offs

- [Other `window` reads during render remain undiscovered] → The production build is re-run after
  the fix, and every sampled route must answer 200 before the change is done.
- [The Node-environment test file drifts from the jsdom one] → It holds only the server contract,
  two tests, and its name says so.

## Context

`pnpm verify` is the first of the two CI jobs, and it has never passed — the workflow has run eight times since it was added with the authentication work and has been red every time. Its failure is not a failing test: all 2730 pass, and the run still exits 1 on one unhandled rejection, `provider destroyed`, thrown by `@vidstack/react` when a provider is destroyed with promises in flight.

The player is reached through a small facade built inside `playback-positioned-video-player.tsx`, so that `use-resume-on-first-play` can be tested with three spies instead of a media pipeline jsdom does not have. That facade is where the leak is.

## Goals / Non-Goals

**Goals:**

- The `verify` job exits 0.
- The leak cannot come back silently: the fix is guarded by a test that fails without it.
- The contract that invited the mistake is written down where the next method is added.

**Non-Goals:**

- The e2e job (see the proposal — it needs a decision, not a fix).
- Any change to resume behaviour.

## Decisions

### Extract the facade instead of patching the line

The one-character fix is to copy `play`'s `void …?.catch(() => {})` onto `pause`. That would work and would be untestable: the facade is built inside a `useMemo`, reachable only by rendering the component with a mocked Vidstack instance.

Extracting it to `resumablePlayerFrom(ref)` makes the defect directly testable — hand it a ref whose `pause` returns a rejected promise and assert nothing reaches `unhandledRejection` — and gives the contract a place to be documented. The component keeps a `useMemo` around the call, because the identity still has to be stable across renders.

The alternative, testing through the component, would need a Vidstack mock to expose its instance ref, which is more machinery than the thing under test.

### The test listens for the real event rather than asserting a shape

Asserting that `pause()` returns `undefined` would pass against the broken code too, because the broken version also returns undefined by the time TypeScript is done with it. What actually distinguishes them is whether the rejection reaches the process.

So the test registers a `process.on("unhandledRejection")` listener, drives a rejecting `pause`, flushes microtasks, and asserts the listener never fired. That is the failure CI reports, reproduced in one test.

### Rejections are swallowed, not reported

`play` already swallows, and pause/play failing is not actionable: the provider is gone because the learner navigated away. Reporting it to Sentry would manufacture exactly the noise this change exists to prevent. A comment records that the emptiness is deliberate.

## Risks / Trade-offs

- **A swallowed rejection could hide a real playback failure** → Accepted, and already the established choice for `play`. Playback failures that matter surface through the player's own error events, not through a rejected pause.
- **The extraction adds a module for three small methods** → It is the unit that owns a real contract and now has a test; the folder-per-entity rule puts it in its own directory either way.
- **`SHOW_DRAFT_COURSES=1` makes CI diverge from a real production build** → Intended and documented in `.env.example`. CI builds production to exercise the production code path, not to reproduce production's catalog.

## Testing strategy

| Behavior | Layer | Mirrors |
| --- | --- | --- |
| A rejecting `pause` reaches no `unhandledRejection` listener | Vitest unit | new `resumable-player-from.test.ts` |
| A rejecting `play` likewise | Vitest unit | same file — the already-correct path, pinned so a future edit cannot undo it |
| `seekTo`, `currentTime`, `duration` still read through the ref | Vitest unit | same file |
| The resume flow is unchanged | Vitest | `use-resume-on-first-play`'s existing suite, untouched and still passing |

No e2e: the defect is a promise nobody awaited, which a browser test observes only as a console message.

## Open Questions

None. The remaining CI problem is the e2e job's dependency on untracked content, which the proposal states as a decision for the owner rather than a question for this change.

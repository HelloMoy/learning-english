## Context

Three facts from the codebase set the shape of this change:

1. **The port is fine; the adapter and the readers are missing.**
   `ProgressTracker` already declares `markComplete(lessonId)` and `isComplete(lessonId)`.
   `InMemoryProgressTracker` implements it server-side and ephemerally. No component
   calls `isComplete` — the only references are the port, that adapter, and a test stub.

2. **The precedent is already in the repo.**
   `BrowserLocalStoragePlaybackPositionRepository` solved the identical problem for video
   position: same port unchanged, browser adapter under
   `src/adapters/persistence/browser-local-storage/`, `learning-english:`-prefixed keys,
   a no-op guard when `window.localStorage` is undefined, and a constructor seam
   (`params?.localStorage`) so tests inject a fake rather than monkey-patching globals.
   `usePlaybackPosition` is the matching client composition root.

3. **The two surfaces sit on opposite sides of the server/client line.**
   `module-overview.tsx` is a Server Component rendered from a server page.
   `lesson-list.tsx` sits under `lesson-view.tsx`, which is `"use client"`. The same
   indicator therefore has to work in both places without forcing the module overview to
   become a client component wholesale.

## Goals / Non-Goals

**Goals:**

- Completion survives a reload and a server restart on the device that recorded it.
- Both surfaces show the mark, from one source of truth, without two copies of the
  reading logic.
- No hydration mismatch, and no flash of a wrong state that reads as "not completed".
- The domain contract is untouched, so binding a server-backed adapter later is a swap.

**Non-Goals:**

- Changing `ProgressTracker`, `markLessonComplete`, or the server dependency graph.
- Bulk/aggregate progress queries (see proposal § Non-goals).

## Decisions

### D1 — Mirror the playback adapter, do not generalise it

**Decision:** add `BrowserLocalStorageProgressTracker` implementing `ProgressTracker`,
under `src/adapters/persistence/browser-local-storage/browser-local-storage-progress-tracker/`,
with keys `learning-english:completed:{lessonId}`.

It is close to a copy of the playback adapter with a different key prefix and a boolean
payload. That duplication is deliberate: the two adapters implement *different ports*
with different value types, and a shared "localStorage key-value base class" would couple
them so that a change to one port's semantics ripples into the other. The shared thing —
`learning-english:` prefixing and the SSR guard — is a convention worth repeating in
eight lines, not an abstraction worth building.

**Storage value:** the key's *presence* means complete; the value is `"1"`. Absence means
incomplete. This keeps the parse total — there is no third state to mis-handle, unlike
the playback adapter which must reject a non-finite `Number.parseFloat`.

### D2 — Read through `useSyncExternalStore`, not `useEffect` + `useState`

**Decision:** the client hook exposes the completion set through
`useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`.

This is the decision that matters, and it is driven by hydration. The mark is derived
from `localStorage`, which the server cannot see. With `useEffect` + `useState`, every
consumer independently renders "not completed", then flips after mount — a visible flash
that says the wrong thing, repeated per row.

`useSyncExternalStore` addresses this directly:

- `getServerSnapshot` returns the empty set, so server HTML and first client render agree
  and React does not warn.
- One module-level store means all rows share a single snapshot; a mark set on one
  surface is not stale on the other.
- `subscribe` can listen to the `storage` event, so completing a lesson in one tab
  updates the other. That is free with this primitive and awkward without it.

**Alternative — `useEffect` per row:** 107 effects, 107 independent reads, and the flash
above. Rejected.

**Alternative — read on the server and pass down:** impossible. `localStorage` does not
exist there, which is the whole reason the state is client-side.

**Flash-of-incomplete, still:** the first paint necessarily shows no marks, because the
server cannot know them. The mitigation is that the indicator's *absence* is the neutral
state — a row without a mark is the normal case — so the correction adds a mark rather
than removing a wrong one. The indicator must never render as "not completed" explicitly
(no grey ✗), or the flash would assert something false.

### D3 — The module overview gets a client island, not a `"use client"` conversion

**Decision:** extract a small client component that renders the mark for one lesson, and
use it inside the Server Component's row. `module-overview.tsx` keeps its directive-free
server rendering.

Converting the whole module overview to a client component to show a checkmark would push
the lesson list, the hero and the back link into the client bundle for no reason. The
island is the mark itself.

The outline needs no island: `lesson-list.tsx` is already inside a client subtree, so it
can call the hook directly.

### D4 — `MarkAsCompleteButton` reads on mount and writes to the same store

Today the button is write-only: `useState(false)` on mount, and its click calls the
server action against the ephemeral in-memory tracker. Two changes:

- Initial state comes from the same store the indicators read, so a completed lesson
  shows as completed on arrival.
- The write goes through the browser adapter, so the indicators observe it.

**On the server action:** `markLessonCompleteAction` stays. Per the reasoning
`usePlaybackPosition` already documents for `recordPlaybackPosition`, the client
composition root writes through the port directly; the Server Action path is what per-user
sync will use when auth lands. Keeping the action in place means that migration is a
change of caller, not a rewrite. This does mean the click writes to two stores today — the
durable browser one and the ephemeral server one — which is stated plainly rather than
hidden.

### D5 — The indicator is an accessible name, not a bare glyph

A checkmark alone is invisible to a screen reader and ambiguous next to a play affordance.
The mark carries localized text (visually hidden where the design shows only a glyph)
under `Components.*` in all three locales. The row's existing link keeps its own name;
the mark supplements it rather than replacing it.

## Testing strategy

| Behavior | Layer | File |
| --- | --- | --- |
| Adapter: a marked lesson round-trips as complete | Vitest unit | `browser-local-storage-progress-tracker.test.ts` |
| Adapter: an unmarked lesson reads as incomplete | Vitest unit | `browser-local-storage-progress-tracker.test.ts` |
| Adapter: `markComplete` is idempotent | Vitest unit | `browser-local-storage-progress-tracker.test.ts` |
| Adapter: lessons are isolated from each other | Vitest unit | `browser-local-storage-progress-tracker.test.ts` |
| Adapter: no-ops when `localStorage` is undefined, throwing nothing | Vitest unit | `browser-local-storage-progress-tracker.test.ts` |
| Adapter: keys are `learning-english:`-prefixed | Vitest unit | `browser-local-storage-progress-tracker.test.ts` |
| Hook: server snapshot is empty, so hydration agrees | Vitest + RTL | the hook's test |
| Hook: a completed lesson reports complete after mount | Vitest + RTL | the hook's test |
| Hook: a `storage` event from another tab updates subscribers | Vitest + RTL | the hook's test |
| Outline: a completed lesson row shows the mark; an uncompleted one does not | Vitest + RTL | `lesson-list.test.tsx` |
| Episode row: same, through the client island | Vitest + RTL | `module-overview.test.tsx` |
| Indicator never renders an explicit "not completed" state (D2) | Vitest + RTL | `lesson-list.test.tsx` |
| Button: mounts as completed when the store says so | Vitest + RTL | `mark-as-complete-button.test.tsx` |
| Button: clicking marks, and the indicator observes it | Vitest + RTL | `mark-as-complete-button.test.tsx` |
| Existing outline, episode-list and button behaviour still holds | Vitest + RTL (existing, must stay green) | those files |
| Completed vs uncompleted rows are visually reviewable in 3 locales | Storybook | the touched stories |

**Patterns mirrored:** the adapter's test follows
`browser-local-storage-playback-position-repository.test.ts` exactly, including the
injected-`Storage` fake for the undefined-`localStorage` case. Component tests follow the
existing `lesson-list.test.tsx` and `module-overview.test.tsx` fixtures. Test names keep
the `WHEN … THEN …` phrasing.

**Storage-adapter rule note:** AGENTS.md requires testcontainers for Postgres/Prisma/
MySQL/Mongo adapters. That rule targets real database adapters; `localStorage` has no
container, and the established precedent in this repo is the injected-`Storage` seam the
playback adapter already uses.

**No new e2e.** Cross-tab sync is the one behaviour Playwright could cover that RTL
cannot, and it is a side effect of D2 rather than a requirement the user asked for. Not
worth a browser spec here.

## Risks / Trade-offs

- **First paint shows no marks** → Unavoidable (D2); mitigated by making absence the
  neutral state so the correction only ever adds a mark. Verify in the browser that the
  appearing marks read as loading-in, not as flicker.
- **The click writes to two stores** (D4) → Documented in the button's JSDoc so the next
  reader does not treat the server write as dead code. It becomes the only write when
  auth arrives.
- **Completion is per-device** → A learner on phone and laptop sees two different
  pictures. This is the accepted cost of shipping before auth, stated in the proposal, and
  the reason the port is left untouched.
- **`localStorage` can be full or blocked** (Safari private mode, quota) → `setItem` can
  throw where the playback adapter's would too. The mark must fail silently rather than
  break the page; the adapter test should cover a throwing `Storage`.
- **Marks are hidden state a learner cannot audit or reset** → No UI to clear progress,
  and clearing site data wipes it silently along with playback position. Acceptable for
  a per-device v1; worth revisiting with auth.

## Open Questions

- **Is completion reversible?** The current button is one-way (it sets `completed` and
  never unsets). Whether clicking again should unmark is a product call, not a technical
  one. Treated as out of scope per the proposal; if the answer is "yes", it is a small
  follow-up on top of this adapter, since `localStorage` removal is trivial.

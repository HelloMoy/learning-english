## 1. The browser adapter

Mirror `browser-local-storage-playback-position-repository/` — same folder-per-entity
layout, same injected-`Storage` seam, same JSDoc discipline about being browser-only.

- [x] 1.1 (TDD: test → impl) `markComplete(lessonId)` then `isComplete(lessonId)` resolves
      `true`; an unmarked lesson resolves `false`. Minimal impl: create
      `src/adapters/persistence/browser-local-storage/browser-local-storage-progress-tracker/`
      with keys `learning-english:completed:{lessonId}`, presence meaning complete (D1).
- [x] 1.2 (TDD: test → impl) `markComplete` is idempotent, and lessons are isolated from
      one another.
- [x] 1.3 (TDD: test → impl) With `localStorage` undefined, `isComplete` resolves `false`
      and `markComplete` resolves without throwing. Inject a fake `Storage` via the
      constructor seam rather than monkey-patching globals.
- [x] 1.4 (TDD: test → impl) A `Storage.setItem` that throws (quota exceeded, blocked
      storage) does not propagate out of `markComplete`. This is the case the playback
      adapter does not cover, so there is no precedent to copy — write it deliberately.
- [x] 1.5 (TDD: test → impl) Keys are `learning-english:`-prefixed, asserted against the
      injected `Storage` so the namespace is locked against accidental change.

## 2. The client composition root

- [x] 2.1 (TDD: test → impl) The hook's server snapshot is empty, so a server render and
      the first client render agree. Minimal impl: a module-level store read through
      `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)` per design D2 —
      not `useEffect` + `useState`, which would flash a wrong state on every row.
- [x] 2.2 (TDD: test → impl) After mount, a lesson the store reports complete is reported
      complete by the hook.
- [x] 2.3 (TDD: test → impl) Marking through the hook updates every subscriber, so two
      components reading the same lesson agree without a reload.
- [x] 2.4 (TDD: test → impl) A `storage` event (another tab completing a lesson) updates
      subscribers. This falls out of D2's `subscribe`; the test pins it so a later
      refactor cannot silently drop it.
- [x] 2.5 Confirm the hook is the only module naming the concrete adapter, mirroring
      `use-playback-position`. Grep for the adapter's class name — it must appear in the
      hook and its own test, nowhere else.

## 3. i18n

- [x] 3.1 (impl only — i18n) Add the indicator's accessible name under `Components.*` in
      **all three** of `src/messages/{en,es,pt}.json` (D5). Never one locale only.

## 4. The outline indicator

- [x] 4.1 (TDD: test → impl) A completed lesson's row in `lesson-list.tsx` shows the
      indicator; an uncompleted one shows none. `lesson-list.tsx` sits inside
      `lesson-view.tsx`'s `"use client"` subtree, so it calls the hook directly — no
      island needed (D3).
- [x] 4.2 (TDD: test → impl) The current lesson keeps `aria-current` when it is also
      complete — the two markers coexist rather than one replacing the other.
- [x] 4.3 (TDD: test → impl) No explicit "not completed" marker is rendered for
      uncompleted rows (D2). Assert the absence, so a future "grey ✗" cannot creep in and
      make the pre-hydration frame assert something false.
- [x] 4.4 (TDD: test → impl) The indicator carries a localized accessible name and does
      not rely on colour alone.

## 5. The episode-row indicator

- [x] 5.1 (TDD: test → impl) A completed lesson's episode row shows the indicator.
      Minimal impl: a small client component for the mark only — `module-overview.tsx`
      stays a Server Component (D3). Do NOT add `"use client"` to it.
- [x] 5.2 (TDD: test → impl) The row keeps its eyebrow, title, duration and working
      "Open" action alongside the indicator.
- [x] 5.3 Confirm `module-overview.tsx` still has no `"use client"` directive — the
      check that D3 was actually honoured rather than shortcut.

## 6. The Mark-as-complete button

- [x] 6.1 (TDD: test → impl) The button mounts as completed when the store already says
      so, instead of always starting at `useState(false)` (D4).
- [x] 6.2 (TDD: test → impl) Clicking marks the lesson in the browser store, and a
      completion indicator rendered alongside observes the change without a reload.
- [x] 6.3 (impl only — docs) Update the button's JSDoc to state that the click writes to
      both the durable browser store and the ephemeral server tracker via
      `markLessonCompleteAction`, and why the Server Action stays (D4) — so the next
      reader does not delete it as dead code.

## 7. Stories

- [x] 7.1 (impl only — stories) Add completed/uncompleted states to the touched stories so
      both are reviewable side by side. Do not mock `next-intl` (AGENTS.md § Storybook).
- [x] 7.2 Review at `en`, `es` and `pt` and confirm the a11y addon reports no new
      violations on the indicator — in particular that it is not colour-only.

## 8. Regression check

- [x] 8.1 Confirm the server dependency graph still binds `InMemoryProgressTracker` and
      that no server-side module imports the browser adapter. A server-side import would
      bundle `window` access into the server build.
- [x] 8.2 Confirm playback position is unaffected: marking complete does not clear a saved
      position, and a saved position does not imply completion.
- [x] 8.3 Confirm the existing outline, episode-list and button tests stay green.

## 9. Verification

- [x] 9.1 Run `pnpm test:run` — all Vitest unit and component tests green.
- [x] 9.2 Run `pnpm verify` (typecheck → format:check → lint → test:run) and fix any
      failure at its root cause, per AGENTS.md § Before finishing.
- [x] 9.3 In the browser: mark a lesson complete, reload, and confirm the mark survives in
      both the outline and the module overview — the reported symptom.
- [x] 9.4 In the browser: restart the dev server and confirm the mark still survives,
      which is what distinguishes this from the in-memory tracker.
- [x] 9.5 In the browser: check the DevTools console for a hydration mismatch warning on
      a page with completed lessons. D2 exists to prevent it; this is where that is
      actually confirmed.
      **Outcome:** no hydration mismatch — D2 holds. The console did surface a different
      error ("The final argument passed to useEffect changed size between renders", from
      `use-debounce` inside `PlaybackPositionedVideoPlayer`), which is NOT from this
      change: it comes from an uncommitted `onPlaybackStart` edit that appeared in the
      working tree mid-session and is not part of this work. Proved by stashing only that
      file and reloading — zero console errors with this change still applied — then
      restoring it untouched. Reported to the user rather than fixed or committed here.

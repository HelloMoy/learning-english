## Context

`useLessonRewardMoment` lives in `LessonView`. It shows the ticket notification and, on the toast's own
`onDone`, opens `PrizeReadyModal`. Navigating away unmounts the lesson page, which cancels the toast's
timer, so `onDone` never fires and the dialog never opens — measured, not assumed. The prize is
unaffected: the ticket is stored and the counter shows it ready to claim.

The counter already knows what is ready; nothing outside the Achievements page does, because
`SiteHeader` only reads the learner's profile from storage.

## Goals / Non-Goals

**Goals:**

- The announcement outlives the page that started it, and is made once.
- An unclaimed prize is findable from anywhere, without an interruption.
- One source of truth for "ready to claim": the existing derivation.

**Non-Goals:**

- Announcing tickets, notifying outside the app, or nagging (see the proposal).

## Decisions

### D1 — A pending announcement is a stored fact, like the ticket that caused it

`src/hooks/use-pending-prize-announcement/` keeps one `learning-english:prize-announce` key holding the
module slug, with the same `useSyncExternalStore` shape as the other device stores, and the same
exported refresh so tests can clear it.

`useLessonRewardMoment` records it the moment the last ticket is earned — before the notification plays,
not after — so leaving mid-notification cannot lose it. The lesson page still opens the dialog itself
when the notification ends; that path now also clears the record.

- *Alternative:* keep it in memory and re-open on the next render. It dies with the page, which is the
  bug.

### D2 — `GlobalProviders` is where a pending announcement is honoured

It wraps every route and already holds `NiceModal.Provider`, so a `PendingPrizeAnnouncement` mounted
there opens the dialog on whatever page the learner lands on. It needs the catalog to name the prize and
to check the prize is still waiting, which the layout passes down (D3).

It does not open the dialog on the Achievements page: the learner is already looking at the counter, and
the prize is pointed out there.

### D3 — The catalog reaches the header and the providers from the layout

`LocaleLayout` already renders on the server; it resolves the catalog with `loadCatalogEntries` and
`catalogLevels`, exactly as the Achievements page does, and passes the levels to `SiteHeader` and
`GlobalProviders`. Counting stays in the client, over `useLearnerAchievements`, so "ready to claim"
keeps one definition.

- *Alternative:* store a count when the Achievements page computes it. That invents a second source of
  truth which goes stale for a learner who never opens the page — the exact learner this change is for.

### D4 — The mark is a count, on the avatar and on the menu item

A closed menu is the common case, so the avatar carries the mark; the Achievements item carries it too,
for when the menu is open. Both are decoration for assistive technology, which hears one sentence
(`{count, plural, …}`) on the menu trigger instead. Gold is avoided here for the same reason as on the
counter: gold is what a claimed prize wears.

## Risks / Trade-offs

- [The dialog opens on a page that has nothing to do with lessons] → that is the point, and it is the
  same dialog with the same two ways out; it is shown once.
- [The layout now resolves the catalog on every route] → `loadCatalogEntries` is `cache`d per request and
  the Achievements page already pays it; the home and lesson routes resolve it too.
- [A learner with several unclaimed prizes] → the mark counts them; the announcement names the one just
  earned.

## Migration Plan

None. A device with no record behaves as it does today.

## Testing strategy

- **Vitest hooks** — `use-pending-prize-announcement` (records, reads, clears, shared snapshot);
  `use-lesson-reward-moment` (records when the last ticket is earned, clears when it announces).
- **Vitest + RTL** — `PendingPrizeAnnouncement` (opens the dialog when a record names a waiting prize;
  silent when it names a claimed one, and on the Achievements page); `SiteHeader` (marks the avatar and
  the item while a prize waits, nothing when none does, wording in `en`/`es`/`pt`).
- **Playwright e2e** — `e2e/lesson-rewards.spec.ts`: moving on to the next lesson still gets the dialog
  there, and the avatar is marked until the prize is claimed.
- **Visual review** — Playwright MCP of the mark in both themes and at phone width.

## 1. The announcement is a stored fact

- [x] 1.1 `usePendingPrizeAnnouncement` in `src/hooks/use-pending-prize-announcement/`: reads the pending module slug, `announcePrize(slug)` records it, `clearPendingPrize()` drops it, with an exported refresh for tests (TDD: hook test → impl; JSDoc)
- [x] 1.2 `useLessonRewardMoment` records the announcement as soon as the module's last ticket is earned, and clears it when it opens the dialog itself (TDD: update hook test → impl)

## 2. The announcement is honoured on the next page

- [x] 2.1 `PendingPrizeAnnouncement` opens the waiting-prize dialog for a recorded prize that is still waiting, clears the record, and shows nothing for a claimed one or on the Achievements page (TDD: RTL test → impl; JSDoc)
- [x] 2.2 `LocaleLayout` resolves the catalog and passes the levels to `GlobalProviders`, which mounts the announcement (TDD: RTL test → impl)

## 3. An unclaimed prize is marked in the header

- [x] 3.1 `SiteHeader` takes the catalog levels and marks the avatar and the Achievements item while prizes are ready, with the count announced in words; nothing when none is ready (TDD: RTL test → impl; `SiteHeader` messages in en/es/pt)
- [x] 3.2 `LocaleLayout` passes the levels to `SiteHeader`; its story and tests cover marked and unmarked (TDD: test → impl; stories)

## 4. End-to-end and review

- [x] 4.1 `e2e/lesson-rewards.spec.ts`: moving on to the next lesson before the notification leaves still opens the dialog there, and the avatar stays marked until the prize is claimed (TDD: spec red → green)
- [x] 4.2 Visual review with Playwright MCP of the mark, both themes and phone width
- [x] 4.3 Run `pnpm verify` and `pnpm test:e2e e2e/achievements.spec.ts e2e/lesson-rewards.spec.ts e2e/home.spec.ts` (Chromium) and fix every failure

## 1. Lesson slice carries title and sequence

- [x] 1.1 `toLessonProgressSlice` includes the lesson `title` and `sequence` in `LessonProgressSlice` (TDD: failing assertion in `find-course-catalog.test.ts` → add the fields)
- [x] 1.2 Update every test, story and fixture that builds a slice so `pnpm typecheck` passes (TDD: typecheck red → fixtures green)

## 2. Pure derivation

- [x] 2.1 `sealSymbol(title, position)` in `src/lib/learner-achievements/learner-achievements.ts`: one sound, first of two sounds, no sound falls back to position, blank slashes fall back (TDD: test → impl)
- [x] 2.2 `learnerAchievements({ levels, isEarned })` returns seals per module in sequence order and badge states `earned` / `in-progress` / `not-started`, skipping modules without lessons (TDD: test → impl)
- [x] 2.3 Totals (seals earned of all lessons, badges earned of modules with lessons) and the distinction `student` / `bronze` / `gold`, ignoring courses without lessons (TDD: test → impl)
- [x] 2.4 Each module's `emblem`: its first named sound, or its sequence number when none (TDD: test → impl)

## 3. Client hook

- [x] 3.1 `useLearnerAchievements(levels)` in `src/hooks/use-learner-achievements/` builds `isEarned` from `useCompletedLessons`, `useSavedPlaybackPositions` and `countsAsComplete`: marked lesson earns, watched-to-the-end lesson earns, un-mark removes (TDD: test → impl)

## 4. Components

- [x] 4.1 Add bronze tokens (border/glow and a contrast-safe text shade) for both themes in `src/app/globals.css`
- [x] 4.2 `LearnerCard` optional `distinction` renders the finish and localized label; omitted keeps today's output (TDD: RTL test → impl; story; JSDoc; `Components.LearnerCard` messages in en/es/pt)
- [x] 4.3 `AchievementSeal`: symbol, earned/not-earned by more than color, accessible name with lesson title and state (TDD: RTL test → impl; stories incl. longest real symbols; JSDoc; `Components.AchievementSeal` messages)
- [x] 4.4 `ModuleBadge`: medallion with the module emblem, module name, state text, `<details>` disclosure of its seals, `defaultOpen` (TDD: RTL test → impl; stories for the three states; JSDoc; `Components.ModuleBadge` messages with ICU plurals)
- [x] 4.5 `LearnerAchievements`: summary counts, one badge grid per course in catalog order, first in-progress module open (TDD: RTL test → impl; stories; JSDoc; `Components.LearnerAchievements` messages)

## 5. Profile returns to its current behavior

- [x] 5.1 Restore `ProfileView`, its tests and stories, `profile/page.tsx` and the `Profile` / `Metadata.profileDescription` messages to `main`, keeping the slice fixture fields from 1.2 (TDD: restored `profile-view.test.tsx` green)
- [x] 5.2 Restore the Profile flow in `e2e/home.spec.ts` to `main`

## 6. Achievements route

- [x] 6.1 `AchievementsView`: shell before storage, redirect to `/start` without a profile, learner card with the distinction, heading, Edit card link to `/profile`, `LearnerAchievements` (TDD: RTL test → impl; stories; JSDoc; `Achievements` messages in en/es/pt)
- [x] 6.2 `src/app/[locale]/achievements/page.tsx` with `personalRouteMetadata` and `loading.tsx`; `Metadata.achievementsTitle` / `achievementsDescription` in en/es/pt (TDD: metadata test → impl)
- [x] 6.3 Avatar menu item **Achievements** between My learning and Profile, and `sectionKey` returns `sectionAchievements` for `/achievements` (TDD: `site-header.test.tsx` → impl; `SiteHeader` messages in en/es/pt)
- [x] 6.4 Visual review of `/es/achievements` in both themes and at phone width, and of the avatar menu at 320px, with Playwright MCP

## 7. End-to-end

- [x] 7.1 Replace `e2e/profile-achievements.spec.ts` with `e2e/achievements.spec.ts`: the avatar menu reaches `/es/achievements`; with one stored completion the earned count shows and the unfolded earned badge announces its seal; Edit card lands on `/es/profile` (TDD: spec red → green)

## 8. Verification

- [x] 8.1 Run `pnpm verify` and `pnpm test:e2e e2e/achievements.spec.ts e2e/home.spec.ts e2e/mobile-viewport.spec.ts` (Chromium) and fix every failure

## 9. How achievements work

- [x] 9.1 `AchievementsGuideModal` in `src/components/modals/achievements-guide-modal/`: a named dialog explaining seals, badges, distinctions and un-marking, with live examples, dismissable and resolving once (TDD: RTL test mirroring `unmark-lesson-modal.test.tsx` → impl; stories; JSDoc; `Components.AchievementsGuideModal` messages in en/es/pt)
- [x] 9.2 `AchievementsView` replaces the Edit card link with **How do they work?**, which opens the modal and gets focus back on close; drop `Achievements.editCard` (TDD: RTL test → impl; `Achievements.howItWorks` messages)

## 10. Motion

- [x] 10.1 `achievement-rise`, `achievement-stamp`, `achievement-ring-fill` (with `@property --earned-share`) and `achievement-shimmer` keyframes and utility classes in `src/app/globals.css`, each ending on the resting style
- [x] 10.2 `useCountUp(target)` in `src/hooks/use-count-up/`: target at once under reduced motion or without `matchMedia`; otherwise 0 → target over its duration (TDD: fake-timer test → impl; JSDoc)
- [x] 10.3 `AchievementSeal` takes a `motionOrder`: earned seals stamp in order, unearned seals rise in order (TDD: RTL test on classes and `--motion-order` → impl; story)
- [x] 10.4 `ModuleBadge`: in-progress ring fills, earned medallion shimmers, revealed seals receive their lesson index as motion order (TDD: RTL test → impl)
- [x] 10.5 `LearnerAchievements`: counts count up with a visually hidden final sentence, counts and course sections rise in sequence (TDD: RTL test → impl; update tests reading the counts)
- [x] 10.6 `AchievementsView` header block rises; `AchievementsGuideModal` levels rise in sequence (TDD: RTL test → impl)
- [x] 10.7 Visual review of the motion with Playwright MCP, with motion on and with reduced motion emulated

## 11. End-to-end and verification

- [x] 11.1 Update `e2e/achievements.spec.ts`: How do they work? opens the explanation and Escape closes it, replacing the Edit card case; the count assertion reads the final text (TDD: spec red → green)
- [x] 11.2 Run `pnpm verify` and `pnpm test:e2e e2e/achievements.spec.ts e2e/home.spec.ts` (Chromium) and fix every failure

## 12. Tickets and prizes in the domain library

- [x] 12.1 `prizeForModule(slug)` in `src/lib/module-prizes/`: the fifteen slugs map to their prizes, anything else to `gift`; a test reads the shipped content manifest and fails if a module slug is not catalogued (TDD: test → impl; JSDoc)
- [x] 12.2 Rename the derivation to the new language: `ticketSymbol`, `Ticket`, `PrizeState` (`redeemed` / `collecting` / `locked`), each module's `prize`, `ticketsEarned` / `ticketCount` / `prizesRedeemed` / `prizeCount`; remove the seal/badge names and the emblem (TDD: update `learner-achievements.test.ts` to the new names and add the prize-per-module case → impl)
- [x] 12.3 Update `useLearnerAchievements` and its test to the renamed values (TDD: test → impl)

## 13. Prize and ticket components

- [x] 13.1 `--ticket`, `--ticket-ink` and `--prize-silhouette` tokens for both themes in `src/app/globals.css`
- [x] 13.2 `PrizeIcon`: sixteen inline SVG prizes, colour or single-colour silhouette, decorative (TDD: RTL test → impl; story sheet of all prizes in both states; JSDoc; `Components.PrizeIcon.names` in en/es/pt)
- [x] 13.3 `LessonTicket` replaces `AchievementSeal`: notched cream ticket with the lesson symbol; delete `AchievementSeal` (TDD: RTL test → impl; stories; JSDoc; messages)
- [x] 13.4 `PrizeShelfItem`: prize, visible name or `???`, ticket-shaped tag `n / total` or Redeemed, accessible state in words, sway on collecting, glow on redeemed (TDD: RTL test → impl; stories for the three states; JSDoc; messages with ICU plurals)
- [x] 13.5 `PrizeCounter`: one shelf per course in catalog order, prizes in module order, rising in sequence; replaces `ModuleBadge`, which is deleted (TDD: RTL test → impl; stories; JSDoc; messages)
- [x] 13.6 `LearnerAchievements` shows ticket and prize counts and the `PrizeCounter` (TDD: update test → impl; stories; messages)
- [x] 13.7 `AchievementsGuideModal` explains tickets, prizes, distinction and un-marking with a `LessonTicket` and a `PrizeIcon` as examples (TDD: update test → impl; messages)

## 14. Reward moments on the lesson page

- [x] 14.1 `useLessonRewardMoment({ lesson, moduleLessons })`: nothing on mount; a ticket moment on a `false → true` transition; `PrizeRedeemedModal` instead when the transition completes the module; nothing on un-mark or repeat renders (TDD: hook test with storage and NiceModal → impl; JSDoc)
- [x] 14.2 `TicketToast`: status pill with the dispensing ticket, `n of total tickets for the <module> prize` and the prize silhouette; clears itself after five seconds (TDD: RTL test with fake timers → impl; stories; JSDoc; messages)
- [x] 14.3 `PrizeRedeemedModal`: NiceModal + Dialog revealing the prize, naming prize, module and tickets, Keep learning and See my prizes, focus return (TDD: RTL test → impl; stories; JSDoc; messages)
- [x] 14.4 `LessonView` mounts the reward moment and renders the ticket toast (TDD: RTL test → impl)
- [x] 14.5 Ticket, toast, prize-counter and redeem keyframes in `src/app/globals.css`, each ending on the resting style, switched off under reduced motion

## 15. Language and glossary

- [x] 15.1 Replace every remaining seal/badge name in code, stories, tests and messages (`Components.AchievementSeal`, `Components.ModuleBadge`, `sealCount`, `badgeCount`, …) with ticket/prize equivalents; `grep -ri "seal\|badge" src e2e` finds none in achievement code
- [x] 15.2 `GLOSSARY.md`: add Ticket, Prize and Distinction, and a decision-log row choosing them over seal and badge

## 16. End-to-end

- [x] 16.1 Update `e2e/achievements.spec.ts` to the prize counter: stored completion shows 1 prize redeemed with the whistle named; the Vowels prize announces its hidden state; How do they work? still opens (TDD: spec red → green)
- [x] 16.2 `e2e/lesson-rewards.spec.ts`: marking a lesson complete shows the ticket notification, which leaves on its own; marking the only lesson of `1-introduction` opens the prize dialog naming the whistle, and See my prizes lands on the counter (TDD: spec red → green)

## 17. Review and verification

- [x] 17.1 Visual review with Playwright MCP of the counter, the ticket toast and the redeem dialog, desktop and phone, with motion and with reduced motion
- [x] 17.2 Run `pnpm verify` and `pnpm test:e2e e2e/achievements.spec.ts e2e/lesson-rewards.spec.ts e2e/home.spec.ts` (Chromium) and fix every failure

## 18. Claiming the prize

- [x] 18.1 `usePrizeClaims` in `src/hooks/use-prize-claims/`: `useClaimedPrizes()` snapshot of the `learning-english:prize-claimed:*` keys and `claimPrize(slug)`, shared across subscribers and surviving a reload (TDD: hook test with storage → impl; JSDoc)
- [x] 18.2 `PrizeState` gains `ready`; `learnerAchievements({ levels, isEarned, isClaimed })` returns `claimed` / `ready` / `collecting` / `locked`, counts `prizesRedeemed` as claimed only, and keeps the distinction on tickets alone (TDD: update `learner-achievements.test.ts`, incl. claimed-then-un-marked → impl)
- [x] 18.3 `useLearnerAchievements` supplies `isClaimed` from `useClaimedPrizes` (TDD: test → impl)
- [x] 18.4 `PrizeShelfItem` renders the ready state: silhouette, no name, a **Claim prize** control naming its module, its accessible state in words, and the pulse; `onClaim` fires with the module slug (TDD: RTL test → impl; story for the ready state; messages)
- [x] 18.5 `PrizeCounter` and `LearnerAchievements` pass `onClaim` through to the shelf (TDD: RTL test → impl; stories)
- [x] 18.6 `AchievementsView` claims on activation and then opens `PrizeRedeemedModal`, so an Escape mid-reveal keeps the claim; focus returns to the revealed prize (TDD: RTL test → impl)
- [x] 18.7 `PrizeRedeemedModal` drops **See my prizes** and **Keep learning** for a single closing control, since it is now shown on the counter (TDD: update test → impl; stories; messages)
- [x] 18.8 `PrizeReadyModal` in `src/components/modals/prize-ready-modal/`: silhouette only, names the module and its tickets, **Go and claim the prize** (link to `/achievements`) and **Keep learning**, focus return (TDD: RTL test → impl; stories; JSDoc; messages in en/es/pt)
- [x] 18.9 `useLessonRewardMoment` returns a ticket moment for every transition, carrying whether it collected the module's last ticket, and opens `PrizeReadyModal` when that toast is done — never for an already complete module (TDD: update hook test → impl)
- [x] 18.10 `TicketToast` sits at the top centre at every width (TDD: update RTL test → impl; story)
- [x] 18.11 Claim-pulse keyframes in `src/app/globals.css`, ending on the resting style and switched off under reduced motion
- [x] 18.12 `GLOSSARY.md`: **Claim** as its own entry, Prize updated to the four states, and a decision-log row for claiming on the counter
- [x] 18.13 Update `e2e/lesson-rewards.spec.ts` (the last ticket shows the notification, then the waiting-prize dialog, and Go and claim lands on the counter) and `e2e/achievements.spec.ts` (a complete module offers Claim prize; claiming reveals the whistle and the shelf keeps it after a reload) (TDD: specs red → green)
- [x] 18.14 Visual review with Playwright MCP of the top notification, the waiting-prize dialog, the ready shelf item and the reveal, desktop and phone, with motion and with reduced motion
- [x] 18.15 Run `pnpm verify` and `pnpm test:e2e e2e/achievements.spec.ts e2e/lesson-rewards.spec.ts e2e/home.spec.ts` (Chromium) and fix every failure

## 19. A ticket is kept once earned

- [x] 19.1 `useEarnedTickets` in `src/hooks/use-earned-tickets/`: `useEarnedTickets()` snapshot of the `learning-english:ticket-earned:*` keys and `earnTickets(lessonIds)` that writes only what is new and notifies only when something was written (TDD: hook test with storage → impl; JSDoc)
- [x] 19.2 `useLearnerAchievements` counts a ticket as earned when it is stored or the lesson counts as complete, and records every complete lesson that is not yet stored, so un-marking keeps the ticket (TDD: hook test — un-mark keeps it, re-completing adds none → impl)
- [x] 19.3 `useLessonRewardMoment` announces the ticket only the first time the lesson earns it, and records it (TDD: update hook test — un-mark and re-mark stays quiet → impl)
- [x] 19.4 `AchievementsGuideModal` and its messages say a ticket is kept once earned, in en/es/pt (TDD: update test → impl)
- [x] 19.5 `GLOSSARY.md`: Ticket says it is kept once earned, with a decision-log row
- [x] 19.6 `e2e/lesson-rewards.spec.ts`: un-marking a lesson keeps the module's tickets on the counter (TDD: spec red → green)

## 20. Rewards while watching fullscreen

- [x] 20.1 `useFullscreenElement` in `src/hooks/use-fullscreen-element/`: the presented element or `null`, following `fullscreenchange`, `null` before hydration (TDD: hook test → impl; JSDoc)
- [x] 20.2 `TicketToast` portals its status region into the fullscreen element while there is one, and renders in place otherwise (TDD: RTL test → impl)
- [x] 20.3 `useLessonRewardMoment` holds the waiting-prize dialog while the learner is in fullscreen and opens it when they leave (TDD: hook test → impl)
- [x] 20.4 `e2e/lesson-rewards.spec.ts`: in fullscreen the notification is inside the presented element, and the dialog opens only after leaving fullscreen (TDD: spec red → green)
- [x] 20.5 Visual review with Playwright MCP of both moments in fullscreen
- [x] 20.6 Run `pnpm verify` and `pnpm test:e2e e2e/achievements.spec.ts e2e/lesson-rewards.spec.ts e2e/home.spec.ts` (Chromium) and fix every failure
- [x] 20.7 The waiting dialog opens a beat after the exit from fullscreen, so its entrance is seen rather than spent behind the browser's restore (TDD: hook test with fake timers → impl)
- [x] 20.8 Visual review with Playwright MCP of the dialog arriving after leaving fullscreen, and re-run `pnpm verify` and the reward e2e specs

## 21. The counter points out the prize the learner came for

- [x] 21.1 **Go and claim the prize** links to `/achievements?claim=<moduleSlug>` (TDD: update `prize-ready-modal.test.tsx` → impl)
- [x] 21.2 `PrizeShelfItem` takes `isCalled` and points itself out while it is set, without losing the Claim prize control (TDD: RTL test → impl; story)
- [x] 21.3 `PrizeCounter` and `LearnerAchievements` pass the called module through to its shelf item (TDD: RTL test → impl)
- [x] 21.4 `AchievementsView` reads `claim` with `nuqs`, brings that prize into view, focuses it, points it out for a few seconds and clears the param; a module with nothing to claim is ignored (TDD: RTL test → impl)
- [x] 21.5 `prize-called` keyframes in `src/app/globals.css`, ending on the resting style and still under reduced motion
- [x] 21.6 `e2e/lesson-rewards.spec.ts`: Go and claim the prize lands on the counter with that prize in view and pointed out (TDD: spec red → green)
- [x] 21.7 Visual review with Playwright MCP, then `pnpm verify` and the reward e2e specs

## 22. The called prize waves instead of being boxed in

- [x] 22.1 `prize-called` moves to the prize illustration and becomes a wave, with a still glow under reduced motion; the shelf item and its Claim prize control stay put (TDD: RTL tests on which element carries it → impl; `globals.css`)
- [x] 22.2 Visual review with Playwright MCP of the waving prize, with motion and with reduced motion, then `pnpm verify` and the reward e2e specs

## 23. The how-it-works dialog says less

- [x] 23.1 The prize level drops the silhouette from its example and the "waits as a silhouette" line; the un-marking note is removed along with its message in en/es/pt (TDD: update `achievements-guide-modal.test.tsx` → impl; messages)
- [x] 23.2 Run `pnpm verify` and `pnpm test:e2e e2e/achievements.spec.ts` (Chromium) and fix every failure

## 24. The waiting prize is not lit in gold

- [x] 24.1 `prize-called` drops the gold glow; under reduced motion the prize carries a colourless one instead, so the gold still belongs to claiming (`globals.css`)
- [x] 24.2 Visual review with Playwright MCP, with motion and with reduced motion, then `pnpm verify` and the reward e2e specs

## 25. The waiting prize wears a colourless aura

- [x] 25.1 `prize-called` carries the aura at all times, not only under reduced motion, so the prize stands out among the silhouettes (`globals.css`)
- [x] 25.2 Visual review with Playwright MCP in both themes, with motion and with reduced motion, then `pnpm verify` and the reward e2e specs

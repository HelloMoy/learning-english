## Why

After `learner-progress-in-database`, completion, positions, location and profile follow the learner
across devices, but the rewards built on them do not. Earned tickets and claimed prizes are still
`localStorage` keys, written by two hooks that reach storage directly without a domain port. A
learner who finishes a module on a phone and opens Achievements on a laptop sees tickets derived
from completion there, but not their claimed prizes. Worse, a ticket kept after an un-mark (the
spec's "keeps it" rule) exists only on the phone. This change gives both concepts a port and moves
them to the learner's rows.

## What Changes

- **Two new domain ports:** `EarnedTicketRepository` (list the earned lesson ids, earn a batch
  idempotently) and `PrizeClaimRepository` (list the claimed module slugs, claim one idempotently).
  Each has an in-memory adapter for use-case tests and stories, and a Turso adapter bound to one
  learner.
- **Two tables:** `earned_ticket(user_id, lesson_id)` and `prize_claim(user_id, module_slug)`, with
  `ON DELETE CASCADE` to `user`.
- **The learner snapshot and client store gain** `earnedTicketLessonIds` and
  `claimedPrizeModuleSlugs`. `useEarnedTickets` / `earnTickets` and `useClaimedPrizes` /
  `claimPrize` keep their public API and write through authenticated actions with optimistic
  rollback, like the progress roots.
- **BREAKING. Tickets and claims are per account.** Existing `ticket-earned:*` and
  `prize-claimed:*` keys are ignored, as decided for all legacy state.
- The **pending-prize announcement stays on the device** on purpose. It is a "show this dialog once
  here" flag, not a reward.

## Capabilities

### New Capabilities

- None. The storage is covered by the existing `learner-state` capability, which this change
  extends.

### Modified Capabilities

- `learner-achievements`: tickets and claims are stored per account behind ports, instead of per
  device.
- `learner-state`: the snapshot, tables, adapters and write actions cover tickets and claims.

## Non-goals

- Moving the pending-prize announcement, the seek step or the theme to the server.
- Changing any reward rule: when a ticket is earned, when a prize is ready, distinctions, copy or
  motion.
- Importing legacy keys.
- Rendering rewards on the server. The hydration behavior is unchanged.

## Impact

- **Domain:** `src/domain/ports/earned-ticket-repository/`, `src/domain/ports/prize-claim-repository/`,
  and in-memory adapters under `src/adapters/persistence/in-memory/`.
- **Turso:** two tables and a migration, two adapters, plus the `learner-repositories` factory and
  `loadLearnerSnapshot`.
- **Actions:** `earnTicketsAction`, `claimPrizeAction` in `learner-actions.ts`.
- **Hooks:** `use-earned-tickets`, `use-prize-claims`. `use-learner-achievements` and
  `use-lesson-reward-moment` are unchanged callers.
- **Tests and stories** that seeded `ticket-earned:*` or `prize-claimed:*` switch to
  `seedLearnerStore()`. The e2e specs `module-route`, `course-overview`, `achievements` and
  `lesson-rewards` seed rows instead.

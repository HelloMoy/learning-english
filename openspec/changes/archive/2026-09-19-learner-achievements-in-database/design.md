## Context

`use-earned-tickets` and `use-prize-claims` are module stores over `localStorage` prefixes
(`learning-english:ticket-earned:<lessonId>`, `learning-english:prize-claimed:<moduleSlug>`). They
never went through a port, and are the last learner state outside the database once
`learner-progress-in-database` lands. That change built everything this one needs: the
`learner-repositories` factory, `loadLearnerSnapshot`, the learner store with `writeThrough`,
`learnerActionClient`, and the e2e learner fixture.

## Goals / Non-Goals

**Goals:** give tickets and claims domain ports, store them per account, and keep both hooks' public
APIs and every reward rule unchanged.

**Non-Goals:** the pending-prize announcement (a device flag by design), reward rules, and SSR of
rewards.

## Decisions

### D1 — Ports shaped like the hooks already use them

`EarnedTicketRepository.earn(lessonIds)` takes a batch, because `earnTickets` is called with every
complete lesson a page knows about (the Achievements back-fill). `list()` returns a `ReadonlySet`,
because every consumer asks set questions. `PrizeClaimRepository.claim(moduleSlug)` is single,
matching `claimPrize`. Both writes are idempotent, so the hook's "skip what is held" check is an
optimization, not a correctness requirement.

*Alternative:* one `RewardRepository` for both. Rejected: tickets are keyed by lesson and claims by
module, and they change for different reasons.

### D2 — Tables and adapters

- `earned_ticket(user_id, lesson_id, earned_at, PK(user_id, lesson_id))`
- `prize_claim(user_id, module_slug, claimed_at, PK(user_id, module_slug))`

Both cascade from `user`. Batch earns are one `INSERT … ON CONFLICT DO NOTHING` with many rows.
Adapters live in `turso-earned-ticket-repository/` and `turso-prize-claim-repository/`, and the
in-memory twins in `in-memory/`.

### D3 — Same client pattern as the progress roots

The snapshot gains `earnedTicketLessonIds: string[]` and `claimedPrizeModuleSlugs: string[]`. The
two hooks select them from the learner store (identity-stable sets) and keep their empty server
snapshots. `earnTickets` computes the unearned ids against the store, returns early when there are
none, applies them, and calls `earnTicketsAction({ lessonIds })` through `writeThrough`. `claimPrize`
does the same with `claimPrizeAction({ moduleSlug })`. The `storage`-event listeners go.

`use-pending-prize-announcement` keeps `localStorage`. It already clears its record when a claim
happens, through `useClaimedPrizes`, which now reads the store. That behavior is unchanged.

## Testing strategy

| Behavior | Layer | Mirrors |
|---|---|---|
| Both Turso adapters: idempotent writes, learner isolation, cascade | Vitest integration + testcontainers | the change-2 adapter suites |
| Both in-memory adapters honour the same scenarios | Vitest unit | `in-memory-progress-tracker.test.ts` |
| Actions: session refusal, validation, write | Vitest unit/integration | change-2 action tests |
| `useEarnedTickets` / `earnTickets`, `useClaimedPrizes` / `claimPrize`: server snapshot empty, seeded after hydration, no-op on nothing new, optimistic plus rollback | Vitest + RTL `renderHook` | `use-earned-tickets.test.ts`, `use-prize-claims.test.ts` |
| Consumers (`achievements-view`, `use-learner-achievements`, `use-lesson-reward-moment`, `use-module-prize`, `pending-prize-announcement`, …) | Vitest + RTL through `seedLearnerStore()` | existing tests, unchanged assertions |
| Claim on context A shows as claimed on context B; e2e specs that seeded claim keys seed rows | Playwright | `achievements.spec.ts`, `lesson-rewards.spec.ts` |

## Risks / Trade-offs

- **A learner who earned tickets offline-style before this change loses kept tickets for
  un-marked lessons.** This is the accepted cost of discarding legacy state. Tickets for lessons
  that are still complete are re-derived by the existing "counts as complete" rule.
- **Batch size for `earn`.** At most one module's lessons in the normal flow, and the whole catalog
  (~150 rows) on the Achievements back-fill. A single statement handles both.

## Migration Plan

`pnpm db:migrate` adds the two tables. Rollback: revert, and the tables stay unused.

## Open Questions

- None.

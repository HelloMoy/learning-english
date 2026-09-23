## 1. Domain ports

- [x] 1.1 `EarnedTicketRepository` and `PrizeClaimRepository` ports with JSDoc (types only, no TDD)
- [x] 1.2 In-memory adapters for both: idempotent writes, set reads (TDD: test → impl)

## 2. Persistence

- [x] 2.1 `earned_ticket` and `prize_claim` tables with `ON DELETE CASCADE`, plus the migration. Integration test for existence and cascade (TDD: test → impl)
- [x] 2.2 `TursoEarnedTicketRepository`: batch idempotent earn, learner isolation (TDD: test → impl)
- [x] 2.3 `TursoPrizeClaimRepository`: idempotent claim, learner isolation (TDD: test → impl)
- [x] 2.4 Extend `createLearnerRepositories` and `loadLearnerSnapshot` with tickets and claims (TDD: test → impl)

## 3. Write path

- [x] 3.1 `earnTicketsAction` and `claimPrizeAction` on `learnerActionClient` (TDD: test → impl)

## 4. Client

- [x] 4.1 Extend the learner store and `seedLearnerStore()` with tickets and claims (TDD: test → impl)
- [x] 4.2 `use-earned-tickets` reads the store, and `earnTickets` writes through with rollback and the nothing-new no-op. Drop the storage listener (TDD: test → impl)
- [x] 4.3 `use-prize-claims` reads the store, and `claimPrize` writes through with rollback. Drop the storage listener (TDD: test → impl)
- [x] 4.4 Re-seed the consumer tests and stories that wrote `ticket-earned:*` or `prize-claimed:*` keys through `seedLearnerStore()`, and check the Achievements stories with Playwright MCP (refactor, assertions unchanged)

## 5. End-to-end

- [x] 5.1 Extend `e2e/learner-state-fixture.ts` with ticket and claim rows. Replace the `prize-claimed:*` seeding in `module-route.spec.ts` and `course-overview.spec.ts` (test infrastructure)
- [x] 5.2 Cross-device spec: a prize claimed in context A reads as claimed in context B (TDD: spec first)

## 6. Verification

- [x] 6.1 Run `pnpm verify` with Docker up, and `pnpm test:e2e --project=chromium` for `achievements`, `lesson-rewards`, `module-route` and `course-overview`. Check Achievements in the browser with Playwright MCP

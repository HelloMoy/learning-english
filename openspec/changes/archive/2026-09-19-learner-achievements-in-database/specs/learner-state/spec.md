## ADDED Requirements

### Requirement: Earned tickets and prize claims are stored per account behind ports

The domain SHALL declare `EarnedTicketRepository` (`list(): Promise<ReadonlySet<LessonId>>`, `earn(lessonIds): Promise<void>`) and `PrizeClaimRepository` (`list(): Promise<ReadonlySet<Slug>>`, `claim(moduleSlug): Promise<void>`). Both writes SHALL be idempotent. The database SHALL hold `earned_ticket` (one row per learner and lesson) and `prize_claim` (one row per learner and module), each with a foreign key to `user` declared `ON DELETE CASCADE`. Each port SHALL have an in-memory adapter and a Turso adapter bound to one learner, built by the same learner-repositories factory as the progress adapters.

#### Scenario: Earning a batch twice keeps one row per lesson
- **WHEN** `earn([a, b])` and then `earn([b, c])` are called for one learner
- **THEN** `list()` resolves to `{a, b, c}` and the table holds three rows for that learner

#### Scenario: Claims are isolated per learner
- **WHEN** learner A claims `vowels`
- **THEN** learner B's claims do not contain `vowels`

#### Scenario: Deleting a user removes their rewards
- **WHEN** a user with tickets and claims is deleted
- **THEN** neither table holds a row for that user

### Requirement: Tickets and claims join the learner snapshot and write through actions

The learner snapshot SHALL carry the earned ticket lesson ids and the claimed prize module slugs. `useEarnedTickets` and `useClaimedPrizes` SHALL read them from the learner store with their existing empty server snapshot. `earnTickets` and `claimPrize` SHALL keep their signatures and their "skip what is already held, notify nobody when nothing changed" behavior, apply the change optimistically, call `earnTicketsAction` or `claimPrizeAction` through the authenticated action client, and roll back on refusal.

#### Scenario: A claim shows at once and survives a reload
- **WHEN** the learner claims a ready prize on the counter and reloads Achievements
- **THEN** the prize reads as claimed before and after the reload

#### Scenario: Nothing new, nothing sent
- **WHEN** `earnTickets` is called with lesson ids that are all already earned
- **THEN** no action is called and no subscriber is notified

#### Scenario: A refused claim is withdrawn
- **WHEN** `claimPrizeAction` answers with a server error
- **THEN** the prize reads as ready again

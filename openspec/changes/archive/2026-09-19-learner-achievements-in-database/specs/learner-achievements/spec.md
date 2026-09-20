## MODIFIED Requirements

### Requirement: A lesson earns its ticket the first time it counts as complete, and keeps it

The application SHALL treat a lesson as having earned its ticket the first time the lesson counts as
complete for the signed-in learner, decided by the same rule every progress surface uses: the lesson is marked
complete, or its saved playback position has crossed the finish threshold.

An earned ticket SHALL be stored per learner and lesson through the `EarnedTicketRepository` port and SHALL be kept from then on: un-marking the lesson SHALL
NOT take its ticket away, and completing it again SHALL NOT earn a second one. A lesson that counts as
complete SHALL read as having earned its ticket even when no ticket was stored for it, so lessons
completed before tickets were stored still count. Tickets SHALL follow the learner to every device they sign in on.

#### Scenario: Marking a lesson complete earns its ticket
- **WHEN** the learner marks `The Vowel Sound /ɪ/ (e corta)` complete
- **THEN** that lesson's ticket is earned

#### Scenario: Watching a lesson to the end earns its ticket
- **WHEN** a lesson's saved position has crossed its finish threshold and it was never marked
- **THEN** that lesson's ticket is earned

#### Scenario: Un-marking keeps the ticket
- **WHEN** the learner un-marks a lesson that had earned its ticket and whose saved position has not crossed the finish threshold
- **THEN** that lesson's ticket is still earned and its module's tickets do not drop

#### Scenario: Completing a lesson again earns no second ticket
- **WHEN** the learner un-marks a lesson that had earned its ticket and marks it complete again
- **THEN** the module's tickets are unchanged and no ticket is announced

#### Scenario: A kept ticket follows the learner
- **WHEN** the learner earns a ticket on one device, un-marks the lesson, and signs in on another device
- **THEN** the other device still counts that ticket

### Requirement: A module's tickets ready its prize, and the learner claims it

A module SHALL be in one of four prize states:

- `claimed` — the learner has claimed the prize on the prize counter;
- `ready` — every lesson in the module has earned its ticket and the prize has not been claimed;
- `collecting` — at least one lesson has earned its ticket, and at least one has not;
- `locked` — no lesson has earned its ticket.

The claim SHALL be stored per learner and module through the `PrizeClaimRepository` port, beside the earned tickets. A claimed prize SHALL
stay claimed for good: the tickets were exchanged for it. A claim SHALL follow the learner to every device they sign in on.

A module with no lessons SHALL have no prize and SHALL NOT be counted.

#### Scenario: Every ticket readies the prize
- **WHEN** all 17 lessons of `Vowels` have earned their tickets and the prize has not been claimed
- **THEN** the `Vowels` prize is ready to claim and is not counted among the prizes redeemed

#### Scenario: A claimed prize survives an un-mark
- **WHEN** the learner has claimed the `Vowels` prize and un-marks one of its lessons
- **THEN** the `Vowels` prize is still claimed and its module still holds 17 of 17 tickets

#### Scenario: Some tickets leave the prize collecting
- **WHEN** 12 of the 17 lessons of `Vowels` have earned their tickets
- **THEN** the `Vowels` prize is collecting with 12 of 17 tickets

#### Scenario: An empty module has no prize
- **WHEN** a module holds no lessons
- **THEN** no prize is shown for it and the prize total does not include it

#### Scenario: A claim follows the learner
- **WHEN** the learner claims the `Vowels` prize on one device and opens Achievements on another
- **THEN** the `Vowels` prize is claimed there too

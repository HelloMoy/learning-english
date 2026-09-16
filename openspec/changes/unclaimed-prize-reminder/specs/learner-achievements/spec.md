## ADDED Requirements

### Requirement: A waiting prize is announced even if the learner moves on

When a completion collects a module's last ticket, the application SHALL record that the prize is
waiting to be announced, on the device.

While such a record exists, the application SHALL open the waiting-prize dialog at the first opportunity:
on the lesson page once the ticket notification has left, or — when the learner has gone elsewhere — on
the next page they open. It SHALL be announced once: showing the dialog SHALL clear the record, and so
SHALL claiming that prize.

A record naming a prize that is no longer waiting — because it has been claimed — SHALL be dropped
without announcing anything.

#### Scenario: Moving on before the dialog opens
- **WHEN** the learner collects the module's last ticket and opens the next lesson before the notification has left
- **THEN** the waiting-prize dialog opens on that next lesson

#### Scenario: Leaving for another section
- **WHEN** the learner goes to My learning in those seconds
- **THEN** the waiting-prize dialog opens there

#### Scenario: Announced once
- **WHEN** the dialog has been shown and the learner opens another page
- **THEN** it does not open again

#### Scenario: Claimed before it was announced
- **WHEN** the learner claims that prize on the counter without ever seeing the dialog
- **THEN** the record is dropped and no dialog opens afterwards

### Requirement: An unclaimed prize is marked wherever the learner is

While at least one prize is ready to claim, the avatar menu's Achievements item SHALL carry a mark
saying how many, and the avatar that opens the menu SHALL carry the same mark, so a closed menu still
shows it.

The mark SHALL be announced in words to assistive technology, SHALL disappear once every ready prize is
claimed, and SHALL NOT count prizes that are still collecting tickets or already claimed.

#### Scenario: One prize waiting
- **WHEN** a module's tickets are all earned and its prize is unclaimed
- **THEN** the avatar and its Achievements item are marked, and the mark says one prize is waiting

#### Scenario: Claiming clears the mark
- **WHEN** the learner claims the last unclaimed prize
- **THEN** the mark is gone

#### Scenario: Nothing waiting
- **WHEN** no module has all its tickets earned
- **THEN** nothing is marked

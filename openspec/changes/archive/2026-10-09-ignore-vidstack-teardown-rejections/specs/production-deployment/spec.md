## ADDED Requirements

### Requirement: Known third-party teardown noise is not reported

The Sentry configuration SHALL drop, before it is sent, the unhandled rejection that
`@vidstack/react`'s embed providers raise when a player is destroyed with commands still pending:
a non-Error rejection whose value is exactly `provider destroyed`. The rejection originates inside
the library, cannot be handled from application code, and has no effect a learner can observe.

The match SHALL be on the complete message, anchored at both ends. An error that merely contains
those words SHALL still be reported, and so SHALL every other error raised by the player.

The pattern SHALL be recorded together with why it exists and which library and behaviour it
covers, so it can be removed when the library stops raising the rejection.

#### Scenario: The player's teardown rejection is dropped
- **WHEN** a learner leaves a lesson and the player rejects a pending command with `provider destroyed`
- **THEN** no Sentry event is sent for it

#### Scenario: An error that only resembles it is still reported
- **WHEN** an error is raised whose message contains `provider destroyed` alongside other text
- **THEN** one Sentry event is captured for it

#### Scenario: Other player errors are still reported
- **WHEN** the player raises any other error
- **THEN** one Sentry event is captured for it

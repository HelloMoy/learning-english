## ADDED Requirements

### Requirement: Driving the player never leaks an unhandled rejection

The facade the resume flow drives the video player through SHALL treat `play` and `pause` as fire-and-forget: each SHALL observe the promise the player returns and discard its rejection, so that a command still in flight when the player is torn down cannot surface as an unhandled rejection.

The player's embed providers reject every pending promise when their provider is destroyed, which happens whenever the component unmounts — a learner navigating away mid-command, or a test finishing. Such a rejection is not actionable: the provider is gone because the page is. Left unobserved it fails the whole test run and, in the browser, reaches error reporting as noise.

#### Scenario: A pause still in flight when the provider is destroyed
- **WHEN** the player's `pause` rejects after the facade has called it
- **THEN** no unhandled rejection reaches the process

#### Scenario: A play still in flight when the provider is destroyed
- **WHEN** the player's `play` rejects after the facade has called it
- **THEN** no unhandled rejection reaches the process

#### Scenario: The facade reports nothing for a discarded rejection
- **WHEN** either command rejects
- **THEN** nothing is sent to error reporting, because the failure describes the page having gone rather than playback having broken

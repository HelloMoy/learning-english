## ADDED Requirements

### Requirement: The video frame is never an undressed black box

The lesson's video frame SHALL show a placeholder whenever the player is not yet able to
play, so the frame reads as a player that is coming rather than as a player that is broken.

The frame already reserves its space — its 16:9 box resolves server-side and does not
shift — but the markup inside it arrives empty: the provider's `<iframe>` has no source,
the poster `<img>` has no source, and the layout element carries no controls until the
player boots. The result is a flat black rectangle for as long as the bundle and the embed
take, which on a slow connection is the longest-lived state of the page.

The placeholder SHALL carry the lesson's own poster where the lesson declares one, so the
frame shows the actual lesson rather than a generic shape, and SHALL fall back to the
`Skeleton` shimmer where it does not. In both cases it SHALL carry a play-control and
control-bar silhouette, so the box is legible as a player.

This requirement SHALL NOT change the gold title cover or the condition under which it is
shown. The cover answers "this lesson has no carátula of its own"; the placeholder answers
"the player is not ready yet". They are different questions and both may be true at once.

#### Scenario: A booting player shows a placeholder, not a black box
- **WHEN** the lesson page renders and the player cannot yet play
- **THEN** the video frame shows the placeholder, and no undressed black rectangle is presented

#### Scenario: The placeholder shows the lesson's own poster
- **WHEN** the lesson declares a poster
- **THEN** the placeholder renders that poster inside the frame while the player boots

#### Scenario: The gold title cover is unaffected
- **WHEN** the placeholder is shown for a lesson whose cover condition is met
- **THEN** the gold title cover renders exactly as it does today, over the placeholder

#### Scenario: The ready player is unobstructed
- **WHEN** the player reports it can play
- **THEN** the placeholder is gone and every player control, gesture and overlay behaves as it does today

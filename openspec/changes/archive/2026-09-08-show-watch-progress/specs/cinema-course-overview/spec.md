## ADDED Requirements

### Requirement: Showcase cards report how far the learner has got through the module

Each module showcase card's left panel SHALL carry the module progress meter specified
by the `watch-progress` capability — a bar and a localized "N / M videos" label —
placed between the count line and the call to action, so the learner reads what the
module holds, then how much of it is behind them, then the way in.

The meter SHALL NOT replace or displace any existing part of the card: the ordinal
outside the panel, the title, the count line, the call to action and the receding
gallery all remain, and the call to action remains the panel's only control. The meter
is not interactive and is not a second way into the module.

Because progress is read in the browser after hydration, the meter SHALL be the only
client-rendered part of the card; the rest of the course overview SHALL continue to
render on the server. A module with no complete lesson SHALL render no meter, so the
pre-hydration frame asserts nothing about the learner's progress.

The meter SHALL count every lesson the module holds, not only the leading lessons the
gallery previews.

#### Scenario: A partly completed module shows its count
- **WHEN** a card renders for a module holding 17 lessons of which 7 are complete
- **THEN** its left panel shows a bar filled to 7/17 and a localized "7 / 17 videos" label, between the count line and the call to action

#### Scenario: The meter counts past the gallery's preview
- **WHEN** a module holds 17 lessons, the gallery previews 6 of them, and a lesson outside that preview is complete
- **THEN** the meter counts it, reporting a denominator of 17

#### Scenario: An untouched module shows no meter
- **WHEN** no lesson in a module is complete
- **THEN** the card renders no meter and the panel reads exactly as it does today

#### Scenario: A finished module says so
- **WHEN** every lesson in a module is complete
- **THEN** the card shows a full bar and a localized completed state

#### Scenario: The card keeps one control
- **WHEN** a card carrying a meter is reached by keyboard
- **THEN** the heading link and the call to action remain its only tab stops; the meter is not focusable

#### Scenario: The course overview stays server-rendered
- **WHEN** the course overview is rendered
- **THEN** only the meter is client-rendered; the header, cards, count lines and galleries are produced on the server as before

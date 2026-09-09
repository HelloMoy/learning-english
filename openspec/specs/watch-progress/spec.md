# Capability: watch-progress

## Purpose

The `watch-progress` capability answers "how far did I get?" on the surfaces where a
learner scans for their place: the module overview's video rows, the course overview's
module cards, and the lesson view's outline. It covers the pure rules that derive a
watched fraction and a finish threshold from data the `playback-position` and
`lesson-progress` capabilities already persist, the client composition root that reads
every saved position in one pass, the rule that finishing a video marks the lesson
complete, and the two indicators — the per-video bar and the per-module meter —
including what they render before hydration, which is nothing.

Nothing here is stored. Watched fraction and finished-watching are *derived*, so a
position saved before this capability existed lights up its indicators with no
migration, and the only write it adds is the completion key the existing
`ProgressTracker` already owns.

Progress is per-device in v1 (`localStorage`), not per-user: there is no auth yet, so
nothing syncs across devices.

The ubiquitous language is `GLOSSARY.md`.

## Requirements

### Requirement: Watched fraction and finished-watching are pure, derived rules

The project SHALL expose two pure predicates over a lesson's saved playback position
and its duration, in one module, with no React, storage or component imports, so every
surface computes progress the same way and each rule is testable on its own.

- `watchedFraction({ positionSeconds, durationSeconds })` SHALL return a number in
  `[0, 1]`: the position divided by the duration, clamped at both ends. It SHALL
  return `0` when the position is `null`, when either value is not a finite number,
  and when the duration is zero or negative — a reading lesson carries no duration and
  therefore has no watched fraction.
- `hasFinishedWatching({ positionSeconds, durationSeconds })` SHALL return `true` when
  the position has reached the **finish threshold**, defined as the earlier of
  `durationSeconds - 15` and `durationSeconds * 0.95`. When that expression is zero or
  negative — a clip shorter than 15 seconds — the threshold SHALL be
  `durationSeconds * 0.95`, so a finish is always reachable. It SHALL return `false`
  for a `null` position, a non-finite value, and a duration of zero or less.

Neither predicate SHALL read storage, and neither SHALL be duplicated at a call site.

#### Scenario: A partially watched video reports its fraction
- **WHEN** `watchedFraction` is called with a position of 240 seconds and a duration of 600
- **THEN** it returns `0.4`

#### Scenario: The fraction is clamped
- **WHEN** `watchedFraction` is called with a position past the duration, or with a negative position
- **THEN** it returns `1` and `0` respectively, never a value outside `[0, 1]`

#### Scenario: A lesson with no duration has no fraction
- **WHEN** `watchedFraction` is called with a duration of `0` — a reading lesson — or with a `null` position
- **THEN** it returns `0` rather than `NaN` or `Infinity`

#### Scenario: Reaching the last stretch counts as finished
- **WHEN** `hasFinishedWatching` is called for a 600-second lesson with a position of 570 seconds
- **THEN** it returns `true`, because 570 is the earlier of `600 - 15` and `600 × 0.95`

#### Scenario: Stopping before the threshold is not finished
- **WHEN** `hasFinishedWatching` is called for a 600-second lesson with a position of 569 seconds
- **THEN** it returns `false`

#### Scenario: A very short clip can still be finished
- **WHEN** `hasFinishedWatching` is called for a 10-second lesson with a position of 10 seconds
- **THEN** it returns `true`, because the threshold falls back to `duration × 0.95` rather than a negative value

#### Scenario: Missing data is never a finish
- **WHEN** `hasFinishedWatching` is called with a `null` position, a `NaN` position, or a duration of `0`
- **THEN** it returns `false`

### Requirement: A client composition root exposes every saved playback position as one snapshot

The browser SHALL read all saved playback positions through a single client-side
composition root — the only module besides the existing per-lesson playback hook
permitted to name the concrete browser adapter — mirroring the role the completion
composition root plays for `lesson-progress`.

The root SHALL expose a **synchronous, subscribable snapshot** keyed by lesson id, so
a list of rows can render every lesson's progress in one pass rather than awaiting one
promise per row. Components SHALL NOT read `window.localStorage` directly.

The snapshot SHALL be shared across every subscriber and SHALL be stable by identity
between reads, so a consumer may return it from `useSyncExternalStore` without
looping. Writing a position through the player's write path SHALL notify subscribers,
and a position written by another tab SHALL be picked up through the `storage` event.

Reading positions SHALL tolerate blocked or unavailable storage by yielding an empty
snapshot rather than throwing.

#### Scenario: A list reads every position without a promise per row
- **WHEN** a view renders 31 lesson rows that each need a watched fraction
- **THEN** it obtains all positions from one snapshot read, and issues no per-row asynchronous storage call

#### Scenario: Components never touch storage directly
- **WHEN** any component needs a lesson's playback position
- **THEN** it obtains it through the composition root; it never reads `window.localStorage` or any browser storage API directly

#### Scenario: Surfaces agree with one another
- **WHEN** a position is written while more than one surface showing progress is mounted
- **THEN** every mounted surface reflects the new value without a reload

#### Scenario: Blocked storage yields an empty snapshot
- **WHEN** `window` is undefined, or `localStorage` access throws
- **THEN** the snapshot is empty and no exception escapes to the caller

### Requirement: Finishing a video marks the lesson complete

When playback crosses the finish threshold, the player SHALL mark the lesson complete
through the same `ProgressTracker` write path the manual **Mark as complete** button
uses, so the learner sees one notion of "done" rather than two. The mark SHALL be
written at most once per player mount, and the manual button SHALL continue to work
unchanged for lessons the learner does not watch to the end.

Auto-completion SHALL only occur in response to actual playback. Loading a lesson
whose stored position is already past the threshold SHALL NOT, by itself, write a
completion.

Completion SHALL NOT be reversible by playback: seeking backwards, rewatching, or a
position later written below the threshold SHALL NOT clear a recorded completion.

#### Scenario: Watching to the end completes the lesson
- **WHEN** the learner plays a 600-second lesson and playback reaches 570 seconds
- **THEN** the lesson is marked complete through the progress tracker, and every mounted completion indicator for it shows the completed state

#### Scenario: The video ending completes the lesson
- **WHEN** the player emits `ended`
- **THEN** the lesson is marked complete

#### Scenario: Stopping short does not complete
- **WHEN** the learner plays a 600-second lesson, stops at 300 seconds and leaves the page
- **THEN** no completion is recorded for that lesson

#### Scenario: The mark is written once per mount
- **WHEN** playback crosses the threshold and then continues to fire time updates past it
- **THEN** the progress tracker is written to once, not once per event

#### Scenario: Merely loading a finished lesson writes nothing
- **WHEN** a lesson whose stored position is past the finish threshold is opened and playback has not begun
- **THEN** no completion write is issued

#### Scenario: Rewatching does not un-complete
- **WHEN** a completed lesson is replayed from the beginning and its stored position drops to 5 seconds
- **THEN** the lesson is still reported complete

### Requirement: A lesson counts as complete when it was marked or watched to the end

Every surface that shows whether a lesson is done SHALL treat it as complete when the
progress tracker reports it complete **or** when `hasFinishedWatching` holds for its
stored position and duration. A position recorded before this rule existed therefore
reads as complete without any migration or backfill write.

The two inputs SHALL be combined in one shared place rather than re-derived per
component, so no surface can disagree with another.

#### Scenario: A manually marked lesson is complete
- **WHEN** the progress tracker reports a lesson complete and it has no stored position
- **THEN** the lesson is shown as complete

#### Scenario: A lesson watched to the end before the rule existed is complete
- **WHEN** a lesson has a stored position past its finish threshold and was never marked through the button
- **THEN** the lesson is shown as complete, with no write issued to make it so

#### Scenario: A lesson with no duration falls back to the mark alone
- **WHEN** a reading lesson carries no duration
- **THEN** its completion is whatever the progress tracker reports, and the watched rule never makes it complete

### Requirement: A video's watch progress is shown as a bar with a percentage

A surface listing videos SHALL be able to render, per lesson, a progress indicator
showing the watched fraction: a bar filled to that fraction, accompanied by a
localized percentage label. The bar SHALL expose `role="progressbar"` with its current
value, its bounds, and a localized accessible name stating the percentage watched, so
the meaning never rests on the fill alone.

The indicator SHALL render **nothing** when the watched fraction is zero and the
lesson is not complete. As with the completion mark, progress lives in the browser and
can only appear after hydration; a bar drawn at zero in the pre-hydration frame would
assert that the learner has watched nothing, which may be false.

A complete lesson SHALL render the bar full, whatever its stored position, so
"finished" and "nearly finished" are not shown identically.

#### Scenario: A partially watched video shows a partial bar
- **WHEN** a lesson has a stored position of 240 seconds against a 600-second duration
- **THEN** its row renders a progress bar filled to 40% with a localized "40%" label, and `aria-valuenow` reporting 40

#### Scenario: An untouched video shows no bar
- **WHEN** a lesson has no stored position and is not complete
- **THEN** its row renders no progress indicator at all — not an empty bar

#### Scenario: A complete video shows a full bar
- **WHEN** a lesson is complete
- **THEN** its row renders the bar full, regardless of the exact stored position

#### Scenario: The indicator is announced, not merely drawn
- **WHEN** a screen reader reaches a row carrying progress
- **THEN** the percentage watched is announced through a localized accessible name, and the state does not depend on colour or fill alone

#### Scenario: Server and first client render agree
- **WHEN** a page carrying progress indicators is server-rendered and hydrated
- **THEN** no hydration mismatch is produced, because both render the same absence of indicators

### Requirement: A module's progress is shown as completed lessons out of its total

A surface listing modules SHALL be able to render, per module, a progress meter
counting the module's complete lessons against its total lesson count: a bar filled to
that ratio and a localized label stating both numbers (for example, "7 / 17 videos").
The meter SHALL expose `role="progressbar"` with its bounds, its current value, and a
localized accessible name carrying the same counts.

Completion SHALL be counted with the shared rule — marked complete **or** watched to
the end — so a module's meter and its lessons' rows can never disagree.

The meter SHALL render **nothing** when no lesson in the module is complete, for the
same pre-hydration reason as the per-video bar. When every lesson in the module is
complete, the meter SHALL additionally state that the module is finished, so "all
done" is not left to be inferred from two equal numbers.

A module holding no lessons SHALL render no meter rather than a division by zero.

#### Scenario: A partially watched module shows its count
- **WHEN** 7 of a module's 17 lessons are complete
- **THEN** the card renders a bar filled to 7/17 with a localized "7 / 17 videos" label, and `aria-valuenow` reporting 7 against a maximum of 17

#### Scenario: An untouched module shows no meter
- **WHEN** no lesson in the module is complete
- **THEN** the card renders no meter at all

#### Scenario: A finished module says so
- **WHEN** every lesson in a module is complete
- **THEN** the card renders a full bar and a localized completed state, not merely "17 / 17"

#### Scenario: An empty module renders no meter
- **WHEN** a module holds no lessons
- **THEN** the card renders no meter, and no `NaN` or `Infinity` reaches the DOM

#### Scenario: The meter agrees with the rows
- **WHEN** a learner finishes a video and returns to the course overview
- **THEN** that module's meter counts the lesson its row shows as complete

### Requirement: Progress state stays per device and adds no persisted field

Watch progress SHALL be derived entirely from data the `playback-position` and
`lesson-progress` capabilities already persist. This change SHALL NOT introduce a new
storage key, a new persisted field, or a migration; the only write it adds is the
completion key the existing `ProgressTracker` already owns.

Progress SHALL remain per-device, per browser profile, as position and completion
already are.

#### Scenario: No new storage key appears
- **WHEN** a learner watches a lesson to the end
- **THEN** the only keys written are the existing playback-position key and the existing completion key for that lesson

#### Scenario: Progress does not cross devices
- **WHEN** a learner watches lessons in one browser and opens the course in another
- **THEN** the second browser shows no progress, consistent with completion and position today

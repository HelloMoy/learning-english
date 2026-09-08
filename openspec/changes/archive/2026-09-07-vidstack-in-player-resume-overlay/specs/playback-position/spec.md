## MODIFIED Requirements

### Requirement: The Lesson Page persists playback position on a debounced cadence and on lifecycle events

The component responsible for wrapping the player SHALL persist the playback position
to the adapter under the following rules:

- It SHALL subscribe to the player's `time-update` event and debounce writes by no
  less than 1000ms and no more than 2000ms.
- It SHALL write immediately (bypassing the debounce) on the player's `pause`,
  `seeking`, and `ended` events.
- It SHALL flush any pending debounced write when the wrapping component unmounts
  (e.g. on route change).
- It SHALL write on the `beforeunload` window event with the latest known position.
- It SHALL NOT persist a position before the first user interaction with the player
  (avoids overwriting a stored value with `0` on cold load).
- The seek the player performs on the learner's behalf when answering the resume
  overlay SHALL NOT, by itself, be treated as a position to persist at a value other
  than the one the learner chose.

#### Scenario: First user interaction is required before the first write
- **WHEN** the page loads and the player is mounted with a saved position in storage
  but no user interaction has occurred
- **THEN** the adapter's `setPosition` is NOT called (no overwrite with `0`)

#### Scenario: Debounced `time-update` writes at most every 1500ms
- **WHEN** the player's `time-update` fires repeatedly over a 5-second interval
- **THEN** `setPosition` is called at most three times across the interval (one per
  debounced window)

#### Scenario: `pause` triggers an immediate write
- **WHEN** the learner pauses the video at `seconds = 45`
- **THEN** `setPosition(lessonId, 45)` is called without waiting for the next debounce
  window

#### Scenario: Unmount flushes any pending debounced write
- **WHEN** the wrapping component unmounts with a pending debounced call scheduled to
  fire in less than the debounce window
- **THEN** the pending call is invoked on unmount so no more than the configured
  debounce window of position is lost on graceful close

### Requirement: The Lesson Page offers to resume from the saved position when within sensible bounds

The Lesson Page SHALL decide whether to offer a resume choice based on the lesson's
`durationSeconds` and the position stored for the current lesson. The decision SHALL
follow the following rules:

- If the stored position is `null`, the player SHALL start at `0` and no resume
  surface SHALL be shown.
- If the stored position is less than `30` seconds, the player SHALL start at `0` and
  no resume surface SHALL be shown (the learner effectively hasn't watched anything).
- If the stored position is greater than or equal to `durationSeconds - 10` (i.e.
  within the last 10 seconds of the lesson), the player SHALL start at `0` and no
  resume surface SHALL be shown (the learner effectively finished).
- Otherwise, the resume surface SHALL be offered, with two actions: a primary "Resume
  from `MM:SS`" action that sets `currentTime` to the stored position, and a secondary
  "Restart from beginning" action that sets `currentTime` to `0`.

The resume surface SHALL be an **overlay rendered inside the player's own subtree**,
positioned over the video frame and bounded by it. It SHALL NOT be a modal dialog: it
SHALL NOT render a full-viewport backdrop, SHALL NOT mark the rest of the page
`aria-hidden`, and SHALL NOT be opened through `NiceModal.show(...)`. It SHALL be
labelled as a dialog for assistive technology (`role="dialog"` with an accessible name
and description) and SHALL move keyboard focus to its primary action when it appears,
so a keyboard or screen-reader user reaches the choice without hunting for it.

The overlay SHALL be shown only in response to the learner's **first play request**,
never on mount. On that first play request the player SHALL be paused, the overlay
SHALL appear, and playback SHALL wait for the learner's answer.

The threshold decision SHALL be made by a pure, separately testable predicate so the
player can gate on it without importing overlay or component code.

#### Scenario: No stored position skips the overlay
- **WHEN** `getPosition(lessonId)` returns `null` and the learner presses play
- **THEN** the video plays from `0` and no overlay appears

#### Scenario: A trivial saved position skips the overlay
- **WHEN** `getPosition(lessonId)` returns `5` seconds, the lesson is 600 seconds
  long, and the learner presses play
- **THEN** the video plays from `0` and no overlay appears

#### Scenario: A position near completion skips the overlay
- **WHEN** `getPosition(lessonId)` returns `595` seconds, the lesson is 600 seconds
  long, and the learner presses play
- **THEN** the video plays from `0` and no overlay appears

#### Scenario: Landing on the lesson shows nothing until play
- **WHEN** `getPosition(lessonId)` returns `180` seconds for a 600-second lesson and
  the page finishes loading
- **THEN** no resume surface is present anywhere in the document, and the rest of the
  page is fully interactive

#### Scenario: The first play opens the overlay inside the player
- **WHEN** the learner presses play on a lesson whose stored position is `180` seconds
  and whose duration is 600 seconds
- **THEN** playback pauses, an overlay appears **within the player's bounds** showing
  "Resume from 03:00" and a "Restart from beginning" alternative, the page behind the
  player is not covered by any backdrop, and focus is on the "Resume" action

#### Scenario: Resume seeks and plays
- **WHEN** the overlay is open for a stored position of `180` seconds and the learner
  activates "Resume"
- **THEN** the overlay disappears, `currentTime` is `180`, and the video is playing

#### Scenario: Restart plays from the top
- **WHEN** the overlay is open and the learner activates "Restart from beginning"
- **THEN** the overlay disappears, `currentTime` is `0`, and the video is playing

#### Scenario: The overlay is offered at most once per mount
- **WHEN** the learner answers or dismisses the overlay and then pauses and plays the
  video again
- **THEN** the overlay does not reappear for the remainder of the page visit, and the
  second play starts immediately

### Requirement: Dismissing the resume dialog restarts from the beginning

Closing the resume overlay without choosing an action SHALL be treated as "Restart
from beginning". Dismissal means `Escape` or the close control. The video's
`currentTime` SHALL be `0` and playback SHALL begin, because the learner's dismissed
request was a request to play. Playback SHALL NOT jump to the stored position.

The dismissal SHALL NOT erase the stored position as an act of its own. The ordinary
write cadence then applies, and since playback proceeds from `0`, the stored position
IS expected to be replaced within one write window. That is not data loss: the learner
is now watching from the top, and `0` is where they are. Preserving the old position
through a dismissal would mean offering, on the next visit, to resume from a point the
learner has just declined.

The overlay SHALL be shown at most once per player mount. A dismissed overlay SHALL NOT
reappear while the learner stays on the lesson.

#### Scenario: Escape restarts and plays
- **WHEN** the overlay is open for a stored position of `180` seconds and the learner
  presses `Escape`
- **THEN** the overlay disappears, the video's `currentTime` is `0`, and the video is
  playing

#### Scenario: The close control restarts and plays
- **WHEN** the overlay is open and the learner activates its close control
- **THEN** the overlay disappears, the video's `currentTime` is `0`, and the video is
  playing

#### Scenario: Dismissing does not itself clear the stored position
- **WHEN** the learner dismisses the overlay
- **THEN** no delete or reset is issued against the stored position; the next value
  written for that lesson comes from the ordinary write cadence and reflects where
  playback has actually reached

#### Scenario: A dismissed overlay does not reopen
- **WHEN** the learner dismisses the resume overlay and then pauses and plays the video
- **THEN** the resume overlay does not appear again for the remainder of the page visit

## MODIFIED Requirements

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

The overlay SHALL be shown only in response to the learner's **first play**, never on
mount. The player SHALL be held at the moment the provider reports that **playback has
begun** — the `playing` event — and SHALL NOT be held at the moment the play request is
issued. On that hold the overlay SHALL appear and playback SHALL wait for the learner's
answer.

The offer SHALL NOT pause a provider whose initial play request is still in flight. A
provider driving a third-party embed can swallow such a pause and stall permanently —
never emitting `pause`, never reaching `playing`, and ignoring every later seek and play
request — which leaves the learner on a dead player that only a page reload clears. This
holds for every provider the player can drive, so the player SHALL apply one rule to all
of them and SHALL NOT branch on which provider is in use.

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

#### Scenario: The play request alone does not hold the player
- **WHEN** the player emits `play` for a lesson whose stored position is `180` seconds
  and whose duration is 600 seconds, and playback has not yet begun
- **THEN** the player is not paused and no overlay appears

#### Scenario: The first playback start opens the overlay inside the player
- **WHEN** the player emits `playing` on a lesson whose stored position is `180` seconds
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

#### Scenario: A YouTube lesson resumes and keeps playing
- **WHEN** the learner has a stored position mid-way through a lesson whose source is a
  YouTube link, presses play, and activates "Resume"
- **THEN** the player reports playing rather than buffering, and playback advances past
  the stored position

#### Scenario: The overlay is offered at most once per mount
- **WHEN** the learner answers or dismisses the overlay and then pauses and plays the
  video again
- **THEN** the overlay does not reappear for the remainder of the page visit, and the
  second play starts immediately

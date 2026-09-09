## MODIFIED Requirements

### Requirement: The Player enlarges to fill the viewport without the Fullscreen API

The Player SHALL offer a control that enlarges the video to fill the viewport, and that
control SHALL be present and operable on every browser the application serves —
including Safari on iPhone, where no element Fullscreen API exists and where a
YouTube-sourced Lesson has no `<video>` element to hand to the platform's own
fullscreen entry point.

**Where the platform can do it, the platform does it.** Whenever the browser reports
that it can take the Player fullscreen, the Player SHALL use the browser's own
fullscreen — the same control, the same behavior the page had before this requirement
existed. The application's own mode is a **fallback**, offered only where that report is
negative, and the two SHALL NOT both be offered at once.

The condition SHALL be the browser's reported **capability**, not the operating system,
the user agent, or the device. Those are proxies that are wrong in both directions: a
self-hosted `<video>` Lesson on an iPhone *can* go fullscreen through the platform's own
entry point and SHALL be allowed to, while any future engine that drops element
fullscreen SHALL get the fallback without a new release.

Where the fallback is used, the mode SHALL be provided by the application rather than
delegated to the browser: while it is active the Player element SHALL be pinned to the
viewport, above the rest of the page, and the video SHALL be fitted within it without
cropping.

The Player's identity SHALL be preserved across the transition. The same element and
the same subtree SHALL be used in both modes, so that entering or leaving the mode
SHALL NOT interrupt playback, SHALL NOT reload the provider, and SHALL NOT disturb the
in-player resume overlay or the playback-position writes specified by the
`playback-position` capability.

The control SHALL be labelled from `next-intl` for every locale in
`src/i18n/routing.ts`, SHALL expose whether the mode is active, and SHALL be reachable
by keyboard with a visible focus ring. A learner SHALL be able to leave the mode by
that same control and by pressing `Escape`, so the mode is never a trap.

**The page behind the mode SHALL remain scrollable.** The mode SHALL NOT lock, clip, or
otherwise suppress the document's scrolling while it is active. On iPhone Safari the
browser's toolbar hides only in response to a real scroll gesture on the document, and
after a rotation that toolbar is back on screen; a swipe over the pinned Player is
therefore the only way the video can reach the whole screen, and it works only while the
document underneath can still scroll. Nothing of that scrolling SHALL be visible: the
backdrop covers the page. The scroll position the page had when the mode was entered
SHALL be restored when the mode is left, so a gesture made to hide the toolbar does not
leave the Player scrolled out of view once the learner is back in the page.

**The mode SHALL tell a touch learner how to reclaim the screen.** While the mode is
active on a touch device in landscape orientation and the viewport is shorter than the
screen's short side — the browser's chrome is still on screen — the Player SHALL show a
hint, drawn over the video, telling the learner to swipe up. The hint SHALL disappear on
its own as soon as the viewport reaches the screen's short side, SHALL be dismissible by
the learner for the rest of that enlarged session, SHALL NOT intercept the gesture it
asks for, and SHALL be localized from `next-intl` for every locale. It SHALL NOT be shown
in portrait, on a device without touch, or while the video is in the page.

The library's own fullscreen button SHALL NOT be relied upon as the *only* affordance,
because it hides itself wherever the Fullscreen API reports no support — which is
precisely the case this requirement exists to serve. Where it does report support, that
button remains the affordance and the fallback SHALL NOT render.

#### Scenario: The enlarge control is present on iPhone Safari
- **WHEN** a YouTube-sourced lesson is opened in Safari on an iPhone, where
  `document.fullscreenEnabled` is unavailable
- **THEN** the Player still shows an operable control for enlarging the video

#### Scenario: A browser that supports fullscreen keeps its own
- **WHEN** a lesson is opened in a browser that reports it can take the Player fullscreen
- **THEN** the Player offers the browser's own fullscreen control, exactly as before this
  requirement existed, and the application's fallback control is not rendered at all

#### Scenario: Only one enlarge affordance is ever offered
- **WHEN** a lesson renders in any supported browser
- **THEN** the Player's chrome carries exactly one control for enlarging the video

#### Scenario: Enlarging pins the player to the viewport
- **WHEN** the learner activates the enlarge control
- **THEN** the Player fills the viewport, is painted above the rest of the page, and the
  video is fitted inside it without cropping

#### Scenario: The page behind the mode stays scrollable
- **WHEN** the mode is active
- **THEN** the document's scrolling is not suppressed — `body` carries no `overflow`
  lock — and the page behind the backdrop can still be scrolled by a gesture

#### Scenario: Leaving the mode puts the page back where it was
- **WHEN** the learner enters the mode, the page is scrolled while it is active, and the
  learner leaves the mode
- **THEN** the page is scrolled back to the position it had when the mode was entered

#### Scenario: A swipe over the pinned player reaches the whole screen on iPhone
- **WHEN** the mode is active in Safari on an iPhone held in landscape with the browser's
  toolbar on screen — whether the learner enlarged before or after rotating — and the
  learner swipes up over the video
- **THEN** Safari hides its toolbar and the Player fills the whole screen

#### Scenario: Enlarging does not interrupt playback
- **WHEN** the learner activates the enlarge control while the video is playing and
  then leaves the mode
- **THEN** playback continued across both transitions, the provider was not reloaded,
  and the stored playback position was not disturbed

#### Scenario: Escape leaves the mode
- **WHEN** the mode is active and the learner presses `Escape`
- **THEN** the Player returns to its 16:9 box in the page

#### Scenario: The enlarge control is localized and announces its state
- **WHEN** the Lesson Page renders under the `es` locale
- **THEN** the control's accessible name comes from `src/messages/es.json`, and it
  exposes whether the enlarged mode is currently active

#### Scenario: The swipe-up hint appears while the browser chrome takes part of the screen
- **WHEN** the mode is active on a touch device in landscape and the viewport is shorter
  than the screen's short side
- **THEN** a hint telling the learner to swipe up is shown over the video, localized for
  the active locale

#### Scenario: The swipe-up hint leaves once the viewport reaches the full height
- **WHEN** the hint is shown and the viewport grows to the screen's short side
- **THEN** the hint is no longer shown, without any action from the learner

#### Scenario: The swipe-up hint can be dismissed
- **WHEN** the hint is shown and the learner activates its dismiss control
- **THEN** the hint is no longer shown for the rest of that enlarged session

#### Scenario: The swipe-up hint is not shown where it makes no sense
- **WHEN** the video is in the page, or the device has no touch input, or the device is in
  portrait orientation
- **THEN** no swipe-up hint is rendered

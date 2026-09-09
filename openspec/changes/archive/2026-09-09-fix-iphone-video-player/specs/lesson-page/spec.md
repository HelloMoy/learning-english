## MODIFIED Requirements

### Requirement: The Player is the native HTML5 `<video controls>` element

The Player SHALL be a Vidstack `<MediaPlayer>` containing a `<MediaProvider>` and
Vidstack's Default Video Layout chrome. The player's `poster` SHALL be set when the
Lesson has a `poster`. The Default Layout SHALL provide, at minimum, play/pause, a
seekable time slider, elapsed and total time, volume, and playback rate. Enlarging the
video to fill the viewport is specified separately, by the viewport-filling mode
requirement below, because the browser's Fullscreen API is not available on every
device the Player must serve.

The player's `src` SHALL be **derived** from the Lesson `source`, not passed through
verbatim, because a Lesson's video MAY be hosted by the project or by YouTube:

- When `source` is a YouTube link, the player SHALL load it through Vidstack's
  **YouTube provider**, whose `src` form is `youtube/<videoId>`. The recognized link
  forms are `youtube.com/embed/<id>`, `youtube.com/watch?v=<id>`, and `youtu.be/<id>`,
  with or without a `www.` or `m.` subdomain, on either `youtube.com` or
  `youtube-nocookie.com`, and with any additional query parameters present (`si`,
  `list`, `t`, …). Extra parameters SHALL be discarded — the provider owns the embed
  URL it builds.
- For every other `source`, the player SHALL load it as a direct video source, exactly
  as before.

Recognition SHALL be performed by a pure function that takes the `source` string and
returns the video id or nothing. It SHALL live outside `src/domain/**`: which provider
serves a URL is a delivery concern, and the domain models `source` as an opaque URL.

Every guarantee in this requirement SHALL hold identically for both kinds of source.
In particular, a YouTube-sourced Lesson SHALL present the same Default Layout chrome,
the same localized control names, the same app-themed treatment, the same 16:9 frame,
and the same overlay slot as a project-hosted one. The Player SHALL NOT branch into a
second player implementation for YouTube.

The **starting position** of a YouTube-sourced Lesson SHALL be applied by the seek
mechanism specified by the `playback-position` capability, and SHALL NOT be encoded as
a parameter of an embed URL. A URL parameter can only tell the video where to begin; it
cannot report where the learner stopped, and the position must remain writable.

Every string the Default Layout renders — control labels, tooltips, and menu entries —
SHALL be supplied through `next-intl` for every locale in `src/i18n/routing.ts`; the
library's built-in English defaults SHALL NOT be relied upon as the visible copy for
non-`en` locales.

The Player MAY render additional elements inside its own subtree, positioned over the
video frame, provided they do not obstruct the layout's controls while those controls
are visible. The in-player resume overlay specified by the `playback-position`
capability is such an element.

The Player SHALL keep the video frame at a 16:9 box that fills the width of the center
column, and SHALL present its full (non-compact) chrome at that size on desktop
viewports.

That 16:9 box SHALL bound the height the Player contributes to the page **on every
engine**, including when the provider renders the video inside an `<iframe>` that the
library deliberately sizes far larger than the visible frame in order to hide the
embed's own chrome. An oversized embed element SHALL NOT be laid out in flow, because
an in-flow element that overflows its clipping ancestor still grows the boxes above it
on WebKit for iOS: the ancestor's `overflow: hidden` there clips the painting but not
the layout. The measurable guarantee is that the element wrapping the Player SHALL NOT
be taller than the Player's own 16:9 box plus its own borders, so the lesson title,
the notes, and the Mark as complete action SHALL sit directly beneath the video rather
than beyond a slab of empty space.

The Player's chrome SHALL follow the application's own resolved theme rather than the
operating system's color-scheme preference, so it never renders light chrome inside a
dark page.

#### Scenario: The Player renders with the lesson's source
- **WHEN** the resolved view's lesson has `source: "/videos/long-vs-short.mp4"`
- **THEN** the rendered player loads that source as a direct video source and presents
  Vidstack's Default Layout controls

#### Scenario: A YouTube embed link selects the YouTube provider
- **WHEN** the resolved view's lesson has
  `source: "https://www.youtube.com/embed/yY7RWGUbqng?si=nB8sjE4SQJoB0Itv"`
- **THEN** the player's `src` is `youtube/yY7RWGUbqng` — the `si` parameter is
  discarded and no MP4 source type is declared

#### Scenario: A YouTube watch link selects the YouTube provider
- **WHEN** the resolved view's lesson has
  `source: "https://www.youtube.com/watch?v=yY7RWGUbqng&list=PLabc"`
- **THEN** the player's `src` is `youtube/yY7RWGUbqng`

#### Scenario: A youtu.be short link selects the YouTube provider
- **WHEN** the resolved view's lesson has `source: "https://youtu.be/yY7RWGUbqng?t=42"`
- **THEN** the player's `src` is `youtube/yY7RWGUbqng`

#### Scenario: A non-YouTube URL that merely mentions YouTube is not treated as one
- **WHEN** the resolved view's lesson has
  `source: "https://cdn.example.com/youtube.com/watch?v=notreal.mp4"`
- **THEN** the player loads it as a direct video source — the host, not the path, is
  what selects the provider

#### Scenario: A YouTube lecture keeps the resume overlay and the position writes
- **WHEN** a learner presses play on a YouTube-sourced lesson that has a resumable
  stored position, resumes, and then pauses part-way through
- **THEN** the in-player resume overlay was offered exactly as it is for an MP4 lesson,
  the seek moved playback to the stored position, and the new position was written on
  `pause` — the lesson does not become read-only for playback position

#### Scenario: The Player shows the poster when present
- **WHEN** the resolved view's lesson has `poster: "/thumbnails/long-vs-short.jpg"`
- **THEN** the player paints that image over the video frame before playback begins,
  rather than an empty black frame

#### Scenario: A YouTube lecture without a `poster` still shows a thumbnail
- **WHEN** the resolved view's lesson is YouTube-sourced and has no `poster`
- **THEN** the idle frame shows the provider's own thumbnail rather than an empty black
  frame, and no `Poster` element is rendered from the lesson's absent `poster`

#### Scenario: The oversized embed frame is not laid out in flow
- **WHEN** a YouTube-sourced lesson renders and the provider's `<iframe>` is sized far
  taller than the visible 16:9 frame so that the embed's own chrome falls outside it
- **THEN** that `<iframe>` is taken out of the layout flow, so no ancestor's height is
  computed from its overflow

#### Scenario: The player leaves no empty space above the lesson body on iOS Safari
- **WHEN** a YouTube-sourced lesson is opened in Safari on an iPhone
- **THEN** the element wrapping the Player is no taller than the Player's 16:9 box plus
  its own borders, and the lesson title follows immediately beneath the video instead of
  beyond a black slab the learner has to scroll through

#### Scenario: The Player's chrome matches the app's theme
- **WHEN** the application's resolved theme is dark
- **THEN** the player's controls render in their dark treatment, regardless of the
  operating system's color-scheme preference

#### Scenario: The Player's controls are localized
- **WHEN** the Lesson Page renders under the `es` locale
- **THEN** the Default Layout's controls expose their accessible names in Spanish,
  sourced from `src/messages/es.json`, not from the library's English defaults

#### Scenario: A YouTube lecture's controls are the app's, localized the same way
- **WHEN** a YouTube-sourced lesson renders under the `es` locale
- **THEN** the visible chrome is Vidstack's Default Layout with Spanish control names
  from `src/messages/es.json` — not YouTube's own player chrome

#### Scenario: The Player has no custom Mark as complete affordance
- **WHEN** the Player is rendered
- **THEN** there is no Mark as complete button inside the Player chrome; the Mark as
  complete affordance lives in the page footer, next to the Player

## ADDED Requirements

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
that same control and by pressing `Escape`, so the mode is never a trap. While the mode
is active, the page behind it SHALL NOT scroll.

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
- **THEN** the Player fills the viewport, is painted above the rest of the page, the
  page behind it does not scroll, and the video is fitted inside it without cropping

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

## ADDED Requirements

### Requirement: The buffering indicator hides the embed's own spinner

The Player SHALL draw a single buffering indicator at the centre of the video frame while
it is waiting for media — before it can play, and whenever playback stalls for more data.
A YouTube-sourced lesson's embed paints its own 36 by 36 CSS pixel spinner on the
same spot in exactly those moments, because the Player's waiting state is derived from the
embed's own Buffering state, so the indicator SHALL carry a **fully opaque core** at least
44 by 44 CSS pixels wide, centred on the frame, that hides the embed's spinner. The ring
the Default Layout draws SHALL stay, in the brand colour, around that core.

The core SHALL be visible only while the Player is buffering. Over a video that is playing
or paused without waiting, nothing of the indicator SHALL be seen, so an uninterrupted
lesson has nothing drawn over it.

The indicator SHALL be the same for every source, so a self-hosted and a YouTube-sourced
lesson show the same loading treatment.

#### Scenario: One spinner while a YouTube lecture buffers
- **WHEN** a YouTube-sourced lesson is loading or stalls, and the embed paints its own
  spinner at the centre
- **THEN** the Player's indicator is drawn over it with an opaque core at least 44 CSS
  pixels wide, so the embed's spinner is not visible and one indicator is seen

#### Scenario: Nothing is drawn over a rolling video
- **WHEN** the lesson is playing and not waiting for data
- **THEN** neither the ring nor the core of the indicator is visible

#### Scenario: A self-hosted lecture shows the same indicator
- **WHEN** a project-hosted lesson buffers
- **THEN** the same ring and opaque core are drawn at the centre of the frame

## MODIFIED Requirements

### Requirement: The Player is the native HTML5 `<video controls>` element

The Player SHALL be a Vidstack `<MediaPlayer>` containing a `<MediaProvider>` and
Vidstack's Default Video Layout chrome. The player's `poster` SHALL be set when the
Lesson has a `poster`, and the Player SHALL render Vidstack's `Poster` element for
**every** lesson, whatever its source and whether or not it declares a `poster`: the
element paints the lesson's own `poster` where there is one, otherwise the thumbnail the
provider discovers for the video, and hides itself when it has neither. It SHALL stay
painted over the video frame until frames actually roll, so a YouTube-sourced lesson
never shows the embed's own cued chrome — its red play button over its thumbnail — before
the first play. The Default Layout SHALL provide, at minimum, play/pause, a
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
- **THEN** the Player's `Poster` element is rendered and paints the provider's discovered
  thumbnail over the embed frame before playback begins, so the idle frame shows that
  thumbnail and none of the embed's own cued chrome

#### Scenario: The poster leaves when frames roll
- **WHEN** the learner starts playback of a YouTube-sourced lesson
- **THEN** the Poster element stays painted while the embed loads and buffers, and is gone
  once the video is playing

#### Scenario: A self-hosted lecture without a `poster` paints nothing extra
- **WHEN** the resolved view's lesson is a project-hosted video with no `poster`
- **THEN** the Poster element renders but hides itself, having nothing to paint, and the
  idle frame is exactly as it was

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

### Requirement: The Player draws a centre play/pause control on touch

Whenever the Player's control bar is visible on a **coarse pointer**, the Player SHALL
draw a **play/pause control at the centre of the video frame**, over the video, in the
Player's compact and full chrome alike and both while the video is in the page and while
it fills the viewport. Activating it SHALL toggle playback.

The control exists because the tap no longer toggles playback on touch, and because a
YouTube-sourced Lesson on a phone paints the embed's own centre play/pause icon through
the Player's chrome. It SHALL be placed over the region where that icon is drawn, so a
learner reaching for the icon lands on a control that acts. The Player's full chrome
draws no centre control of its own, which is why the one place the leaked icon used to
be alone — the video filling the viewport in landscape — is covered by this requirement.

Exactly one centre play/pause control SHALL ever be on screen: where the Player's own
layout already draws one, as its compact chrome does, the Player SHALL NOT draw a second.

The control SHALL take the pointer, and a tap on it SHALL NOT also toggle the control
bar. It SHALL leave with the control bar, so a learner watching an uninterrupted lesson
sees nothing drawn over the video. It SHALL NOT be drawn on a fine pointer, where a
click on the frame already toggles playback.

Its hit area SHALL be at least 44 by 44 CSS pixels. Its accessible name SHALL name the
action it performs — play while paused, pause while playing — and SHALL come from
`next-intl` for every supported locale.

**Whichever centre control is on screen SHALL hide the embed's icon, not merely sit on
it.** The embed paints its centre play/pause icon in a 56 by 56 CSS pixel box on the
frame's centre, and a smaller or translucent control lets it show through or around the
control, so the learner sees two. The centre control — the Player's own in the full
chrome, and the compact chrome's centre button, which the Player SHALL restyle to the
same geometry — SHALL therefore be a disc at least 64 by 64 CSS pixels, painted with a
fully opaque background, whose centre coincides with the centre of the video frame. The
geometry SHALL be stated once and shared by both, so the two chromes offer one control,
not two designs.

#### Scenario: The control hides the embed's icon completely
- **WHEN** a YouTube-sourced lesson is playing on a phone, the controls are visible, and
  the embed paints its centre play/pause icon
- **THEN** the centre control on screen is at least 64 by 64 CSS pixels, its background is
  fully opaque, and its centre is the centre of the frame, so no part of the embed's icon
  is visible

#### Scenario: The compact chrome's button has the same geometry
- **WHEN** the Player renders its compact chrome on a phone and the controls are visible
- **THEN** the layout's centre button is the same size, the same opaque disc, and centred
  on the frame in the same way as the Player's own control in the full chrome

#### Scenario: The centre control appears with the controls
- **WHEN** a lesson is playing on a phone in the Player's full chrome and the learner
  taps the video once, revealing the control bar
- **THEN** a play/pause control is drawn at the centre of the frame

#### Scenario: Tapping it pauses the lesson
- **WHEN** that control is on screen and the learner taps it
- **THEN** the video pauses and the control bar stays visible

#### Scenario: It leaves with the controls
- **WHEN** the control bar hides again
- **THEN** no centre control is drawn over the video

#### Scenario: The compact chrome is not given two
- **WHEN** the Player renders its compact chrome on a phone, which draws a centre
  play/pause button of its own, and the controls are visible
- **THEN** exactly one centre play/pause control is on screen

#### Scenario: A mouse gets no centre control
- **WHEN** a lesson is watched with a mouse and the control bar is visible
- **THEN** no centre control is drawn, and a click on the frame toggles playback

#### Scenario: It covers the embed's own icon
- **WHEN** a YouTube-sourced lesson fills the viewport on an iPhone held in landscape,
  the controls are visible, and the learner taps the icon the embed paints at the centre
- **THEN** the Player's own centre control receives the tap and playback toggles

#### Scenario: Its name is localized
- **WHEN** the control renders in each supported locale
- **THEN** its accessible name is that locale's word for the action it performs, with no
  English fallback text

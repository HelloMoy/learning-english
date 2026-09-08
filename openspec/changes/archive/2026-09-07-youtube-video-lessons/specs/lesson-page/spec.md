## MODIFIED Requirements

### Requirement: The Player is the native HTML5 `<video controls>` element

The Player SHALL be a Vidstack `<MediaPlayer>` containing a `<MediaProvider>` and
Vidstack's Default Video Layout chrome. The player's `poster` SHALL be set when the
Lesson has a `poster`. The Default Layout SHALL provide, at minimum, play/pause, a
seekable time slider, elapsed and total time, volume, playback rate, and fullscreen.

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

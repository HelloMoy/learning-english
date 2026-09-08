## MODIFIED Requirements

### Requirement: The Player is the native HTML5 `<video controls>` element

The Player SHALL be a Vidstack `<MediaPlayer>` containing a `<MediaProvider>` and
Vidstack's Default Video Layout chrome. The player's `src` SHALL be the Lesson
`source` URL. The player's `poster` SHALL be set when the Lesson has a `poster`. The
Default Layout SHALL provide, at minimum, play/pause, a seekable time slider, elapsed
and total time, volume, playback rate, and fullscreen.

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
- **THEN** the rendered player loads that source and presents Vidstack's Default
  Layout controls

#### Scenario: The Player shows the poster when present
- **WHEN** the resolved view's lesson has `poster: "/thumbnails/long-vs-short.jpg"`
- **THEN** the player paints that image over the video frame before playback begins,
  rather than an empty black frame

#### Scenario: The Player's chrome matches the app's theme
- **WHEN** the application's resolved theme is dark
- **THEN** the player's controls render in their dark treatment, regardless of the
  operating system's color-scheme preference

#### Scenario: The Player's controls are localized
- **WHEN** the Lesson Page renders under the `es` locale
- **THEN** the Default Layout's controls expose their accessible names in Spanish,
  sourced from `src/messages/es.json`, not from the library's English defaults

#### Scenario: The Player has no custom Mark as complete affordance
- **WHEN** the Player is rendered
- **THEN** there is no Mark as complete button inside the Player chrome; the Mark as
  complete affordance lives in the page footer, next to the Player

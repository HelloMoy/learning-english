## ADDED Requirements

### Requirement: The video is fitted without cropping in the browser's own fullscreen

While the Player is in the browser's own fullscreen, the video SHALL be fitted inside the
screen without cropping, whatever the screen's aspect ratio. On a screen wider than 16:9
the video area SHALL be the largest 16:9 box that fits the screen's height, centred
horizontally, with the player's black background filling the remaining sides.

This is the guarantee the enlarged fallback mode already gives, extended to the mode the
browser provides. It is needed for the same reason: a YouTube-sourced Lesson's embed lays
its video out against the frame's width and the Player shows only the frame's middle
band, so a video area shorter than `width × 9/16` cuts the video at the top and bottom.

The Player's chrome SHALL keep spanning the whole screen in fullscreen: the control bar,
the tap gestures and the in-player overlays are laid out against the full screen, not
against the fitted video area. Outside fullscreen — in the page and in the enlarged
fallback mode — the Player's geometry SHALL be unchanged.

#### Scenario: A wide landscape screen does not crop the video
- **WHEN** a YouTube-sourced lesson is taken into the browser's own fullscreen on a
  screen wider than 16:9
- **THEN** the video area is no wider than `height × 16/9` of the screen, spans the
  screen's full height, and is centred horizontally

#### Scenario: The embed stays centred on the fitted video area
- **WHEN** the Player is in the browser's own fullscreen
- **THEN** the embed frame's centre sits on the fitted video area's centre

#### Scenario: The controls still span the screen
- **WHEN** the Player is in the browser's own fullscreen on a screen wider than 16:9
- **THEN** the control layout is as wide as the screen, not as the fitted video area

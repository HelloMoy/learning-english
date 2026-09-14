"use client";

import { isCompactChrome } from "@/lib/player-layout/player-layout";

import { useMediaRemote, useMediaState } from "@vidstack/react";
import { defaultLayoutIcons } from "@vidstack/react/player/layouts/default";
import { useTranslations } from "next-intl";

/**
 * The play/pause control drawn at the centre of the video on a touch device,
 * for as long as the control bar is in view.
 *
 * @remarks
 * On a phone a tap on the frame reveals the control bar rather than toggling
 * playback — the convention of every video app the learner already uses — so
 * the frame needs a control that does toggle it. The Default Layout supplies
 * one in its compact chrome and none in its full chrome, and the full chrome
 * is what the player wears once it fills the viewport in landscape. That is
 * exactly where a YouTube-sourced lesson leaves the learner alone with the
 * embed's own centre icon: Safari on iPhone paints it through the player's
 * chrome, the provider's blocker keeps every tap from reaching it, and it
 * cannot be hidden from outside a cross-origin frame. This control is placed
 * over that icon, so the tap a learner aims at it lands on something that
 * acts.
 *
 * It renders nothing in three cases, and renders nothing rather than hiding
 * itself, because a control drawn over the video takes the pointer and would
 * swallow the tap that reveals the bar:
 *
 * - **the compact chrome is on screen** — the layout draws its own centre
 *   button there, and exactly one may ever be on screen. The threshold is
 *   `isCompactChrome`, the same predicate the player's `smallLayoutWhen`
 *   asks, so the two answers cannot drift apart;
 * - **the pointer is fine** — a click on the frame already toggles playback
 *   for a mouse, and a second control would be redundant;
 * - **the control bar is hidden** — the control belongs to that chrome and
 *   leaves with it, so an uninterrupted lesson has nothing drawn over it.
 *
 * Like `VideoEnlargeButton`, it is a plain button wearing the chrome's own
 * `vds-button` class and Vidstack's own glyphs rather than a `lucide-react`
 * icon: it sits among the player's controls and a second icon vocabulary
 * would read as a foreign control. Its copy is borrowed from
 * `Components.VideoPlayer` — the same `play` / `pause` words the control bar
 * already uses — so the action keeps one name across the app and every locale
 * already has it.
 *
 * The geometry is a rule in `lesson-video-player.css`, which centres it on
 * the frame and gives it a touch-sized hit area.
 *
 * @category Components
 */
export function VideoCenterPlayButton() {
  const t = useTranslations("Components.VideoPlayer");
  const remote = useMediaRemote();
  const pointer = useMediaState("pointer");
  const controlsVisible = useMediaState("controlsVisible");
  const width = useMediaState("width");
  const isPaused = useMediaState("paused");
  const { Play, Pause } = defaultLayoutIcons.PlayButton;
  const Icon = isPaused ? Play : Pause;

  if (pointer !== "coarse" || !controlsVisible || isCompactChrome(width)) return null;

  return (
    <button
      type="button"
      className="vds-button lesson-video-player__center-play-button"
      aria-label={t(isPaused ? "play" : "pause")}
      aria-pressed={!isPaused}
      onClick={(event) => remote.togglePaused(event.nativeEvent)}
    >
      <Icon className="vds-icon" />
    </button>
  );
}

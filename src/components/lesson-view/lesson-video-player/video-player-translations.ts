import type { DefaultLayoutTranslations } from "@vidstack/react/player/layouts/default";

/**
 * Vidstack keys its layout copy by the English string itself — `'Play'`,
 * `'Enter Fullscreen'`, `'Closed-Captions Off'`. Those make poor JSON keys, so
 * `Components.VideoPlayer` uses kebab-case and this table is the single place
 * the two vocabularies meet.
 *
 * @remarks
 * Ordered as Vidstack declares `DefaultLayoutWord`, so a diff against the
 * library's type on upgrade reads top to bottom.
 */
export const LAYOUT_WORD_MESSAGE_KEYS = {
  Announcements: "announcements",
  Accessibility: "accessibility",
  AirPlay: "airplay",
  Audio: "audio",
  Auto: "auto",
  Boost: "boost",
  Captions: "captions",
  "Caption Styles": "caption-styles",
  "Captions look like this": "captions-look-like-this",
  Chapters: "chapters",
  "Closed-Captions Off": "closed-captions-off",
  "Closed-Captions On": "closed-captions-on",
  Connected: "connected",
  Continue: "continue",
  Connecting: "connecting",
  Default: "default",
  Disabled: "disabled",
  Disconnected: "disconnected",
  "Display Background": "display-background",
  Download: "download",
  "Enter Fullscreen": "enter-fullscreen",
  "Enter PiP": "enter-pip",
  "Exit Fullscreen": "exit-fullscreen",
  "Exit PiP": "exit-pip",
  Font: "font",
  Family: "family",
  Fullscreen: "fullscreen",
  "Google Cast": "google-cast",
  "Keyboard Animations": "keyboard-animations",
  LIVE: "live",
  Loop: "loop",
  Mute: "mute",
  Normal: "normal",
  Off: "off",
  Pause: "pause",
  Play: "play",
  Playback: "playback",
  PiP: "pip",
  Quality: "quality",
  Replay: "replay",
  Reset: "reset",
  "Seek Backward": "seek-backward",
  "Seek Forward": "seek-forward",
  Seek: "seek",
  Settings: "settings",
  "Skip To Live": "skip-to-live",
  Speed: "speed",
  Size: "size",
  Color: "color",
  Opacity: "opacity",
  Shadow: "shadow",
  Text: "text",
  "Text Background": "text-background",
  Track: "track",
  Unmute: "unmute",
  Volume: "volume",
} as const satisfies Record<keyof DefaultLayoutTranslations, string>;

/**
 * Builds the full `DefaultLayoutTranslations` map from the app's own messages.
 *
 * @remarks
 * The return type is the **complete** map rather than the `Partial` the layout
 * accepts. That is the point: a Vidstack upgrade that adds or renames a word
 * fails `pnpm typecheck` here, instead of silently rendering an English
 * control label to a Spanish learner.
 *
 * @param translate - A `useTranslations("Components.VideoPlayer")` function
 * @returns Every layout word, resolved for the active locale
 */
export function buildVideoPlayerTranslations(
  translate: (key: string) => string,
): DefaultLayoutTranslations {
  const entries = Object.entries(LAYOUT_WORD_MESSAGE_KEYS).map(([word, messageKey]) => [
    word,
    translate(messageKey),
  ]);

  return Object.fromEntries(entries) as DefaultLayoutTranslations;
}

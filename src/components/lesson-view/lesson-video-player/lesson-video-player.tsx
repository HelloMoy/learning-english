"use client";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import "./lesson-video-player.css";

import { MediaPlayer, MediaProvider, Poster, type MediaPlayerInstance } from "@vidstack/react";
import { defaultLayoutIcons, DefaultVideoLayout } from "@vidstack/react/player/layouts/default";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import type { ComponentProps, ReactNode, Ref } from "react";

import { buildVideoPlayerTranslations } from "./video-player-translations";

/**
 * The lesson player: a Vidstack `<MediaPlayer>` with the Default Video Layout.
 *
 * @remarks
 * It replaces the bare `<video controls>` this project shipped in v1. The
 * reason is not the chrome — it is that a native player's controls live in a
 * closed shadow root, so anything drawn over them is at the browser's mercy in
 * both z-order and hit-testing. Here the provider, the layout, and any overlay
 * are siblings in a tree we own.
 *
 * The overlay is a **`children` slot**, not a prop, precisely so it composes
 * that way: it lands inside the player element, sharing its positioning
 * context, and the caller styles it against the player box without this
 * component knowing what the overlay is or when it shows.
 *
 * `ariaLabel` is passed through rather than left to Vidstack. The library
 * otherwise builds `"Video Player - <title>"` in English, which would be the
 * one control name on the page that no locale file can reach.
 *
 * Three of the player's defaults are wrong for this app and are overridden
 * here rather than worked around by callers:
 *
 * - **The poster is drawn explicitly.** The Default Layout renders no `Poster`
 *   of its own, so a lesson with a perfectly good thumbnail would show a black
 *   idle frame. It belongs inside `<MediaProvider>`, which is the outlet the
 *   provider paints behind the video.
 * - **The color scheme follows the app, not the OS.** Vidstack defaults to
 *   `system`; this app has its own toggle that ignores the OS, so the chrome
 *   would sit in light mode inside a dark page.
 * - **The layout breaks on width alone.** The default also switches to the
 *   compact mobile layout below 380px of *height*, and a 16:9 player in the
 *   lesson column is ~360px tall on a desktop — every desktop learner would
 *   get the phone chrome.
 *
 * Captions, chapters, thumbnails, quality menus, and Cast are all available
 * from this layout and none are wired up here; adding one is a change to this
 * file, not a change of player.
 *
 * @param source - The lesson's video URL
 * @param poster - The lesson's thumbnail, when it has one
 * @param title - The lesson title, shown by the layout and used in the label
 * @param ariaLabel - Localized accessible name for the player region
 * @param keyDisabled - Suppresses the player's own keyboard shortcuts; set
 *                      while an overlay owns the keyboard
 * @param children - Rendered inside the player box, over the video frame
 * @param lifecycle - `onPlay` / `onPause` / `onSeeking` / `onEnded` /
 *                    `onTimeUpdate`, forwarded to the player unchanged
 * @param ref - The `MediaPlayerInstance`, for callers that drive playback
 */
export function LessonVideoPlayer({
  source,
  poster,
  title,
  ariaLabel,
  keyDisabled = false,
  children,
  ref,
  ...lifecycle
}: {
  source: string;
  poster?: string;
  title: string;
  ariaLabel?: string;
  keyDisabled?: boolean;
  children?: ReactNode;
  ref?: Ref<MediaPlayerInstance | null>;
} & Pick<
  ComponentProps<typeof MediaPlayer>,
  "onPlay" | "onPause" | "onSeeking" | "onEnded" | "onTimeUpdate"
>) {
  const t = useTranslations("Components.VideoPlayer");
  const { resolvedTheme } = useTheme();

  return (
    <MediaPlayer
      ref={ref}
      className="aspect-video w-full bg-black"
      src={{ src: source, type: "video/mp4" }}
      poster={poster}
      title={title}
      ariaLabel={ariaLabel}
      viewType="video"
      playsInline
      keyDisabled={keyDisabled}
      {...lifecycle}
    >
      <MediaProvider>
        {poster !== undefined ? (
          <Poster
            className="vds-poster"
            src={poster}
            alt=""
          />
        ) : null}
      </MediaProvider>
      <DefaultVideoLayout
        icons={defaultLayoutIcons}
        translations={buildVideoPlayerTranslations(t)}
        colorScheme={resolvedTheme === "light" ? "light" : "dark"}
        smallLayoutWhen={({ width }) => width < 576}
      />
      {children}
    </MediaPlayer>
  );
}

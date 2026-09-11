"use client";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import "./lesson-video-player.css";

import { useBrowserChromeVisible } from "@/hooks/use-browser-chrome-visible/use-browser-chrome-visible";
import { useEnlargedVideo } from "@/hooks/use-enlarged-video/use-enlarged-video";
import { cn } from "@/lib/utils/utils";
import { youtubeVideoIdFrom } from "@/lib/youtube-source/youtube-source";

import { MediaPlayer, MediaProvider, Poster, type MediaPlayerInstance } from "@vidstack/react";
import { defaultLayoutIcons, DefaultVideoLayout } from "@vidstack/react/player/layouts/default";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import type { ComponentProps, ReactNode, Ref } from "react";

import { ScrollDownHint } from "../scroll-down-hint/scroll-down-hint";
import { VideoEnlargeButton } from "../video-enlarge-button/video-enlarge-button";
import { PlaybackGestures } from "./playback-gestures";
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
 * **The `src` is derived from `source`, not passed through.** A lesson's video
 * is either a file this project hosts or a video published on YouTube, and the
 * two need different providers. `youtubeVideoIdFrom` decides which; a YouTube
 * link becomes Vidstack's `youtube/<id>` provider form, everything else stays a
 * direct `video/mp4` source. Declaring `type: "video/mp4"` for a YouTube link —
 * which is what every lesson used to get — makes the provider read a watch page
 * as a byte stream and the lesson shows a dead player.
 *
 * Routing YouTube through the library's provider rather than a hand-written
 * `<iframe>` is what keeps the rest of this file true for both kinds of lesson.
 * The provider drives a YouTube iframe through its IFrame API and exposes it
 * behind the same `MediaPlayerInstance`, so `currentTime`, `seekTo` and the
 * media events keep working — which is what the resume overlay and the position
 * persistence are built on. A bare embed would strand both: its `start=`
 * parameter can say where to begin, but nothing can read back where the learner
 * stopped.
 *
 * **Fullscreen stays the browser's wherever the browser has it.** The layout's
 * own fullscreen button is left in place and a fallback is added *after* it, so
 * a browser that can take the player fullscreen behaves exactly as it did
 * before this control existed. The fallback exists for the case the library
 * cannot serve: Safari on iPhone exposes no element Fullscreen API, a
 * YouTube-sourced lesson has no `<video>` for `webkitEnterFullscreen`, and the
 * library hides a button it cannot support, which left an iPhone learner with
 * no way to enlarge a lesson at all. Exactly one of the two ever paints —
 * `VideoEnlargeButton` renders nothing while `canFullscreen` is true.
 *
 * Enlarged, the player is pinned to the viewport as the **largest 16:9 box that
 * fits**, over a black backdrop, rather than stretched to the viewport's own
 * shape. That is forced by the YouTube provider: the embed lays its video out
 * against the iframe's width and the player shows only the middle band, so a
 * band shorter than `width × 9/16` — which is what a landscape viewport would
 * give — crops the video top and bottom.
 *
 * On an iPhone the viewport itself is the ceiling: Safari's toolbar takes 110
 * of the 402 landscape points and hides only for a real swipe on the document,
 * which is why the mode never locks the page's scroll — the swipe has to travel
 * through the pinned player to the page beneath. While that toolbar is still on
 * screen a `ScrollDownHint` is drawn along the top of the box to say so.
 * `useBrowserChromeVisible` decides when, from what the page can measure, and
 * the hint is gone the moment the viewport reaches the screen's short side.
 *
 * **A single tap on the video toggles playback, on every pointer.** The
 * Default Layout's own gestures are switched off (`noGestures`) and
 * `PlaybackGestures` supplies the set, because on a touch device the library
 * swaps the tap's meaning from play/pause to show/hide controls — the YouTube
 * app's convention — and here that convention is a trap. Safari on iPhone
 * gets YouTube's *mobile* skin, which draws a centred play/pause icon through
 * this chrome even with the embed's controls disabled; the provider's blocker
 * keeps every tap from reaching it (rightly — the same overlay carries links
 * out of the lesson); and the icon cannot be hidden from outside a
 * cross-origin frame. So the learner sees a control that promises play/pause
 * and gets a control bar instead. Making the tap act is the only fix that
 * covers both icons; the bar still shows on every tap, since the library
 * shows it on `pause` and after `play`. A double tap on an edge starts a
 * seek run with an on-screen count, the YouTube app's convention — the
 * helper's own JSDoc says how the library's gesture and the run share it.
 *
 * The element is never portalled. Moving the player in the tree would remount
 * the provider `<iframe>`, reloading the embed and resetting `currentTime`
 * under the resume overlay and the position writes; a class costs none of that.
 *
 * Three of the player's defaults are wrong for this app and are overridden
 * here rather than worked around by callers:
 *
 * - **The poster is drawn explicitly.** The Default Layout renders no `Poster`
 *   of its own, so a self-hosted lesson with a perfectly good thumbnail would
 *   show a black idle frame. It belongs inside `<MediaProvider>`, which is the
 *   outlet the provider paints behind the video. A YouTube lesson needs none —
 *   the provider finds its own thumbnail — so an absent `poster` there means
 *   "already covered", not "show black".
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
 * @param source - The lesson's video URL: a project-hosted file, or a YouTube
 *                 link in any of its forms
 * @param poster - The lesson's thumbnail, when it has one
 * @param title - The lesson title, shown by the layout and used in the label
 * @param ariaLabel - Localized accessible name for the player region
 * @param keyDisabled - Suppresses the player's own keyboard shortcuts; set
 *                      while an overlay owns the keyboard
 * @param children - Rendered inside the player box, over the video frame
 * @param lifecycle - `onPlay` / `onPlaying` / `onPause` / `onSeeking` /
 *                    `onEnded` / `onTimeUpdate`, forwarded to the player
 *                    unchanged. `onPlay` reports the play *request*;
 *                    `onPlaying` reports that frames are actually rolling,
 *                    which is the only moment every provider can be paused
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
  "onPlay" | "onPlaying" | "onPause" | "onSeeking" | "onEnded" | "onTimeUpdate"
>) {
  const t = useTranslations("Components.VideoPlayer");
  const { resolvedTheme } = useTheme();
  const { isEnlarged, toggle } = useEnlargedVideo();
  const isBrowserChromeVisible = useBrowserChromeVisible();

  return (
    <>
      {isEnlarged ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black"
        />
      ) : null}
      <MediaPlayer
        ref={ref}
        className={cn(
          // `align-bottom` because the player is an inline-level flex box:
          // left on the text baseline it leaves a few pixels of descender
          // space under the video, inside a wrapper that is painted black.
          "aspect-video w-full bg-black align-bottom",
          // The enlarged geometry is a rule in this component's stylesheet,
          // not utilities here — Vidstack's own player rules outrank them.
          isEnlarged && "lesson-video-player--enlarged",
        )}
        src={playerSourceFrom(source)}
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
        <PlaybackGestures />
        <DefaultVideoLayout
          icons={defaultLayoutIcons}
          translations={buildVideoPlayerTranslations(t)}
          colorScheme={resolvedTheme === "light" ? "light" : "dark"}
          smallLayoutWhen={({ width }) => width < 576}
          noGestures
          slots={{
            afterFullscreenButton: (
              <VideoEnlargeButton
                isEnlarged={isEnlarged}
                onToggle={toggle}
              />
            ),
          }}
        />
        {isEnlarged && isBrowserChromeVisible ? <ScrollDownHint /> : null}
        {children}
      </MediaPlayer>
    </>
  );
}

/**
 * Turns a lesson's `source` into the source descriptor its provider needs.
 *
 * @remarks
 * Kept out of the JSX so the choice of provider reads as a decision with a
 * name, rather than as a conditional buried among a dozen player props.
 *
 * @param source - The lesson's video URL
 * @returns Vidstack's `youtube/<id>` provider form for a YouTube link, and a
 *          direct `video/mp4` source descriptor for everything else
 */
function playerSourceFrom(source: string): ComponentProps<typeof MediaPlayer>["src"] {
  const youtubeVideoId = youtubeVideoIdFrom(source);
  return youtubeVideoId === undefined
    ? { src: source, type: "video/mp4" }
    : `youtube/${youtubeVideoId}`;
}

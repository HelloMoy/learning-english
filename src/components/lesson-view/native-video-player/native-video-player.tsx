"use client";

import type { Ref } from "react";

/**
 * The v1 video player. A single HTML5 `<video controls>` element — no
 * custom chrome, no custom JavaScript wrapper. The native control exposes
 * play/pause, scrubber, time, playback rate, mute, volume, fullscreen, and
 * a caption track slot.
 *
 * Captions ship in a future change (see GLOSSARY.md § Deferred to a future
 * change); the `poster` attribute is set when the lesson has one.
 *
 * The component exposes the underlying `<video>` element through a plain
 * `ref` prop so wrappers can attach lifecycle listeners
 * (`PlaybackPositionedVideoPlayer` does this for position persistence).
 * React 19 passes `ref` like any other prop — no `forwardRef` wrapper.
 * Marked `"use client"` because the ref is typically consumed by a
 * client-side wrapper; the player itself does not require it.
 */
export function NativeVideoPlayer({
  source,
  poster,
  title,
  ariaLabel,
  ref,
}: {
  source: string;
  poster?: string;
  title: string;
  ariaLabel?: string;
  ref?: Ref<HTMLVideoElement | null>;
}) {
  return (
    <video
      ref={ref}
      controls
      preload="metadata"
      title={title}
      aria-label={ariaLabel}
      poster={poster}
      className="aspect-video w-full bg-black"
    >
      <source
        src={source}
        type="video/mp4"
      />
    </video>
  );
}

"use client";

import type { LessonId } from "@/domain/entities/ids/ids";
import { usePlaybackPosition } from "@/hooks/use-playback-position/use-playback-position";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import { isPositionResumable, LessonVideoResume } from "../lesson-video-resume/lesson-video-resume";
import { NativeVideoPlayer } from "../native-video-player/native-video-player";

/**
 * Smart wrapper around `NativeVideoPlayer` that persists the playback
 * position to `localStorage` and renders the "Resume from MM:SS" overlay
 * over the video when a saved position passes the thresholds.
 *
 * Persistence rules:
 *
 * - On mount the wrapper reads the saved position; if it passes the resume
 *   thresholds (`isPositionResumable`), the `<video>` element's
 *   `currentTime` is set to that value. This is a **seek**, not a write.
 * - The wrapper MUST NOT persist a position before the first user
 *   interaction with the video element — that would overwrite a stored
 *   value with `0` on cold load.
 * - `timeupdate` writes are **debounced** at 1500ms to avoid hammering
 *   `localStorage`. `pause`, `seeking`, `ended`, and `beforeunload` write
 *   immediately so graceful closes never lose progress.
 * - The "Resume" and "Restart" overlay actions seek the element directly
 *   through the local `videoRef` and flush the debounced timer.
 *
 * Persistence is keyed by `lessonId` via the `usePlaybackPosition` hook
 * (browser-only). Server Components do NOT import this file.
 */
export function PlaybackPositionedVideoPlayer({
  lessonId,
  source,
  poster,
  title,
  ariaLabel,
  durationSeconds = 0,
}: {
  lessonId: LessonId;
  source: string;
  poster?: string;
  title: string;
  ariaLabel?: string;
  /** Lesson `durationSeconds` (from the `VideoLesson` entity). Used to
   *  filter the resume overlay's threshold check. */
  durationSeconds?: number;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const position = usePlaybackPosition(lessonId);
  // A ref, not state: nothing renders from it, and the media listeners below
  // must observe the flip *immediately*. As state, `play` would schedule a
  // re-render, and a `pause` arriving in the same tick would still run the
  // listener closed over `false` — dropping the write.
  const hasInteractedRef = useRef(false);
  const [savedPosition, setSavedPosition] = useState<number | null>(null);

  // Only the interaction gate lives here. Range and finiteness are the
  // `PlaybackPosition` value object's job, enforced inside the hook — a
  // second copy of those rules here would be one to keep in sync.
  const writeIfAllowed = useCallback(
    async (seconds: number) => {
      if (!hasInteractedRef.current) return;
      await position.set(seconds);
    },
    [position],
  );

  const debouncedWrite = useDebouncedCallback(writeIfAllowed, 1500);

  // On mount: read the saved position, hold it in state (drives the
  // overlay), and seek the <video> if it passes the thresholds. Pure
  // read — does NOT write.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await position.get();
      if (cancelled) return;
      setSavedPosition(saved);
      if (saved === null) return;
      if (!isPositionResumable(saved, durationSeconds)) return;
      const video = videoRef.current;
      if (video !== null) {
        video.currentTime = saved;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [position, durationSeconds]);

  // Lifecycle subscriptions: timeupdate (debounced), pause/seeking/ended
  // (immediate), play (sets interaction flag), beforeunload (flush + write).
  useEffect(() => {
    const video = videoRef.current;
    if (video === null) return;

    const onTimeUpdate = () => {
      debouncedWrite(video.currentTime);
    };
    const onPauseOrSeek = () => {
      debouncedWrite.flush();
      void writeIfAllowed(video.currentTime);
    };
    const onPlay = () => {
      hasInteractedRef.current = true;
    };
    const onBeforeUnload = () => {
      debouncedWrite.flush();
      void writeIfAllowed(video.currentTime);
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("pause", onPauseOrSeek);
    video.addEventListener("seeking", onPauseOrSeek);
    video.addEventListener("ended", onPauseOrSeek);
    video.addEventListener("play", onPlay);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      debouncedWrite.flush();
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("pause", onPauseOrSeek);
      video.removeEventListener("seeking", onPauseOrSeek);
      video.removeEventListener("ended", onPauseOrSeek);
      video.removeEventListener("play", onPlay);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [debouncedWrite, writeIfAllowed]);

  const onResume = (seconds: number) => {
    const video = videoRef.current;
    if (video !== null) {
      video.currentTime = seconds;
    }
    hasInteractedRef.current = true;
    debouncedWrite.flush();
    setSavedPosition(null);
  };

  const onRestart = () => {
    const video = videoRef.current;
    if (video !== null) {
      video.currentTime = 0;
    }
    hasInteractedRef.current = true;
    debouncedWrite.flush();
    setSavedPosition(null);
  };

  return (
    <div className="relative">
      <NativeVideoPlayer
        source={source}
        poster={poster}
        title={title}
        ariaLabel={ariaLabel}
        ref={videoRef}
      />
      <LessonVideoResume
        positionSeconds={savedPosition}
        durationSeconds={durationSeconds}
        onResume={onResume}
        onRestart={onRestart}
      />
    </div>
  );
}

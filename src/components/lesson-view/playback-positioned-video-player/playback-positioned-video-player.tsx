"use client";

import type { LessonId } from "@/domain/entities/ids/ids";
import { usePlaybackPosition } from "@/hooks/use-playback-position/use-playback-position";
import { isPositionResumable } from "@/lib/playback-resume-thresholds/playback-resume-thresholds";

import NiceModal from "@ebay/nice-modal-react";
import { useCallback, useEffect, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";

import {
  LessonVideoResumeModal,
  type LessonVideoResumeChoice,
} from "../../modals/lesson-video-resume-modal/lesson-video-resume-modal";
import { NativeVideoPlayer } from "../native-video-player/native-video-player";

/**
 * Smart wrapper around `NativeVideoPlayer` that persists the playback
 * position to `localStorage` and offers the "Resume from MM:SS" modal when a
 * saved position passes the thresholds.
 *
 * Persistence rules:
 *
 * - On mount the wrapper reads the saved position; if it passes the resume
 *   thresholds (`isPositionResumable`), it opens `LessonVideoResumeModal` and
 *   waits for the learner's answer. The `<video>` is seeked **only** if they
 *   choose Resume — restarting and dismissing both leave it at `0`. Either way
 *   this is a **seek**, not a write.
 * - The wrapper MUST NOT persist a position before the first user
 *   interaction with the video element — that would overwrite a stored
 *   value with `0` on cold load.
 * - `timeupdate` writes are **debounced** at 1500ms to avoid hammering
 *   `localStorage`. `pause`, `seeking`, `ended`, and `beforeunload` write
 *   immediately so graceful closes never lose progress.
 * - Resuming seeks the element directly through the local `videoRef` and
 *   flushes the debounced timer.
 *
 * Persistence is keyed by `lessonId` via the `usePlaybackPosition` hook
 * (browser-only). Server Components do NOT import this file.
 *
 * The wrapper also reports the first `play` upward through the optional
 * `onPlaybackStart` callback, so a parent can react to "playback has begun"
 * without opening a second subscription on the same element.
 */
export function PlaybackPositionedVideoPlayer({
  lessonId,
  source,
  poster,
  title,
  ariaLabel,
  durationSeconds = 0,
  onPlaybackStart,
}: {
  lessonId: LessonId;
  source: string;
  poster?: string;
  title: string;
  ariaLabel?: string;
  /** Lesson `durationSeconds` (from the `VideoLesson` entity). Used to
   *  filter the resume overlay's threshold check. */
  durationSeconds?: number;
  /** Fired on every `play` event, from the same listener that flips the
   *  interaction gate. `LessonView` uses it to retire the title cover;
   *  callers that do not care may omit it. */
  onPlaybackStart?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const position = usePlaybackPosition(lessonId);
  // A ref, not state: nothing renders from it, and the media listeners below
  // must observe the flip *immediately*. As state, `play` would schedule a
  // re-render, and a `pause` arriving in the same tick would still run the
  // listener closed over `false` — dropping the write.
  const hasInteractedRef = useRef(false);
  // The resume prompt is a one-shot offer. Without this guard a Strict Mode
  // double-invoke — or any change to the effect's deps — would stack a second
  // dialog on top of the first, or re-ask a learner who already answered.
  const hasOfferedResumeRef = useRef(false);

  // The callback lives in a ref, not in the listener effect's deps. Callers
  // pass an inline arrow, so a dep would re-subscribe on every render — and
  // that effect's cleanup calls `debouncedWrite.flush()`, which would force
  // an immediate write per render and defeat the 1500ms debounce entirely.
  const onPlaybackStartRef = useRef(onPlaybackStart);
  useEffect(() => {
    onPlaybackStartRef.current = onPlaybackStart;
  }, [onPlaybackStart]);

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

  // On mount: read the saved position and, when it is worth offering, ask the
  // learner what to do with it. Pure read — does NOT write.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await position.get();
      if (cancelled || hasOfferedResumeRef.current) return;
      if (!isPositionResumable(saved, durationSeconds)) return;

      hasOfferedResumeRef.current = true;
      const choice = (await NiceModal.show(LessonVideoResumeModal, {
        positionSeconds: saved,
      })) as LessonVideoResumeChoice;

      // "restart" and "dismissed" both mean "start from the top", which is
      // where the element already is — only a resume needs a seek.
      if (cancelled || choice.action !== "resume") return;
      const video = videoRef.current;
      if (video !== null) {
        video.currentTime = choice.seconds;
      }
      // Choosing to resume is a deliberate interaction, so the write gate
      // opens: from here on, position updates are allowed to persist.
      hasInteractedRef.current = true;
      debouncedWrite.flush();
    })();
    return () => {
      cancelled = true;
    };
  }, [position, durationSeconds, debouncedWrite]);

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
      onPlaybackStartRef.current?.();
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

  // No wrapper element: the resume prompt is portalled to the document root
  // by NiceModal, so there is nothing left for a positioning context to hold.
  return (
    <NativeVideoPlayer
      source={source}
      poster={poster}
      title={title}
      ariaLabel={ariaLabel}
      ref={videoRef}
    />
  );
}

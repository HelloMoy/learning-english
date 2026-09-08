"use client";

import type { LessonId } from "@/domain/entities/ids/ids";
import { usePersistPlaybackPosition } from "@/hooks/use-persist-playback-position/use-persist-playback-position";
import { usePlaybackPosition } from "@/hooks/use-playback-position/use-playback-position";
import { useResumeOnFirstPlay } from "@/hooks/use-resume-on-first-play/use-resume-on-first-play";

import type { MediaPlayerInstance } from "@vidstack/react";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

import { LessonVideoPlayer } from "../lesson-video-player/lesson-video-player";
import { LessonVideoResumeOverlay } from "../lesson-video-resume-overlay/lesson-video-resume-overlay";

/**
 * The lesson player with its memory: it remembers where the learner stopped,
 * and offers to take them back there.
 *
 * @remarks
 * This component is composition and nothing else. Both rules it depends on
 * live in hooks that know no player library:
 *
 * - `useResumeOnFirstPlay` decides whether, and when, to offer the saved
 *   position — on the learner's **first play**, never on mount. Landing on a
 *   lesson prompts nothing; a learner who came for the notes is not stopped.
 * - `usePersistPlaybackPosition` owns the write cadence (debounced
 *   `time-update`, immediate `pause`/`seeking`/`ended`, flush on unmount and
 *   `beforeunload`) and the gate that keeps a cold load from overwriting a
 *   stored position with `0`.
 *
 * The saved position is read once on mount. That read is **pure** — it feeds
 * the offer and writes nothing.
 *
 * The overlay renders as a child of the player, so it covers the video frame
 * and leaves the rest of the lesson page live. While it is up, the player's
 * own keyboard shortcuts are disabled: otherwise `Space` on the Resume button
 * would press it *and* toggle playback underneath.
 *
 * @param lessonId - Keys the stored position
 * @param source - The lesson's video URL
 * @param poster - The lesson's thumbnail, when it has one
 * @param title - The lesson title
 * @param ariaLabel - Localized accessible name for the player region
 * @param durationSeconds - The lesson's length, used by the resume thresholds
 * @param onPlaybackStart - Fired on every `play`; `LessonView` uses it to
 *                          retire the gold title cover
 * @param ref - The underlying player, for callers that need to drive it
 */
export function PlaybackPositionedVideoPlayer({
  lessonId,
  source,
  poster,
  title,
  ariaLabel,
  durationSeconds = 0,
  onPlaybackStart,
  ref,
}: {
  lessonId: LessonId;
  source: string;
  poster?: string;
  title: string;
  ariaLabel?: string;
  durationSeconds?: number;
  onPlaybackStart?: () => void;
  ref?: RefObject<MediaPlayerInstance | null>;
}) {
  const ownPlayerRef = useRef<MediaPlayerInstance | null>(null);
  const playerRef = ref ?? ownPlayerRef;
  const position = usePlaybackPosition(lessonId);
  const [savedPositionSeconds, setSavedPositionSeconds] = useState<number | null>(null);

  // Reading the position is a pure read: it decides what to *offer*, and the
  // offer is what the learner acts on. Nothing here writes.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const saved = await position.get();
      if (!cancelled) setSavedPositionSeconds(saved);
    })();
    return () => {
      cancelled = true;
    };
  }, [position]);

  // Both hooks read the player at call time through this handle rather than
  // capturing the instance, which is null on the first render.
  const player = useMemo(
    () => ({
      get currentTime() {
        return playerRef.current?.currentTime ?? 0;
      },
      pause: () => playerRef.current?.pause(),
      play: () => void playerRef.current?.play()?.catch(() => {}),
      seekTo: (seconds: number) => {
        if (playerRef.current !== null) playerRef.current.currentTime = seconds;
      },
    }),
    [playerRef],
  );

  const persistence = usePersistPlaybackPosition({ lessonId, player });
  const resume = useResumeOnFirstPlay({ savedPositionSeconds, durationSeconds, player });

  const isOfferOpen = resume.offeredSeconds !== null;

  return (
    <LessonVideoPlayer
      ref={playerRef}
      source={source}
      poster={poster}
      title={title}
      ariaLabel={ariaLabel}
      keyDisabled={isOfferOpen}
      onPlay={() => {
        persistence.openWriteGate();
        resume.handlePlay();
        onPlaybackStart?.();
      }}
      onPause={persistence.handleImmediateWrite}
      onSeeking={persistence.handleImmediateWrite}
      onEnded={persistence.handleImmediateWrite}
      onTimeUpdate={persistence.handleTimeUpdate}
    >
      {resume.offeredSeconds !== null ? (
        <LessonVideoResumeOverlay
          positionSeconds={resume.offeredSeconds}
          onResume={resume.resumeFromSavedPosition}
          onRestart={resume.restartFromBeginning}
        />
      ) : null}
    </LessonVideoPlayer>
  );
}

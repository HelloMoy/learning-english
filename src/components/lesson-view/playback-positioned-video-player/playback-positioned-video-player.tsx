"use client";

import type { LessonId } from "@/domain/entities/ids/ids";
import { useCompleteWhenWatched } from "@/hooks/use-complete-when-watched/use-complete-when-watched";
import { usePersistPlaybackPosition } from "@/hooks/use-persist-playback-position/use-persist-playback-position";
import { usePlaybackPosition } from "@/hooks/use-playback-position/use-playback-position";
import { useResumeOnFirstPlay } from "@/hooks/use-resume-on-first-play/use-resume-on-first-play";

import { useMediaState, type MediaPlayerInstance } from "@vidstack/react";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

import { LessonVideoPlayer } from "../lesson-video-player/lesson-video-player";
import { LessonVideoResumeOverlay } from "../lesson-video-resume-overlay/lesson-video-resume-overlay";
import { LessonVideoSkeleton } from "../lesson-video-skeleton/lesson-video-skeleton";

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
 *   It hangs off `onPlaying`, not `onPlay`: the offer holds the player by
 *   pausing it, and a provider driving a third-party embed stalls for good if
 *   that pause lands while its initial play request is still in flight.
 *   `onPlay` keeps the two things that are about the learner's *intent* to
 *   watch — the write gate and the gold-cover callback — which are right to
 *   fire a beat before the first frame.
 * - `usePersistPlaybackPosition` owns the write cadence (debounced
 *   `time-update`, immediate `pause`/`seeking`/`ended`, flush on unmount and
 *   `beforeunload`) and the gate that keeps a cold load from overwriting a
 *   stored position with `0`.
 * - `useCompleteWhenWatched` marks the lesson complete once playback reaches
 *   the end, through the same path the manual button uses. It carries its own
 *   gate, for the mirror-image reason: opening a lesson whose stored position
 *   is already past the threshold must not record a completion the learner
 *   did not earn on this visit.
 *
 * The saved position is read once on mount. That read is **pure** — it feeds
 * the offer and writes nothing.
 *
 * The overlay renders as a child of the player, so it covers the video frame
 * and leaves the rest of the lesson page live. While it is up, the player's
 * own keyboard shortcuts are disabled: otherwise `Space` on the Resume button
 * would press it *and* toggle playback underneath.
 *
 * **`LessonVideoSkeleton` is a sibling, not a child, and that is the point.**
 * Children of the player mount when the player does, which is exactly the gap
 * the placeholder exists to cover; a sibling ships inside the server-rendered
 * HTML and dresses the frame from the first paint. It is retired on
 * `useMediaState("canPlay")` rather than on hydration — this component owns the
 * player ref, so it is the only place that can read readiness — and the hook
 * answers `false` both on the server and on the client's hydration render,
 * which is what keeps the two in agreement.
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
  // Readiness, not hydration. React can finish hydrating seconds before a
  // provider driving a third-party embed has a frame to show, and retiring the
  // placeholder then just restores the black box it was covering.
  const canPlay = useMediaState("canPlay", playerRef);
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
      get duration() {
        return playerRef.current?.duration ?? 0;
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
  const completion = useCompleteWhenWatched({ lessonId, durationSeconds, player });

  const isOfferOpen = resume.offeredSeconds !== null;

  return (
    <>
      <LessonVideoPlayer
        ref={playerRef}
        source={source}
        poster={poster}
        title={title}
        ariaLabel={ariaLabel}
        keyDisabled={isOfferOpen}
        onPlay={() => {
          persistence.openWriteGate();
          completion.handlePlaybackStarted();
          onPlaybackStart?.();
        }}
        onPlaying={resume.handlePlaybackStarted}
        onPause={persistence.handleImmediateWrite}
        onSeeking={persistence.handleImmediateWrite}
        onEnded={() => {
          persistence.handleImmediateWrite();
          completion.handleProgress();
        }}
        onTimeUpdate={() => {
          persistence.handleTimeUpdate();
          completion.handleProgress();
        }}
      >
        {resume.offeredSeconds !== null ? (
          <LessonVideoResumeOverlay
            positionSeconds={resume.offeredSeconds}
            onResume={resume.resumeFromSavedPosition}
            onRestart={resume.restartFromBeginning}
          />
        ) : null}
      </LessonVideoPlayer>

      {canPlay ? null : <LessonVideoSkeleton poster={poster} />}
    </>
  );
}

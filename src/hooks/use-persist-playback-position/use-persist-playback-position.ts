"use client";

import type { LessonId } from "@/domain/entities/ids/ids";
import type { PlaybackPositionRepository } from "@/domain/ports/playback-position-repository/playback-position-repository";
import { usePlaybackPosition } from "@/hooks/use-playback-position/use-playback-position";

import { useCallback, useEffect, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";

/** How long `time-update` writes are collapsed for, in milliseconds. */
const TIME_UPDATE_DEBOUNCE_MS = 1500;

/**
 * The only thing this hook reads from a player: where playback currently is.
 *
 * @remarks
 * Structural rather than a Vidstack type, for the same reason as
 * `ResumablePlayer` — jsdom loads no media provider, so a real player reports
 * `0` forever and could never demonstrate that the right position was saved.
 */
export type PositionedPlayer = {
  readonly currentTime: number;
};

/**
 * What the player binds to its lifecycle callbacks.
 */
export type PlaybackPositionPersistence = {
  /** Bind to `time-update`. Debounced. */
  handleTimeUpdate: () => void;
  /** Bind to `pause`, `seeking`, and `ended`. Writes at once. */
  handleImmediateWrite: () => void;
  /** Opens the write gate. Call on the learner's first real interaction. */
  openWriteGate: () => void;
};

/**
 * Persists where the learner is in a lesson, on the cadence the
 * `playback-position` capability specifies.
 *
 * @remarks
 * `time-update` fires several times a second, so those writes are debounced at
 * {@link TIME_UPDATE_DEBOUNCE_MS}. `pause`, `seeking`, and `ended` write
 * immediately — they are the moments a learner is most likely to leave, and
 * losing a debounce window of progress there is exactly what they would
 * notice; those three also skip the server write window. The pending write is
 * flushed on unmount, and on `pagehide` it leaves by `navigator.sendBeacon`,
 * so a route change or a closed tab costs nothing.
 *
 * Nothing is written before {@link PlaybackPositionPersistence.openWriteGate}
 * is called. A cold load fires `time-update` at `0`, and writing that would
 * destroy the saved position before the learner is ever offered it.
 *
 * Range and finiteness are **not** re-checked here — the `PlaybackPosition`
 * value object owns those, and a second copy of the rules would be one to keep
 * in sync. A detached player reporting `NaN` is silently dropped there.
 *
 * @param lessonId - The lesson whose position is tracked
 * @param player - Anything that reports a `currentTime`
 * @param repository - Overrides the storage adapter; tests inject a fake
 * @returns The three handlers a player binds to its lifecycle events
 */
export function usePersistPlaybackPosition({
  lessonId,
  player,
  repository,
}: {
  lessonId: LessonId;
  player: PositionedPlayer;
  repository?: PlaybackPositionRepository;
}): PlaybackPositionPersistence {
  const position = usePlaybackPosition(lessonId, repository);

  // A ref, not state: the media listeners must observe the flip immediately.
  // As state, a `pause` arriving in the same tick as the opening `play` would
  // still run the listener closed over `false`, dropping the write.
  const isWriteGateOpenRef = useRef(false);

  // The player is read at event time, never captured. Callers pass a fresh
  // object each render, so closing over it would pin the callbacks to a stale
  // `currentTime` — and re-subscribing on every render would defeat the
  // debounce it is meant to protect.
  const playerRef = useRef(player);
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  const writeIfAllowed = useCallback(
    async (seconds: number) => {
      if (!isWriteGateOpenRef.current) return;
      await position.set(seconds);
    },
    [position],
  );

  // A pause, a seek, the end of the video: the moments a learner is most
  // likely to leave, so the position also skips its server write window.
  const writeAndFlush = useCallback(
    async (seconds: number) => {
      await writeIfAllowed(seconds);
      await position.flush();
    },
    [writeIfAllowed, position],
  );

  // `maxWait` matters as much as the wait itself. `time-update` fires several
  // times a second for as long as playback continues, so a plain debounce
  // resets forever and writes nothing until the video stops — a learner who
  // watches forty minutes and then loses the tab to a crash keeps nothing.
  // Capping the wait turns it into one write per window, which is what the
  // capability's "one per debounced window" scenario describes.
  const debouncedWrite = useDebouncedCallback(writeIfAllowed, TIME_UPDATE_DEBOUNCE_MS, {
    maxWait: TIME_UPDATE_DEBOUNCE_MS,
  });

  const handleTimeUpdate = useCallback(() => {
    debouncedWrite(playerRef.current.currentTime);
  }, [debouncedWrite]);

  const handleImmediateWrite = useCallback(() => {
    debouncedWrite.cancel();
    void writeAndFlush(playerRef.current.currentTime);
  }, [debouncedWrite, writeAndFlush]);

  const openWriteGate = useCallback(() => {
    isWriteGateOpenRef.current = true;
  }, []);

  // `pagehide`, not `beforeunload`: it also fires when iOS Safari or the
  // back-forward cache puts the page away, and a closing page may still
  // finish a beacon, which is how the last position leaves.
  useEffect(() => {
    const handlePageHide = () => {
      debouncedWrite.cancel();
      void writeIfAllowed(playerRef.current.currentTime).then(() => position.flushWithBeacon());
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      debouncedWrite.flush();
      void position.flush();
    };
  }, [debouncedWrite, writeIfAllowed, position]);

  return { handleTimeUpdate, handleImmediateWrite, openWriteGate };
}

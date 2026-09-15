"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** The pause between two clips of a sequence, so the pair reads as two words. */
export const CLIP_GAP_MS = 350;

/**
 * The slice of `HTMLAudioElement` the sequence drives. Tests hand in a fake
 * with the same three members; the browser hands in `new Audio(src)`.
 */
export type PlayableClip = {
  play: () => Promise<void>;
  pause: () => void;
  onended: ((event: Event) => void) | null;
};

/** Builds a playable clip for a source URL. */
export type CreateAudio = (source: string) => PlayableClip;

const createBrowserAudio: CreateAudio = (source) => new Audio(source);

/**
 * Plays short audio clips one at a time, in order, and reports which one is
 * sounding.
 *
 * @remarks
 * At most one clip plays: starting a sequence stops the clip in progress and
 * cancels whatever was still queued behind it. A clip that ends — or that the
 * browser refuses to play — leaves nothing reported as playing, so a caller
 * never shows a playing state for sound that is not there.
 *
 * Browser-side only: it constructs `Audio` elements.
 *
 * @param createAudio - Builds a clip for a source; defaults to `new Audio(src)`
 * @returns The source currently playing, or `null`, and a function that plays a sequence
 *
 * @example
 * ```tsx
 * const { playingSource, play } = useClipSequence();
 * play(["/audio/minimal-pairs/ship.mp3", "/audio/minimal-pairs/sheep.mp3"]);
 * ```
 */
export function useClipSequence(createAudio: CreateAudio = createBrowserAudio): {
  playingSource: string | null;
  play: (sources: ReadonlyArray<string>) => void;
} {
  const [playingSource, setPlayingSource] = useState<string | null>(null);
  const currentRun = useRef<symbol | null>(null);
  const currentClip = useRef<PlayableClip | null>(null);
  const pendingGap = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (pendingGap.current) clearTimeout(pendingGap.current);
    if (currentClip.current) {
      currentClip.current.onended = null;
      currentClip.current.pause();
    }
    currentClip.current = null;
    currentRun.current = null;
  }, []);

  const play = useCallback(
    (sources: ReadonlyArray<string>) => {
      stop();
      const run = Symbol("clip-run");
      currentRun.current = run;
      const isCurrent = () => currentRun.current === run;

      const playAt = (index: number) => {
        const source = sources[index];
        if (!isCurrent() || source === undefined) return;
        const clip = createAudio(source);
        currentClip.current = clip;
        clip.onended = () => {
          setPlayingSource(null);
          pendingGap.current = setTimeout(() => playAt(index + 1), CLIP_GAP_MS);
        };
        setPlayingSource(source);
        clip.play().catch(() => {
          if (isCurrent()) {
            stop();
            setPlayingSource(null);
          }
        });
      };

      playAt(0);
    },
    [createAudio, stop],
  );

  useEffect(() => stop, [stop]);

  return { playingSource, play };
}

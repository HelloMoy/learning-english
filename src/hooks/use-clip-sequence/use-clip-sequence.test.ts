import { faker } from "@faker-js/faker";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { CLIP_GAP_MS, useClipSequence, type PlayableClip } from "./use-clip-sequence";

type FakeClip = PlayableClip & { src: string; finish: () => void };

/**
 * Stands in for `new Audio(src)`. jsdom implements no media playback, and the
 * behaviour under test is the sequencing, not the browser's decoder.
 */
function makeAudioFactory({ refusesPlayback = false } = {}) {
  const created: FakeClip[] = [];
  const createAudio = (src: string): FakeClip => {
    const clip: FakeClip = {
      src,
      onended: null,
      play: vi.fn(() =>
        refusesPlayback ? Promise.reject(new Error("NotAllowedError")) : Promise.resolve(),
      ),
      pause: vi.fn(),
      finish: () => clip.onended?.(new Event("ended")),
    };
    created.push(clip);
    return clip;
  };
  return { createAudio, created };
}

const clipSource = () => `/audio/${faker.word.noun()}-${faker.string.alphanumeric(6)}.mp3`;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useClipSequence", () => {
  describe("GIVEN a single clip", () => {
    test("WHEN it is played THEN it is reported as the clip playing", async () => {
      const { createAudio } = makeAudioFactory();
      const source = clipSource();
      const { result } = renderHook(() => useClipSequence(createAudio));

      await act(async () => result.current.play([source]));

      expect(result.current.playingSource).toBe(source);
    });

    test("WHEN it ends THEN nothing is reported as playing", async () => {
      const { createAudio, created } = makeAudioFactory();
      const { result } = renderHook(() => useClipSequence(createAudio));
      await act(async () => result.current.play([clipSource()]));

      act(() => created[0]!.finish());

      expect(result.current.playingSource).toBeNull();
    });
  });

  describe("GIVEN two clips played as a sequence", () => {
    test("WHEN the first ends THEN the second starts only after the gap", async () => {
      const { createAudio, created } = makeAudioFactory();
      const [first, second] = [clipSource(), clipSource()];
      const { result } = renderHook(() => useClipSequence(createAudio));
      await act(async () => result.current.play([first, second]));

      act(() => created[0]!.finish());
      expect(created).toHaveLength(1);

      await act(async () => vi.advanceTimersByTime(CLIP_GAP_MS));

      expect(created.map((clip) => clip.src)).toEqual([first, second]);
      expect(result.current.playingSource).toBe(second);
    });

    test("WHEN a new play starts mid-sequence THEN the current clip stops and the rest never plays", async () => {
      const { createAudio, created } = makeAudioFactory();
      const [first, second, replacement] = [clipSource(), clipSource(), clipSource()];
      const { result } = renderHook(() => useClipSequence(createAudio));
      await act(async () => result.current.play([first, second]));

      await act(async () => result.current.play([replacement]));
      act(() => created[1]!.finish());
      await act(async () => vi.advanceTimersByTime(CLIP_GAP_MS * 4));

      expect(created[0]!.pause).toHaveBeenCalled();
      expect(created.map((clip) => clip.src)).toEqual([first, replacement]);
      expect(result.current.playingSource).toBeNull();
    });
  });

  describe("GIVEN a browser that refuses playback", () => {
    test("WHEN a clip is played THEN nothing is reported as playing", async () => {
      const { createAudio } = makeAudioFactory({ refusesPlayback: true });
      const { result } = renderHook(() => useClipSequence(createAudio));

      await act(async () => result.current.play([clipSource()]));

      expect(result.current.playingSource).toBeNull();
    });
  });
});

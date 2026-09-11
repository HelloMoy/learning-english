import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import {
  extendSeekRun,
  SEEK_RUN_WINDOW_MS,
  SEEK_STEP_SECONDS,
  seekRunSeconds,
  seekRunTarget,
  startSeekRun,
  type SeekRun,
} from "./seek-run";

/** Somewhere well inside a lesson, so a backward run never runs into zero. */
function anchorInsideALesson(): number {
  return faker.number.float({ min: 120, max: 3600, fractionDigits: 2 });
}

describe("seek-run", () => {
  describe("GIVEN the constants the player and the label share", () => {
    test("THEN one step is ten seconds and a run lapses after 700 ms", () => {
      expect(SEEK_STEP_SECONDS).toBe(10);
      expect(SEEK_RUN_WINDOW_MS).toBe(700);
    });
  });

  describe("GIVEN a double tap starts a run", () => {
    test("WHEN it starts forward THEN it is one step anchored where the video was", () => {
      const anchorTime = anchorInsideALesson();

      const run = startSeekRun("forward", anchorTime);

      expect(run).toEqual({ direction: "forward", steps: 1, anchorTime });
    });

    test("WHEN it starts forward THEN the target is one step past the anchor", () => {
      const anchorTime = anchorInsideALesson();

      expect(seekRunTarget(startSeekRun("forward", anchorTime))).toBeCloseTo(
        anchorTime + SEEK_STEP_SECONDS,
      );
    });

    test("WHEN it starts backward THEN the target is one step before the anchor", () => {
      const anchorTime = anchorInsideALesson();

      expect(seekRunTarget(startSeekRun("backward", anchorTime))).toBeCloseTo(
        anchorTime - SEEK_STEP_SECONDS,
      );
    });
  });

  describe("GIVEN a run in progress", () => {
    test("WHEN tapped on the same side THEN it gains a step and keeps its anchor", () => {
      const anchorTime = anchorInsideALesson();
      const run = startSeekRun("forward", anchorTime);

      const extended = extendSeekRun(run, "forward");

      expect(extended).toEqual({ direction: "forward", steps: 2, anchorTime });
    });

    test("WHEN tapped several times on the same side THEN every seek is counted from the anchor", () => {
      // The whole point of the anchor: a provider that has not yet applied the
      // previous seek must not make this one start from a stale time.
      const anchorTime = anchorInsideALesson();
      const taps = faker.number.int({ min: 2, max: 6 });
      let run = startSeekRun("backward", anchorTime);
      for (let tap = 1; tap < taps; tap += 1) run = extendSeekRun(run, "backward");

      expect(seekRunTarget(run)).toBeCloseTo(anchorTime - taps * SEEK_STEP_SECONDS);
      expect(seekRunSeconds(run)).toBe(taps * SEEK_STEP_SECONDS);
    });

    test("WHEN tapped on the other side THEN a one-step run starts where the old one was heading", () => {
      const anchorTime = anchorInsideALesson();
      const forward: SeekRun = extendSeekRun(startSeekRun("forward", anchorTime), "forward");

      const turned = extendSeekRun(forward, "backward");

      expect(turned).toEqual({
        direction: "backward",
        steps: 1,
        anchorTime: seekRunTarget(forward),
      });
      expect(seekRunTarget(turned)).toBeCloseTo(anchorTime + SEEK_STEP_SECONDS);
    });
  });

  describe("GIVEN the label", () => {
    test("WHEN a run has one step THEN it reads one step's seconds", () => {
      expect(seekRunSeconds(startSeekRun("forward", anchorInsideALesson()))).toBe(
        SEEK_STEP_SECONDS,
      );
    });
  });
});

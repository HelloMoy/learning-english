import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import {
  DEFAULT_SEEK_STEP_SECONDS,
  extendSeekRun,
  parseSeekStepSeconds,
  SEEK_RUN_WINDOW_MS,
  SEEK_STEP_OPTIONS_SECONDS,
  seekRunSeconds,
  seekRunTarget,
  startSeekRun,
  type SeekRun,
} from "./seek-run";

/** Somewhere well inside a lesson, so a backward run never runs into zero. */
function anchorInsideALesson(): number {
  return faker.number.float({ min: 120, max: 3600, fractionDigits: 2 });
}

/** Any of the offered steps, for cases the exact size does not decide. */
function anOfferedStep(): number {
  return faker.helpers.arrayElement(SEEK_STEP_OPTIONS_SECONDS);
}

/** An offered step other than this one, for cases that need two of them. */
function anotherOfferedStep(step: number): number {
  return faker.helpers.arrayElement(SEEK_STEP_OPTIONS_SECONDS.filter((each) => each !== step));
}

describe("seek-run", () => {
  describe("GIVEN the steps the learner may choose", () => {
    test("THEN there are three of them, in ascending menu order", () => {
      expect(SEEK_STEP_OPTIONS_SECONDS).toEqual([3, 5, 10]);
    });

    test("THEN the default is five seconds, and is one of the offered steps", () => {
      expect(DEFAULT_SEEK_STEP_SECONDS).toBe(5);
      expect(SEEK_STEP_OPTIONS_SECONDS).toContain(DEFAULT_SEEK_STEP_SECONDS);
    });

    test("THEN a run lapses after 700 ms", () => {
      expect(SEEK_RUN_WINDOW_MS).toBe(700);
    });
  });

  describe("GIVEN a value read back from storage", () => {
    test.each(SEEK_STEP_OPTIONS_SECONDS)("WHEN it reads %i THEN that step is used", (step) => {
      expect(parseSeekStepSeconds(String(step))).toBe(step);
    });

    // Hardcoded rather than generated: each of these is a distinct way the
    // stored value can be wrong, and the point is that none of them throws.
    // "20" is in the list on purpose: it was an offered step once, so a
    // returning learner can still have it stored.
    test.each([null, "", " ", "abc", "7", "20", "NaN", "Infinity", "-5", "5.5", "05", "10s", "[]"])(
      "WHEN it reads %o THEN the default step is used",
      (stored) => {
        expect(parseSeekStepSeconds(stored)).toBe(DEFAULT_SEEK_STEP_SECONDS);
      },
    );
  });

  describe("GIVEN a double tap starts a run", () => {
    test("WHEN it starts forward THEN it is one step anchored where the video was", () => {
      const anchorTime = anchorInsideALesson();
      const stepSeconds = anOfferedStep();

      const run = startSeekRun("forward", anchorTime, stepSeconds);

      expect(run).toEqual({ direction: "forward", steps: 1, anchorTime, stepSeconds });
    });

    test("WHEN it starts forward THEN the target is one step past the anchor", () => {
      const anchorTime = anchorInsideALesson();
      const stepSeconds = anOfferedStep();

      expect(seekRunTarget(startSeekRun("forward", anchorTime, stepSeconds))).toBeCloseTo(
        anchorTime + stepSeconds,
      );
    });

    test("WHEN it starts backward THEN the target is one step before the anchor", () => {
      const anchorTime = anchorInsideALesson();
      const stepSeconds = anOfferedStep();

      expect(seekRunTarget(startSeekRun("backward", anchorTime, stepSeconds))).toBeCloseTo(
        anchorTime - stepSeconds,
      );
    });
  });

  describe("GIVEN a run in progress", () => {
    test("WHEN tapped on the same side THEN it gains a step and keeps its anchor", () => {
      const anchorTime = anchorInsideALesson();
      const stepSeconds = anOfferedStep();
      const run = startSeekRun("forward", anchorTime, stepSeconds);

      const extended = extendSeekRun(run, "forward", stepSeconds);

      expect(extended).toEqual({ direction: "forward", steps: 2, anchorTime, stepSeconds });
    });

    test("WHEN tapped several times on the same side THEN every seek is counted from the anchor", () => {
      // The whole point of the anchor: a provider that has not yet applied the
      // previous seek must not make this one start from a stale time.
      const anchorTime = anchorInsideALesson();
      const stepSeconds = anOfferedStep();
      const taps = faker.number.int({ min: 2, max: 6 });
      let run = startSeekRun("backward", anchorTime, stepSeconds);
      for (let tap = 1; tap < taps; tap += 1) run = extendSeekRun(run, "backward", stepSeconds);

      expect(seekRunTarget(run)).toBeCloseTo(anchorTime - taps * stepSeconds);
      expect(seekRunSeconds(run)).toBe(taps * stepSeconds);
    });

    test("WHEN the step changes mid-run THEN the run keeps the one it started with", () => {
      const anchorTime = anchorInsideALesson();
      const stepSeconds = anOfferedStep();
      const run = startSeekRun("forward", anchorTime, stepSeconds);

      const extended = extendSeekRun(run, "forward", anotherOfferedStep(stepSeconds));

      expect(extended.stepSeconds).toBe(stepSeconds);
      expect(seekRunSeconds(extended)).toBe(2 * stepSeconds);
    });

    test("WHEN tapped on the other side THEN a one-step run starts where the old one was heading", () => {
      const anchorTime = anchorInsideALesson();
      const stepSeconds = anOfferedStep();
      const forward: SeekRun = extendSeekRun(
        startSeekRun("forward", anchorTime, stepSeconds),
        "forward",
        stepSeconds,
      );

      const turned = extendSeekRun(forward, "backward", stepSeconds);

      expect(turned).toEqual({
        direction: "backward",
        steps: 1,
        anchorTime: seekRunTarget(forward),
        stepSeconds,
      });
      expect(seekRunTarget(turned)).toBeCloseTo(anchorTime + stepSeconds);
    });

    test("WHEN it turns around after the step changed THEN the new run takes the new step", () => {
      // A turn-around starts a *new* run, so it is the one place a freshly
      // chosen step takes effect without waiting for the old run to lapse.
      const anchorTime = anchorInsideALesson();
      const stepSeconds = anOfferedStep();
      const chosen = anotherOfferedStep(stepSeconds);
      const forward = startSeekRun("forward", anchorTime, stepSeconds);

      const turned = extendSeekRun(forward, "backward", chosen);

      expect(turned.stepSeconds).toBe(chosen);
      expect(seekRunTarget(turned)).toBeCloseTo(anchorTime + stepSeconds - chosen);
    });
  });

  describe("GIVEN the label", () => {
    test("WHEN a run has one step THEN it reads that run's own step", () => {
      const stepSeconds = anOfferedStep();

      expect(seekRunSeconds(startSeekRun("forward", anchorInsideALesson(), stepSeconds))).toBe(
        stepSeconds,
      );
    });
  });
});

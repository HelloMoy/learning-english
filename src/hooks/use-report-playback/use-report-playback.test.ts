import { LessonId } from "@/domain/entities/ids/ids";
import { givenProductAnalytics } from "@/test-setup/product-analytics/product-analytics";

import { faker } from "@faker-js/faker";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { SEEK_SETTLE_MS, useReportPlayback, type ReportedPlayer } from "./use-report-playback";

/**
 * Guards the `product-analytics` capability's named playback events: what a
 * click on the player cannot say — where in the video, how fast, and whether
 * the learner reached the end.
 */

/** A player whose clock and speed the test moves by hand. */
function makePlayer(
  currentTime = 0,
  playbackRate = 1,
): { -readonly [K in keyof ReportedPlayer]: number } {
  return { currentTime, playbackRate };
}

function renderReport(player: ReportedPlayer) {
  const lessonId = LessonId.parse(faker.string.uuid());
  const { result } = renderHook(() => useReportPlayback({ lessonId, player }));
  return { report: result.current, lessonId };
}

const settleSeek = () => act(() => vi.advanceTimersByTime(SEEK_SETTLE_MS));

describe("useReportPlayback", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test("WHEN playback starts THEN it is reported with where in the lesson it started", () => {
    const client = givenProductAnalytics("granted");
    const { report, lessonId } = renderReport(makePlayer(83.7));

    report.handlePlay();

    expect(client.capture).toHaveBeenCalledExactlyOnceWith("video_played", {
      lessonId,
      positionSeconds: 83,
    });
  });

  test("WHEN playback pauses THEN it is reported with where it stopped", () => {
    const client = givenProductAnalytics("granted");
    const { report, lessonId } = renderReport(makePlayer(240.2));

    report.handlePause();

    expect(client.capture).toHaveBeenCalledExactlyOnceWith("video_paused", {
      lessonId,
      positionSeconds: 240,
    });
  });

  test("WHEN the learner jumps THEN one seek is reported, from where they were to where they landed", () => {
    const client = givenProductAnalytics("granted");
    const player = makePlayer(120);
    const { report, lessonId } = renderReport(player);
    report.handleTimeUpdate();

    player.currentTime = 30;
    report.handleSeeking();
    settleSeek();

    expect(client.capture).toHaveBeenCalledExactlyOnceWith("video_seeked", {
      lessonId,
      fromSeconds: 120,
      toSeconds: 30,
    });
  });

  test("WHEN the learner drags the slider THEN the whole drag is one seek, not one per step", () => {
    const client = givenProductAnalytics("granted");
    const player = makePlayer(10);
    const { report, lessonId } = renderReport(player);
    report.handleTimeUpdate();

    for (const step of [40, 90, 150, 200]) {
      player.currentTime = step;
      report.handleSeeking();
      report.handleTimeUpdate();
    }
    settleSeek();

    expect(client.capture).toHaveBeenCalledExactlyOnceWith("video_seeked", {
      lessonId,
      fromSeconds: 10,
      toSeconds: 200,
    });
  });

  test("WHEN the learner seeks twice, apart THEN each seek starts from where the last one landed", () => {
    const client = givenProductAnalytics("granted");
    const player = makePlayer(10);
    const { report, lessonId } = renderReport(player);
    report.handleTimeUpdate();
    player.currentTime = 60;
    report.handleSeeking();
    settleSeek();
    report.handleTimeUpdate();

    player.currentTime = 20;
    report.handleSeeking();
    settleSeek();

    expect(client.capture).toHaveBeenLastCalledWith("video_seeked", {
      lessonId,
      fromSeconds: 60,
      toSeconds: 20,
    });
  });

  test("WHEN the speed changes THEN the new rate is reported", () => {
    const client = givenProductAnalytics("granted");
    const { report, lessonId } = renderReport(makePlayer(0, 1.5));

    report.handleRateChange();

    expect(client.capture).toHaveBeenCalledExactlyOnceWith("video_speed_changed", {
      lessonId,
      rate: 1.5,
    });
  });

  test("WHEN the video reaches its end THEN that is reported", () => {
    const client = givenProductAnalytics("granted");
    const { report, lessonId } = renderReport(makePlayer(600));

    report.handleEnded();

    expect(client.capture).toHaveBeenCalledExactlyOnceWith("video_ended", { lessonId });
  });
});

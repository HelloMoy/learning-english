import { LessonId } from "@/domain/entities/ids/ids";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { findContinueTarget, type ContinueVideo, type LearnerProgress } from "./continue-target";

const MINUTE = 60;
const VIDEO_SECONDS = 10 * MINUTE;

const videosOf = (count: number): ContinueVideo[] =>
  Array.from({ length: count }, () => ({
    id: LessonId.parse(faker.string.uuid()),
    durationSeconds: VIDEO_SECONDS,
  }));

/** Progress over 1-based video numbers, as the capability's scenarios word it. */
const progressOver = (
  videos: ReadonlyArray<ContinueVideo>,
  {
    finished = [],
    partlyWatched = [],
    lastOpened,
  }: { finished?: number[]; partlyWatched?: number[]; lastOpened?: number },
): LearnerProgress => ({
  completedLessonIds: new Set(finished.map((number) => videos[number - 1]!.id)),
  positions: new Map(partlyWatched.map((number) => [videos[number - 1]!.id, 4 * MINUTE])),
  ...(lastOpened === undefined ? {} : { lastOpenedLessonId: videos[lastOpened - 1]!.id }),
});

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, offset) => from + offset);

describe("findContinueTarget", () => {
  describe("GIVEN a learner going in order", () => {
    test("WHEN videos 1–5 are finished AND video 5 was opened last THEN video 6 is continued", () => {
      // Arrange
      const videos = videosOf(10);

      // Act
      const target = findContinueTarget(
        videos,
        progressOver(videos, { finished: range(1, 5), lastOpened: 5 }),
      );

      // Assert
      expect(target).toEqual({ kind: "continue", index: 5 });
    });
  });

  describe("GIVEN the last opened video is finished", () => {
    test("WHEN the target is found THEN the next unfinished video is continued, never the finished one", () => {
      // Arrange
      const videos = videosOf(6);

      // Act
      const target = findContinueTarget(
        videos,
        progressOver(videos, { finished: [1, 2, 3], lastOpened: 3 }),
      );

      // Assert
      expect(target).toEqual({ kind: "continue", index: 3 });
    });

    test("WHEN it was watched to its end without a mark THEN it still counts as finished AND the next video is continued", () => {
      // Arrange
      const videos = videosOf(4);
      const progress: LearnerProgress = {
        completedLessonIds: new Set(),
        positions: new Map([[videos[1]!.id, VIDEO_SECONDS]]),
        lastOpenedLessonId: videos[1]!.id,
      };

      // Act
      const target = findContinueTarget(videos, progress);

      // Assert
      expect(target).toEqual({ kind: "continue", index: 2 });
    });
  });

  describe("GIVEN a partly watched last opened video", () => {
    test("WHEN videos 25–27 are finished AND video 7 was opened last THEN video 7 itself is continued", () => {
      // Arrange
      const videos = videosOf(30);

      // Act
      const target = findContinueTarget(
        videos,
        progressOver(videos, { finished: range(25, 27), partlyWatched: [7], lastOpened: 7 }),
      );

      // Assert
      expect(target).toEqual({ kind: "continue", index: 6 });
    });
  });

  describe("GIVEN a learner who returned to the start", () => {
    test("WHEN videos 25–27 AND then 1–2 are finished with video 2 opened last THEN video 3 is continued, not video 28", () => {
      // Arrange
      const videos = videosOf(30);

      // Act
      const target = findContinueTarget(
        videos,
        progressOver(videos, { finished: [...range(25, 27), 1, 2], lastOpened: 2 }),
      );

      // Assert
      expect(target).toEqual({ kind: "continue", index: 2 });
    });
  });

  describe("GIVEN no usable record", () => {
    test("WHEN the record names a video outside the list THEN the furthest progress anchors AND video 28 is continued", () => {
      // Arrange
      const videos = videosOf(30);
      const progress = {
        ...progressOver(videos, { finished: range(25, 27) }),
        lastOpenedLessonId: LessonId.parse(faker.string.uuid()),
      };

      // Act
      const target = findContinueTarget(videos, progress);

      // Assert
      expect(target).toEqual({ kind: "continue", index: 27 });
    });

    test("WHEN video 1 is finished AND video 7 is partly watched THEN video 7 is continued", () => {
      // Arrange
      const videos = videosOf(10);

      // Act
      const target = findContinueTarget(
        videos,
        progressOver(videos, { finished: [1], partlyWatched: [7] }),
      );

      // Assert
      expect(target).toEqual({ kind: "continue", index: 6 });
    });
  });

  describe("GIVEN nothing unfinished after the anchor", () => {
    test("WHEN the last video is finished and opened last with a gap from video 3 THEN video 3 is continued", () => {
      // Arrange
      const videos = videosOf(30);

      // Act
      const target = findContinueTarget(
        videos,
        progressOver(videos, { finished: [1, 2, 30], lastOpened: 30 }),
      );

      // Assert
      expect(target).toEqual({ kind: "continue", index: 2 });
    });
  });

  describe("GIVEN a whole course laid out lesson after lesson", () => {
    test("WHEN the finished final video of the first lesson was opened last THEN the next lesson's first video is continued", () => {
      // Arrange
      const firstLesson = videosOf(3);
      const secondLesson = videosOf(4);
      const course = [...firstLesson, ...secondLesson];

      // Act
      const target = findContinueTarget(
        course,
        progressOver(course, { finished: [1, 2, 3], lastOpened: 3 }),
      );

      // Assert
      expect(target).toEqual({ kind: "continue", index: firstLesson.length });
    });
  });

  describe("GIVEN a list with no progress and no record", () => {
    test("WHEN the target is found THEN its first video is started", () => {
      // Arrange
      const videos = videosOf(5);

      // Act
      const target = findContinueTarget(videos, progressOver(videos, {}));

      // Assert
      expect(target).toEqual({ kind: "start", index: 0 });
    });
  });

  describe("GIVEN every video finished", () => {
    test("WHEN the target is found THEN the first video is watched again", () => {
      // Arrange
      const videos = videosOf(4);

      // Act
      const target = findContinueTarget(
        videos,
        progressOver(videos, { finished: range(1, 4), lastOpened: 4 }),
      );

      // Assert
      expect(target).toEqual({ kind: "rewatch", index: 0 });
    });
  });

  describe("GIVEN an empty list", () => {
    test("WHEN the target is found THEN there is nothing to continue", () => {
      // Act
      const target = findContinueTarget([], {
        completedLessonIds: new Set(),
        positions: new Map(),
      });

      // Assert
      expect(target).toEqual({ kind: "none" });
    });
  });
});

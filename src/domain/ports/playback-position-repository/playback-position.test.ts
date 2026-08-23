import { LessonId } from "@/domain/entities/ids/ids";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { PlaybackPosition } from "./playback-position";

const fixturePosition = (overrides?: { seconds?: number }) =>
  PlaybackPosition.parse({
    lessonId: LessonId.parse(faker.string.uuid()),
    seconds: overrides?.seconds ?? faker.number.int({ min: 0, max: 3600 }),
  });

describe("PlaybackPosition", () => {
  describe("WHEN parsed with a non-negative seconds value", () => {
    test("THEN it returns the parsed object", () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      const result = PlaybackPosition.parse({ lessonId, seconds: 42 });

      expect(result).toEqual({ lessonId, seconds: 42 });
    });
  });

  describe("WHEN parsed with seconds = 0", () => {
    test("THEN it accepts the value (zero is valid)", () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      const result = PlaybackPosition.parse({ lessonId, seconds: 0 });

      expect(result.seconds).toBe(0);
    });
  });

  describe("WHEN parsed with a negative seconds value", () => {
    test("THEN parsing fails with a Zod error", () => {
      const lessonId = LessonId.parse(faker.string.uuid());

      expect(() => PlaybackPosition.parse({ lessonId, seconds: -1 })).toThrow();
    });
  });

  describe("WHEN parsed with NaN or non-finite seconds", () => {
    test("THEN parsing fails with a Zod error", () => {
      const lessonId = LessonId.parse(faker.string.uuid());

      expect(() => PlaybackPosition.parse({ lessonId, seconds: Number.NaN })).toThrow();
      expect(() =>
        PlaybackPosition.parse({ lessonId, seconds: Number.POSITIVE_INFINITY }),
      ).toThrow();
    });
  });

  describe("WHEN a valid position is given", () => {
    test("THEN it round-trips through parse() losslessly", () => {
      const position = fixturePosition();

      const reparsed = PlaybackPosition.parse(position);

      expect(reparsed).toEqual(position);
    });
  });
});

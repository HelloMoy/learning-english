import { LessonId } from "@/domain/entities/ids/ids";
import { learnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import { faker } from "@faker-js/faker";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  LearnerStorePlaybackPositionRepository,
  SERVER_WRITE_INTERVAL_MS,
  type PositionRequests,
} from "./learner-store-playback-position-repository";

const aLesson = () => LessonId.parse(faker.string.uuid());

let record: ReturnType<typeof vi.fn<PositionRequests["record"]>>;
let beacon: ReturnType<typeof vi.fn<PositionRequests["beacon"]>>;
let positions: LearnerStorePlaybackPositionRepository;

beforeEach(() => {
  vi.useFakeTimers();
  record = vi.fn<PositionRequests["record"]>(async () => true);
  beacon = vi.fn<PositionRequests["beacon"]>(() => true);
  positions = new LearnerStorePlaybackPositionRepository({ record, beacon });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("LearnerStorePlaybackPositionRepository", () => {
  test("WHEN the learner has a saved position THEN it is read from the store", async () => {
    const lesson = aLesson();
    givenLearner.positions({ [lesson]: 61 });

    expect(await positions.getPosition(lesson)).toBe(61);
    expect(await positions.getPosition(aLesson())).toBeNull();
  });

  test("WHEN a position is set THEN every reader sees it at once", async () => {
    const lesson = aLesson();

    await positions.setPosition(lesson, 12);

    expect(learnerStore.getState().positions.get(lesson)).toBe(12);
  });

  test("WHEN positions arrive every 1.5 s for 10 s THEN the server is written once in that window", async () => {
    const lesson = aLesson();

    for (let second = 0; second < 10; second += 1.5) {
      await positions.setPosition(lesson, second);
      await vi.advanceTimersByTimeAsync(1500);
    }

    expect(record.mock.calls.filter(([id]) => id === lesson).length).toBeLessThanOrEqual(2);
    expect(record).toHaveBeenNthCalledWith(1, lesson, 0);
  });

  test("WHEN the window closes THEN the latest position, not a stale one, is written", async () => {
    const lesson = aLesson();
    await positions.setPosition(lesson, 1);
    await positions.setPosition(lesson, 5);
    await positions.setPosition(lesson, 9);

    await vi.advanceTimersByTimeAsync(SERVER_WRITE_INTERVAL_MS);

    expect(record).toHaveBeenLastCalledWith(lesson, 9);
  });

  test("WHEN flushed THEN a pending position is written at once", async () => {
    const lesson = aLesson();
    await positions.setPosition(lesson, 1);
    await positions.setPosition(lesson, 7);

    await positions.flush();

    expect(record).toHaveBeenLastCalledWith(lesson, 7);
    await vi.advanceTimersByTimeAsync(SERVER_WRITE_INTERVAL_MS);
    expect(record).toHaveBeenCalledTimes(2);
  });

  test("WHEN flushed with nothing pending THEN nothing is sent", async () => {
    await positions.flush();

    expect(record).not.toHaveBeenCalled();
  });

  test("WHEN the page is hidden THEN pending positions leave by beacon", async () => {
    const lesson = aLesson();
    await positions.setPosition(lesson, 1);
    await positions.setPosition(lesson, 4);

    positions.flushWithBeacon();

    expect(beacon).toHaveBeenCalledWith({ lessonId: lesson, seconds: 4 });
    await vi.advanceTimersByTimeAsync(SERVER_WRITE_INTERVAL_MS);
    expect(record).toHaveBeenCalledTimes(1);
  });

  test("WHEN lessons are written together THEN each keeps its own window", async () => {
    const [first, second] = [aLesson(), aLesson()];

    await positions.setPosition(first, 3);
    await positions.setPosition(second, 8);

    expect(record).toHaveBeenCalledWith(first, 3);
    expect(record).toHaveBeenCalledWith(second, 8);
  });
});

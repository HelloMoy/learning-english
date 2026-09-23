import { LessonId } from "@/domain/entities/ids/ids";
import { EMPTY_LEARNER_SNAPSHOT } from "@/lib/learner-snapshot/learner-snapshot";
import { learnerStore, seedLearnerStore } from "@/lib/learner-store/learner-store";

import { faker } from "@faker-js/faker";
import { describe, expect, test, vi } from "vitest";

import { LearnerStoreProgressTracker } from "./learner-store-progress-tracker";

const aLesson = () => LessonId.parse(faker.string.uuid());

const trackerWith = (answers: { mark?: boolean; unmark?: boolean } = {}) => {
  const mark = vi.fn(async () => answers.mark ?? true);
  const unmark = vi.fn(async () => answers.unmark ?? true);
  return { tracker: new LearnerStoreProgressTracker({ mark, unmark }), mark, unmark };
};

describe("LearnerStoreProgressTracker", () => {
  test("WHEN a lesson is in the learner's snapshot THEN it reads as complete", async () => {
    const lesson = aLesson();
    seedLearnerStore({ ...EMPTY_LEARNER_SNAPSHOT, completedLessonIds: [lesson] });

    expect(await trackerWith().tracker.isComplete(lesson)).toBe(true);
    expect(await trackerWith().tracker.isComplete(aLesson())).toBe(false);
  });

  test("WHEN marked THEN the server is asked and the store shows it", async () => {
    const { tracker, mark } = trackerWith();
    const lesson = aLesson();

    await tracker.markComplete(lesson);

    expect(mark).toHaveBeenCalledWith(lesson);
    expect(learnerStore.getState().completed.has(lesson)).toBe(true);
  });

  test("WHEN the server refuses a mark THEN the lesson reads as incomplete again", async () => {
    const { tracker } = trackerWith({ mark: false });
    const lesson = aLesson();

    await tracker.markComplete(lesson);

    expect(await tracker.isComplete(lesson)).toBe(false);
  });

  test("WHEN un-marked THEN the server is asked and the mark is gone", async () => {
    const lesson = aLesson();
    seedLearnerStore({ ...EMPTY_LEARNER_SNAPSHOT, completedLessonIds: [lesson] });
    const { tracker, unmark } = trackerWith();

    await tracker.unmarkComplete(lesson);

    expect(unmark).toHaveBeenCalledWith(lesson);
    expect(await tracker.isComplete(lesson)).toBe(false);
  });

  test("WHEN the server refuses an un-mark THEN the mark comes back", async () => {
    const lesson = aLesson();
    seedLearnerStore({ ...EMPTY_LEARNER_SNAPSHOT, completedLessonIds: [lesson] });
    const { tracker } = trackerWith({ unmark: false });

    await tracker.unmarkComplete(lesson);

    expect(await tracker.isComplete(lesson)).toBe(true);
  });

  test("WHEN un-marking one lesson THEN the others stay complete", async () => {
    const [kept, removed] = [aLesson(), aLesson()];
    seedLearnerStore({ ...EMPTY_LEARNER_SNAPSHOT, completedLessonIds: [kept, removed] });

    await trackerWith().tracker.unmarkComplete(removed);

    expect(learnerStore.getState().completed.has(kept)).toBe(true);
  });
});

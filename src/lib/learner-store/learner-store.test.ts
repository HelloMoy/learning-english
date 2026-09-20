import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { EMPTY_LEARNER_SNAPSHOT } from "@/lib/learner-snapshot/learner-snapshot";

import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { learnerStore, resetLearnerStore, seedLearnerStore, writeThrough } from "./learner-store";

const profile = LearnerProfile.parse({ name: "Ana", avatar: { kind: "initials" } });

beforeEach(() => {
  resetLearnerStore();
});

describe("seedLearnerStore", () => {
  test("WHEN seeded THEN the snapshot is held as sets and maps", () => {
    const [done, watching] = [faker.string.uuid(), faker.string.uuid()];

    seedLearnerStore({
      ...EMPTY_LEARNER_SNAPSHOT,
      profile,
      completedLessonIds: [done],
      positions: { [watching]: 12 },
    });

    const state = learnerStore.getState();
    expect(state.completed.has(done)).toBe(true);
    expect(state.positions.get(watching)).toBe(12);
    expect(state.profile).toEqual(profile);
    expect(state.isSeeded).toBe(true);
  });

  test("WHEN the snapshot carries rewards THEN tickets and claims are held as sets", () => {
    const lessonId = faker.string.uuid();

    seedLearnerStore({
      ...EMPTY_LEARNER_SNAPSHOT,
      earnedTicketLessonIds: [lessonId],
      claimedPrizeModuleSlugs: ["2-vowels"],
    });

    expect(learnerStore.getState().earnedTickets.has(lessonId)).toBe(true);
    expect(learnerStore.getState().claimedPrizes.has("2-vowels")).toBe(true);
  });

  test("WHEN nothing changes THEN readers see the very same collections", () => {
    seedLearnerStore(EMPTY_LEARNER_SNAPSHOT);
    const before = learnerStore.getState().completed;

    learnerStore.setState({ profile });

    expect(learnerStore.getState().completed).toBe(before);
  });

  test("WHEN there is no window, as on the server, THEN nothing is seeded", () => {
    vi.stubGlobal("window", undefined);
    try {
      seedLearnerStore({ ...EMPTY_LEARNER_SNAPSHOT, profile });
    } finally {
      vi.unstubAllGlobals();
    }

    expect(learnerStore.getState().isSeeded).toBe(false);
    expect(learnerStore.getState().profile).toBeNull();
  });
});

describe("writeThrough", () => {
  test("WHEN the server accepts THEN the change stays and it reports success", async () => {
    const lessonId = faker.string.uuid();

    const accepted = await writeThrough(
      (state) => ({ completed: new Set([...state.completed, lessonId]) }),
      async () => true,
    );

    expect(accepted).toBe(true);
    expect(learnerStore.getState().completed.has(lessonId)).toBe(true);
  });

  test("WHEN applied THEN readers see the change before the server answers", async () => {
    const lessonId = faker.string.uuid();
    let answer: (value: boolean) => void = () => {};

    const pending = writeThrough(
      (state) => ({ completed: new Set([...state.completed, lessonId]) }),
      () => new Promise((resolve) => (answer = resolve)),
    );

    expect(learnerStore.getState().completed.has(lessonId)).toBe(true);
    answer(true);
    await pending;
  });

  test.each([
    ["refuses", async () => false],
    ["fails", async () => Promise.reject(new Error("offline"))],
  ])(
    "WHEN the server %s THEN the touched slice is restored and it reports failure",
    async (_, request) => {
      seedLearnerStore({ ...EMPTY_LEARNER_SNAPSHOT, profile });
      const before = learnerStore.getState().completed;

      const accepted = await writeThrough(
        (state) => ({ completed: new Set([...state.completed, faker.string.uuid()]) }),
        request,
      );

      expect(accepted).toBe(false);
      expect(learnerStore.getState().completed).toBe(before);
      expect(learnerStore.getState().profile).toEqual(profile);
    },
  );

  test.each([
    ["refuses", async () => false],
    ["fails", async () => Promise.reject(new Error("offline"))],
  ])("WHEN the server %s THEN the rollback is reported", async (_, request) => {
    const { reportHandledError, writeThroughReporting } = await withReportSpy();

    await writeThroughReporting(() => ({ completed: new Set([faker.string.uuid()]) }), request);

    expect(reportHandledError).toHaveBeenCalledWith(expect.any(Error), {
      where: "learner-store",
      slices: "completed",
    });
  });

  test("WHEN the server accepts THEN nothing is reported", async () => {
    const { reportHandledError, writeThroughReporting } = await withReportSpy();

    await writeThroughReporting(
      () => ({ completed: new Set() }),
      async () => true,
    );

    expect(reportHandledError).not.toHaveBeenCalled();
  });
});

/**
 * The global test setup has already loaded this module with the real
 * reporter, so a file-level mock arrives too late: load a fresh copy that
 * sees the spy.
 */
async function withReportSpy() {
  const reportHandledError = vi.fn();
  vi.resetModules();
  vi.doMock("@/lib/report-handled-error/report-handled-error", () => ({ reportHandledError }));
  const { writeThrough: writeThroughReporting } = await import("./learner-store");
  vi.doUnmock("@/lib/report-handled-error/report-handled-error");
  return { reportHandledError, writeThroughReporting };
}

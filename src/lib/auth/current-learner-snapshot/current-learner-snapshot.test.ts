import { getDatabase } from "@/adapters/persistence/turso/database/database";
import { loadLearnerSnapshot } from "@/adapters/persistence/turso/learner-snapshot/learner-snapshot";
import { getAuth } from "@/lib/auth/auth";
import { EMPTY_LEARNER_SNAPSHOT } from "@/lib/learner-snapshot/learner-snapshot";

import { beforeEach, describe, expect, test, vi } from "vitest";

import { currentLearnerSnapshot } from "./current-learner-snapshot";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("@/lib/auth/auth", () => ({ getAuth: vi.fn() }));
vi.mock("@/adapters/persistence/turso/database/database", () => ({
  getDatabase: vi.fn(() => "db"),
}));
vi.mock("@/adapters/persistence/turso/learner-snapshot/learner-snapshot", () => ({
  loadLearnerSnapshot: vi.fn(),
}));

const getSession = vi.fn();

beforeEach(() => {
  vi.mocked(getAuth).mockReturnValue({ api: { getSession } } as never);
  vi.mocked(loadLearnerSnapshot).mockReset();
});

describe("currentLearnerSnapshot", () => {
  test("WHEN the request is signed in THEN that learner's snapshot is loaded", async () => {
    getSession.mockResolvedValue({ user: { id: "learner-1" } });
    vi.mocked(loadLearnerSnapshot).mockResolvedValue(EMPTY_LEARNER_SNAPSHOT);

    await expect(currentLearnerSnapshot()).resolves.toBe(EMPTY_LEARNER_SNAPSHOT);
    expect(loadLearnerSnapshot).toHaveBeenCalledWith(getDatabase(), "learner-1");
  });

  test("WHEN it is not THEN there is no snapshot and nothing is read", async () => {
    getSession.mockResolvedValue(null);

    await expect(currentLearnerSnapshot()).resolves.toBeNull();
    expect(loadLearnerSnapshot).not.toHaveBeenCalled();
  });
});

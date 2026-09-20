// @vitest-environment node
import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";
import { getDatabase } from "@/adapters/persistence/turso/database/database";
import { loadLearnerSnapshot } from "@/adapters/persistence/turso/learner-snapshot/learner-snapshot";
import { getAuth } from "@/lib/auth/auth";
import {
  DOCKER_AVAILABLE,
  insertTestUser,
  startLibsqlContainer,
  type StartedLibsql,
} from "@/test-setup/libsql-container/libsql-container";

import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

import { POST } from "./route";

vi.mock("@/lib/auth/auth", () => ({ getAuth: vi.fn() }));
vi.mock("@/adapters/persistence/turso/database/database", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getDatabase: vi.fn(),
}));

/**
 * Guards `learner-state` § "Playback writes … flushed on exit": the page-hide
 * beacon lands here, carrying only a body and the session cookie.
 */
const LESSON_ID = contentCatalog.lessonRows[0]!.id;
const getSession = vi.fn();

const beacon = (body: string) =>
  POST(
    new Request("http://localhost:3000/api/learner/playback-position", { method: "POST", body }),
  );

describe.skipIf(!DOCKER_AVAILABLE)("POST /api/learner/playback-position (integration)", () => {
  let libsql: StartedLibsql;
  let learnerId: string;

  beforeAll(async () => {
    libsql = await startLibsqlContainer();
    vi.mocked(getDatabase).mockReturnValue(libsql.database);
    vi.mocked(getAuth).mockReturnValue({ api: { getSession } } as never);
  }, 180_000);

  afterAll(async () => {
    await libsql?.stop();
  });

  beforeEach(async () => {
    learnerId = await insertTestUser(libsql.database);
    getSession.mockResolvedValue({ user: { id: learnerId } });
  });

  test("a valid beacon saves the position for the signed-in learner", async () => {
    const response = await beacon(JSON.stringify({ lessonId: LESSON_ID, seconds: 77.5 }));

    expect(response.status).toBe(204);
    expect((await loadLearnerSnapshot(libsql.database, learnerId)).positions).toEqual({
      [LESSON_ID]: 77.5,
    });
  });

  test("a beacon without a session is refused and writes nothing", async () => {
    getSession.mockResolvedValue(null);

    const response = await beacon(JSON.stringify({ lessonId: LESSON_ID, seconds: 5 }));

    expect(response.status).toBe(401);
    expect((await loadLearnerSnapshot(libsql.database, learnerId)).positions).toEqual({});
  });

  test.each([
    ["not JSON", "{not json"],
    ["a negative position", JSON.stringify({ lessonId: LESSON_ID, seconds: -1 })],
    ["no lesson", JSON.stringify({ seconds: 5 })],
  ])("a body with %s is refused as a bad request", async (_, body) => {
    expect((await beacon(body)).status).toBe(400);
  });
});

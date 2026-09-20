import { getAuth } from "@/lib/auth/auth";

import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { learnerActionClient } from "./safe-action";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers({ cookie: "c=1" })) }));
vi.mock("@/lib/auth/auth", () => ({ getAuth: vi.fn() }));

const getSession = vi.fn();

const whoAmI = learnerActionClient
  .inputSchema(z.object({}))
  .action(async ({ ctx }) => ({ learnerId: ctx.learnerId }));

beforeEach(() => {
  vi.mocked(getAuth).mockReturnValue({ api: { getSession } } as never);
  getSession.mockReset();
});

/**
 * Guards `learner-state` § "The learner id comes only from the session".
 */
describe("learnerActionClient", () => {
  test("WHEN the request carries a session THEN the action runs as that learner", async () => {
    const learnerId = faker.string.uuid();
    getSession.mockResolvedValue({ user: { id: learnerId } });

    const result = await whoAmI({});

    expect(result?.data).toEqual({ learnerId });
  });

  test("WHEN there is no session THEN the action body never runs and a server error comes back", async () => {
    getSession.mockResolvedValue(null);

    const result = await whoAmI({});

    expect(result?.data).toBeUndefined();
    expect(result?.serverError).toBeDefined();
  });

  test("WHEN checking THEN the session is read from the request's own headers", async () => {
    getSession.mockResolvedValue(null);

    await whoAmI({});

    expect(getSession.mock.calls[0][0].headers.get("cookie")).toBe("c=1");
  });
});

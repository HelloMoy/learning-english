import { redirect } from "@/i18n/navigation";
import { getAuth } from "@/lib/auth/auth";

import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { requireLearnerSession } from "./require-learner-session";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers({ cookie: "c=1" })) }));
vi.mock("@/lib/auth/auth", () => ({ getAuth: vi.fn() }));

const getSession = vi.fn();

beforeEach(() => {
  vi.mocked(getAuth).mockReturnValue({ api: { getSession } } as never);
  vi.mocked(redirect).mockClear();
  getSession.mockReset();
});

describe("requireLearnerSession", () => {
  test("WHEN the session is valid THEN it is returned and nothing redirects", async () => {
    const session = { user: { id: faker.string.uuid() }, session: { id: faker.string.uuid() } };
    getSession.mockResolvedValue(session);

    await expect(requireLearnerSession("es")).resolves.toBe(session);
    expect(redirect).not.toHaveBeenCalled();
  });

  test("WHEN the cookie does not resolve to a session THEN the learner is sent to sign-in in their locale", async () => {
    getSession.mockResolvedValue(null);

    await requireLearnerSession("pt");

    expect(redirect).toHaveBeenCalledWith({ href: "/sign-in", locale: "pt" });
  });

  test("WHEN checking THEN the request headers are what the session is read from", async () => {
    getSession.mockResolvedValue(null);

    await requireLearnerSession("en");

    expect(getSession.mock.calls[0][0].headers.get("cookie")).toBe("c=1");
  });
});

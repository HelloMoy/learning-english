import { redirect } from "@/i18n/navigation";
import { getAuth } from "@/lib/auth/auth";

import { beforeEach, describe, expect, test, vi } from "vitest";

import { redirectSignedInLearner } from "./redirect-signed-in-learner";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("@/lib/auth/auth", () => ({ getAuth: vi.fn() }));

const getSession = vi.fn();

beforeEach(() => {
  vi.mocked(getAuth).mockReturnValue({ api: { getSession } } as never);
  vi.mocked(redirect).mockClear();
});

describe("redirectSignedInLearner", () => {
  test("WHEN the learner already has a session THEN the account page sends them on", async () => {
    getSession.mockResolvedValue({ user: { id: "u" } });

    await redirectSignedInLearner("es", "/achievements");

    expect(redirect).toHaveBeenCalledWith({ href: "/achievements", locale: "es" });
  });

  test("WHEN there is no session THEN the account page renders", async () => {
    getSession.mockResolvedValue(null);

    await redirectSignedInLearner("en", "/learning");

    expect(redirect).not.toHaveBeenCalled();
  });
});

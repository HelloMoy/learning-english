import { getAuth } from "@/lib/auth/auth";

import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { currentAccount } from "./current-account";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("@/lib/auth/auth", () => ({ getAuth: vi.fn() }));

const getSession = vi.fn();
const listUserAccounts = vi.fn();

const anAccountRow = (providerId: string) => ({ id: faker.string.uuid(), providerId });

beforeEach(() => {
  vi.mocked(getAuth).mockReturnValue({ api: { getSession, listUserAccounts } } as never);
  getSession.mockReset();
  listUserAccounts.mockReset();
});

describe("currentAccount", () => {
  test("WHEN there is no session THEN there is no account and nothing else is read", async () => {
    getSession.mockResolvedValue(null);

    await expect(currentAccount()).resolves.toBeNull();
    expect(listUserAccounts).not.toHaveBeenCalled();
  });

  test("WHEN the learner signed up with a password THEN password is the only sign-in method", async () => {
    const name = faker.person.fullName();
    const email = faker.internet.email();
    getSession.mockResolvedValue({ user: { name, email } });
    listUserAccounts.mockResolvedValue([anAccountRow("credential")]);

    await expect(currentAccount()).resolves.toEqual({
      name,
      email,
      signInMethods: ["password"],
    });
  });

  test("WHEN the learner only ever used Google THEN google is the only sign-in method", async () => {
    getSession.mockResolvedValue({ user: { name: "Ana", email: "ana@example.com" } });
    listUserAccounts.mockResolvedValue([anAccountRow("google")]);

    await expect(currentAccount()).resolves.toMatchObject({ signInMethods: ["google"] });
  });

  test("WHEN both are linked THEN both sign-in methods are reported, password first", async () => {
    getSession.mockResolvedValue({ user: { name: "Ana", email: "ana@example.com" } });
    listUserAccounts.mockResolvedValue([anAccountRow("google"), anAccountRow("credential")]);

    await expect(currentAccount()).resolves.toMatchObject({
      signInMethods: ["password", "google"],
    });
  });

  test("WHEN a provider this app does not offer is linked THEN it is left out", async () => {
    getSession.mockResolvedValue({ user: { name: "Ana", email: "ana@example.com" } });
    listUserAccounts.mockResolvedValue([anAccountRow("credential"), anAccountRow("github")]);

    await expect(currentAccount()).resolves.toMatchObject({ signInMethods: ["password"] });
  });

  test("WHEN the account carries no name THEN the name is empty rather than missing", async () => {
    getSession.mockResolvedValue({ user: { email: "ana@example.com" } });
    listUserAccounts.mockResolvedValue([anAccountRow("credential")]);

    await expect(currentAccount()).resolves.toMatchObject({ name: "" });
  });
});

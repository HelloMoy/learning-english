import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";

import { faker } from "@faker-js/faker";
import { describe, expect, test, vi } from "vitest";

import { BrowserLocalStorageLearnerProfileRepository } from "./browser-local-storage-learner-profile-repository";

const STORAGE_KEY = "learning-english:learner-profile";

/** A `Storage` backed by a `Map`, driven through the adapter's injection seam. */
function makeMemoryStorage(initial?: Record<string, string>): Storage {
  const entries = new Map<string, string>(Object.entries(initial ?? {}));
  return {
    get length() {
      return entries.size;
    },
    clear: () => entries.clear(),
    getItem: (key: string) => entries.get(key) ?? null,
    key: (index: number) => [...entries.keys()][index] ?? null,
    removeItem: (key: string) => {
      entries.delete(key);
    },
    setItem: (key: string, value: string) => {
      entries.set(key, value);
    },
  };
}

const buildProfile = () =>
  LearnerProfile.parse({
    name: faker.person.fullName(),
    avatar: { kind: "illustration", id: "echo" },
  });

describe("BrowserLocalStorageLearnerProfileRepository", () => {
  describe("GIVEN a profile was saved", () => {
    test("WHEN `get` is called THEN the same profile comes back", async () => {
      // Arrange
      const repo = new BrowserLocalStorageLearnerProfileRepository({
        localStorage: makeMemoryStorage(),
      });
      const profile = buildProfile();

      // Act
      await repo.set(profile);
      const result = await repo.get();

      // Assert
      expect(result).toEqual(profile);
    });

    test("WHEN saved THEN it uses the namespaced key", async () => {
      // Arrange
      const storage = makeMemoryStorage();
      const repo = new BrowserLocalStorageLearnerProfileRepository({ localStorage: storage });

      // Act
      await repo.set(buildProfile());

      // Assert
      expect(storage.getItem(STORAGE_KEY)).not.toBeNull();
    });
  });

  describe("GIVEN nothing was ever saved", () => {
    test("WHEN `get` is called THEN it resolves to `null`", async () => {
      // Arrange
      const repo = new BrowserLocalStorageLearnerProfileRepository({
        localStorage: makeMemoryStorage(),
      });

      // Act + Assert
      await expect(repo.get()).resolves.toBeNull();
    });
  });

  describe("GIVEN the stored value is unusable", () => {
    test("WHEN it is not valid JSON THEN `get` resolves to `null`", async () => {
      // Arrange
      const repo = new BrowserLocalStorageLearnerProfileRepository({
        localStorage: makeMemoryStorage({ [STORAGE_KEY]: "{not json" }),
      });

      // Act + Assert
      await expect(repo.get()).resolves.toBeNull();
    });

    test("WHEN it fails validation THEN `get` resolves to `null`", async () => {
      // Arrange
      const repo = new BrowserLocalStorageLearnerProfileRepository({
        localStorage: makeMemoryStorage({
          [STORAGE_KEY]: JSON.stringify({ name: "", avatar: { kind: "initials" } }),
        }),
      });

      // Act + Assert
      await expect(repo.get()).resolves.toBeNull();
    });
  });

  describe("GIVEN storage is unavailable", () => {
    test("WHEN queried THEN reads resolve to `null` and writes do not throw", async () => {
      // Arrange
      const repo = new BrowserLocalStorageLearnerProfileRepository({ localStorage: undefined });

      // Act + Assert
      await expect(repo.set(buildProfile())).resolves.toBeUndefined();
      await expect(repo.get()).resolves.toBeNull();
    });
  });

  describe("GIVEN storage rejects the write", () => {
    test("WHEN `set` is called THEN the failure is swallowed", async () => {
      // Arrange
      const failing = makeMemoryStorage();
      vi.spyOn(failing, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
      const repo = new BrowserLocalStorageLearnerProfileRepository({ localStorage: failing });

      // Act + Assert
      await expect(repo.set(buildProfile())).resolves.toBeUndefined();
    });
  });
});

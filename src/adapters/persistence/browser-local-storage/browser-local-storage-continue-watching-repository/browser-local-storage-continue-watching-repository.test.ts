import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";

import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { BrowserLocalStorageContinueWatchingRepository } from "./browser-local-storage-continue-watching-repository";

const STORAGE_KEY = "learning-english:continue-watching";

/**
 * A `Storage` backed by a `Map`. The real `localStorage` is unavailable in
 * some environments the adapter must survive, so every test drives it
 * through the injection seam rather than monkey-patching globals.
 */
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

const buildLocation = () =>
  ContinueWatchingLocation.parse({
    courseSlug: faker.lorem.slug({ min: 3, max: 8 }),
    moduleSlug: faker.lorem.slug({ min: 3, max: 8 }),
    lessonId: faker.string.uuid(),
  });

describe("BrowserLocalStorageContinueWatchingRepository", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = makeMemoryStorage();
  });

  describe("GIVEN a location was written", () => {
    test("WHEN `get` is called THEN the same location comes back", async () => {
      // Arrange
      const repo = new BrowserLocalStorageContinueWatchingRepository({ localStorage: storage });
      const location = buildLocation();

      // Act
      await repo.set(location);
      const result = await repo.get();

      // Assert
      expect(result).toEqual(location);
    });

    test("WHEN a second location is written THEN it replaces the first", async () => {
      // Arrange
      // The store is one slot: that is what makes "the last one" answerable
      // without a timestamp.
      const repo = new BrowserLocalStorageContinueWatchingRepository({ localStorage: storage });
      const first = buildLocation();
      const second = buildLocation();

      // Act
      await repo.set(first);
      await repo.set(second);
      const result = await repo.get();

      // Assert
      expect(result).toEqual(second);
    });

    test("WHEN written THEN it uses the namespaced key", async () => {
      // Arrange
      const repo = new BrowserLocalStorageContinueWatchingRepository({ localStorage: storage });

      // Act
      await repo.set(buildLocation());

      // Assert
      expect(storage.getItem(STORAGE_KEY)).not.toBeNull();
    });
  });

  describe("GIVEN the sibling progress stores hold entries for the same lesson", () => {
    test("WHEN a location is recorded THEN neither is written or cleared", async () => {
      // Arrange
      // *Where the learner was*, *how far into that lesson they got* and
      // *what they have finished* are three independent concepts on three
      // independent keys. Recording one must never touch the others.
      const lessonId = faker.string.uuid();
      const playbackKey = `learning-english:playback:${lessonId}`;
      const completedKey = `learning-english:completed:${lessonId}`;
      const shared = makeMemoryStorage({ [playbackKey]: "247", [completedKey]: "1" });
      const repo = new BrowserLocalStorageContinueWatchingRepository({ localStorage: shared });

      // Act
      await repo.set(ContinueWatchingLocation.parse({ ...buildLocation(), lessonId }));

      // Assert
      expect(shared.getItem(playbackKey)).toBe("247");
      expect(shared.getItem(completedKey)).toBe("1");
    });
  });

  describe("GIVEN nothing was ever written", () => {
    test("WHEN `get` is called THEN it resolves to `null`", async () => {
      // Arrange
      const repo = new BrowserLocalStorageContinueWatchingRepository({ localStorage: storage });

      // Act
      const result = await repo.get();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("GIVEN the stored value is unusable", () => {
    test("WHEN it is not valid JSON THEN `get` resolves to `null`", async () => {
      // Arrange
      const repo = new BrowserLocalStorageContinueWatchingRepository({
        localStorage: makeMemoryStorage({ [STORAGE_KEY]: "{not json" }),
      });

      // Act
      const result = await repo.get();

      // Assert
      expect(result).toBeNull();
    });

    test("WHEN it is JSON that does not match the schema THEN `get` resolves to `null`", async () => {
      // Arrange
      const repo = new BrowserLocalStorageContinueWatchingRepository({
        localStorage: makeMemoryStorage({
          [STORAGE_KEY]: JSON.stringify({ courseSlug: "a-course" }),
        }),
      });

      // Act
      const result = await repo.get();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("GIVEN storage is unavailable", () => {
    test("WHEN queried THEN reads resolve to `null` and writes do not throw", async () => {
      // Arrange
      const repo = new BrowserLocalStorageContinueWatchingRepository({ localStorage: undefined });

      // Act + Assert
      await expect(repo.set(buildLocation())).resolves.toBeUndefined();
      await expect(repo.get()).resolves.toBeNull();
    });
  });

  describe("GIVEN storage rejects the write", () => {
    test("WHEN `set` is called THEN the failure is swallowed", async () => {
      // Arrange
      // Quota exceeded, or Safari private mode. A lost continue-watching
      // record is not worth an exception on a lesson page.
      const failing = makeMemoryStorage();
      vi.spyOn(failing, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
      const repo = new BrowserLocalStorageContinueWatchingRepository({ localStorage: failing });

      // Act + Assert
      await expect(repo.set(buildLocation())).resolves.toBeUndefined();
    });
  });
});

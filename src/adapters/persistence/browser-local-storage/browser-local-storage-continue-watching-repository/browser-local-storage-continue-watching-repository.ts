import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";

const STORAGE_KEY = "learning-english:continue-watching";

/**
 * Driven adapter: browser `localStorage`-backed `ContinueWatchingRepository`.
 *
 * **Browser only.** Do NOT import from a Server Component, Server Action, or
 * `getCoursePlatformDeps` — that would bundle `window` access into the server
 * build and crash. Its siblings in this folder carry the same warning.
 *
 * Storage namespace: `learning-english:continue-watching`. A **single** key,
 * not one per lesson like the playback and completion adapters: the record is
 * "where the learner was", and there is only ever one answer. Overwriting is
 * what makes it the latest, which is why nothing here needs a timestamp.
 *
 * Every failure mode reads as "no record", never as an exception: absent key,
 * unparseable JSON, JSON that no longer satisfies the schema (a record
 * written by an older build), or storage that is unavailable outright. A
 * learner who has watched nothing and a learner whose storage is blocked see
 * the same home, which is the correct degradation — the panel is an
 * accelerator, and every course is still reachable through the ladder.
 *
 * The optional `localStorage` parameter is the dependency-injection seam
 * tests use to simulate those environments without monkey-patching globals.
 */
export class BrowserLocalStorageContinueWatchingRepository implements ContinueWatchingRepository {
  readonly #storage: Storage | undefined;

  constructor(params?: { localStorage?: Storage }) {
    this.#storage =
      params && "localStorage" in params
        ? params.localStorage
        : typeof window !== "undefined"
          ? window.localStorage
          : undefined;
  }

  async get(): Promise<ContinueWatchingLocation | null> {
    if (this.#storage === undefined) {
      return null;
    }
    const raw = this.#storage.getItem(STORAGE_KEY);
    if (raw === null) {
      return null;
    }
    const parsed = ContinueWatchingLocation.safeParse(readJson(raw));
    return parsed.success ? parsed.data : null;
  }

  async set(location: ContinueWatchingLocation): Promise<void> {
    if (this.#storage === undefined) {
      return;
    }
    try {
      this.#storage.setItem(STORAGE_KEY, JSON.stringify(location));
    } catch {
      // Quota exceeded or storage blocked. The record is lost, which is the
      // correct degradation: the learner keeps watching.
    }
  }
}

/**
 * `JSON.parse` that reports a malformed document as `undefined` instead of
 * throwing, so the schema check below is the only place a stored value is
 * judged.
 */
function readJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

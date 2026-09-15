import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";

/** The one key the profile lives under. Exported for the client store that watches it. */
export const LEARNER_PROFILE_STORAGE_KEY = "learning-english:learner-profile";

/**
 * Driven adapter: browser `localStorage`-backed `LearnerProfileRepository`.
 *
 * **Browser only.** Do NOT import from a Server Component or Server Action —
 * its siblings in this folder carry the same warning.
 *
 * Every failure reads as "no profile", never as an exception: absent key,
 * unparseable JSON, a value that fails validation, or storage that is
 * unavailable. A learner in any of those situations is sent through the
 * onboarding again, which is the correct degradation for a per-device card.
 *
 * The optional `localStorage` parameter is the dependency-injection seam
 * tests use to simulate those environments without monkey-patching globals.
 */
export class BrowserLocalStorageLearnerProfileRepository implements LearnerProfileRepository {
  readonly #storage: Storage | undefined;

  constructor(params?: { localStorage?: Storage }) {
    this.#storage =
      params && "localStorage" in params
        ? params.localStorage
        : typeof window !== "undefined"
          ? window.localStorage
          : undefined;
  }

  async get(): Promise<LearnerProfile | null> {
    const raw = this.#storage?.getItem(LEARNER_PROFILE_STORAGE_KEY) ?? null;
    if (raw === null) {
      return null;
    }
    const parsed = LearnerProfile.safeParse(readJson(raw));
    return parsed.success ? parsed.data : null;
  }

  async set(profile: LearnerProfile): Promise<void> {
    try {
      this.#storage?.setItem(LEARNER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Quota exceeded or storage blocked. The profile is lost, which is the
      // correct degradation: the learner can still watch every lesson.
    }
  }
}

/** `JSON.parse` that reports a malformed document as `undefined` instead of throwing. */
function readJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

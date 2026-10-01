import type { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import type { ContinueWatchingRecord } from "@/domain/entities/continue-watching-record/continue-watching-record";

/**
 * Port: where the learner was in each course they have opened.
 *
 * The store holds one location per course. `set` replaces the location of
 * that location's course and makes it the most recent; the other courses keep
 * theirs. Ordering comes from the time storage wrote each entry, so the domain
 * still needs no `Clock` port.
 *
 * Independent of `PlaybackPositionRepository` and `ProgressTracker`. *Where
 * the learner was*, *how far into that lesson they got*, and *what they have
 * finished* are three distinct concepts mapping to independent storage, and
 * writing one never touches the others.
 *
 * An absent record is a supported state, not an error: `get` resolves to
 * `null` and `list` to an empty array when nothing has been recorded or
 * storage is unavailable, and an entry that cannot be parsed is left out.
 */
export interface ContinueWatchingRepository {
  /** The most recently set location across every course, or `null`. */
  get(): Promise<ContinueWatchingLocation | null>;

  /** Records the learner's place in the location's course; it becomes the latest. */
  set(location: ContinueWatchingLocation): Promise<void>;

  /** One record per course, the most recently watched first. */
  list(): Promise<ReadonlyArray<ContinueWatchingRecord>>;
}

import type { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";

/**
 * Port: the single most recent lesson location the learner opened.
 *
 * The store holds exactly one entry. That is what makes "the last one"
 * answerable without a timestamp — and therefore without a `Clock` port:
 * `set` replaces whatever was there, so whatever `get` returns is by
 * construction the latest.
 *
 * Independent of `PlaybackPositionRepository` and `ProgressTracker`. *Where
 * the learner was*, *how far into that lesson they got*, and *what they have
 * finished* are three distinct concepts mapping to independent storage, and
 * writing one never touches the others.
 *
 * `get` resolves to `null` when nothing has been recorded, when the stored
 * value cannot be parsed, or when storage is unavailable — an absent record
 * is a supported state, not an error.
 */
export interface ContinueWatchingRepository {
  get(): Promise<ContinueWatchingLocation | null>;
  set(location: ContinueWatchingLocation): Promise<void>;
}

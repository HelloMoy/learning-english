/**
 * Domain errors emitted by `findLearnerProfile`.
 *
 * A missing profile is not an error — it resolves to `null`. Only a
 * repository that rejects outright surfaces here.
 */
export type FindLearnerProfileErrors = { kind: "internal-error"; cause: unknown };

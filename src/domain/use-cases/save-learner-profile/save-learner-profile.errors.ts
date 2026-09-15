/**
 * Domain errors emitted by `saveLearnerProfile`.
 *
 * - `invalid-learner-profile` — the input failed `LearnerProfile` validation
 *   (a blank or overlong name, an unknown illustration); nothing was written.
 * - `internal-error` — the repository rejected the write.
 */
export type SaveLearnerProfileErrors =
  { kind: "invalid-learner-profile" } | { kind: "internal-error"; cause: unknown };

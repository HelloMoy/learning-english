/**
 * Single chokepoint for `neverthrow` types in domain code.
 *
 * Use cases import `Result`, `ResultAsync`, `ok`, `err` from this module — not
 * directly from `neverthrow`. If we ever migrate to a different Result
 * library (e.g. `Effect`), this is the only module that needs to change.
 */
export { Result, ResultAsync, err, ok } from "neverthrow";

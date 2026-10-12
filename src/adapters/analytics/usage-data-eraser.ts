import type { ResultAsync } from "neverthrow";

/**
 * Why an account's usage data could not be erased. `cause` carries the
 * underlying error for logs; it is never shown to a learner.
 *
 * @category Observability
 */
export type UsageDataErasureError = {
  kind: "usage-data-erasure-failed";
  cause: unknown;
};

/**
 * Driven-adapter primitive: erases what an analytics service holds about one
 * account.
 *
 * Not a domain port — nothing in `src/domain/**` knows usage data exists. It
 * is here so the account-deletion callback can erase through one interface
 * whatever the service, and so tests can inject a recording eraser.
 *
 * @category Observability
 */
export interface UsageDataEraser {
  /**
   * Resolves `Ok` once nothing is held for the account — including when
   * nothing ever was — and `Err` when the erasure could not be completed.
   */
  erase(accountId: string): ResultAsync<void, UsageDataErasureError>;
}

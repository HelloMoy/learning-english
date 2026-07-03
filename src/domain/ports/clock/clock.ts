/**
 * Port: a clock the domain uses to read the current time.
 *
 * Production implementation: `SystemClock` (wall clock).
 * Test implementation: `FakedClock` returning a controlled instant.
 *
 * The hexágono MUST NOT call `Date.now()` or `new Date()` directly; doing so
 * would couple time-sensitive behavior to the runtime clock and prevent
 * deterministic tests.
 */
export interface Clock {
  now(): Date;
}

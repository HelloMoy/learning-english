/**
 * Observes a player command's promise and discards its rejection.
 *
 * @remarks
 * The video player's embed providers reject **every** pending promise when
 * their provider is destroyed, which happens on unmount — a learner navigating
 * away mid-command, or a test finishing. Nothing useful can be done with that
 * rejection: the provider is gone because the page is. Left unobserved it fails
 * a whole test run, and in the browser it would reach error reporting as noise
 * that buries real failures.
 *
 * This exists as a named function because its absence is invisible.
 * `ResumablePlayer` declares its commands as returning `void`, and TypeScript
 * lets a function return a value where `void` is expected — so
 * `pause: () => ref.current?.pause()` type-checks perfectly while leaking a
 * promise on every call. That was the defect that failed CI on every run.
 *
 * @example
 * ```ts
 * pause: () => fireAndForget(playerRef.current?.pause()),
 * ```
 *
 * @param command - The promise the player returned, or `undefined` when there
 *   is no player yet
 *
 * @category Lesson view
 */
export function fireAndForget(command: Promise<void> | undefined): void {
  // The empty handler is deliberate: see the remarks above.
  void command?.catch(() => {});
}

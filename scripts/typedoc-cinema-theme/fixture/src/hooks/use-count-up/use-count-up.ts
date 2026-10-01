/**
 * Count from zero up to a target.
 *
 * @param target - The number to stop at.
 * @returns The values from zero to `target`.
 */
export function useCountUp(target: number): number[] {
  return Array.from({ length: target + 1 }, (_, value) => value);
}

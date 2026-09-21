import { screen } from "@testing-library/react";

/**
 * The text of every live region a screen reader would actually read, in
 * document order.
 *
 * @remarks
 * A plain `getByRole("status")` is ambiguous on any surface that uses
 * `AccountWait`: it keeps an empty live region mounted even at rest, because a
 * region inserted together with its text is not reliably announced. This helper
 * drops the empty ones, so a test asserts what is said rather than what is
 * mounted.
 *
 * It also drops regions inside an `inert` subtree. jsdom does not apply `inert`
 * to the accessibility tree, so without this a paused notice would appear to be
 * announced when a browser would have silenced it.
 *
 * @returns The trimmed text of each speaking region, in document order
 *
 * @example
 * ```ts
 * expect(spokenRegions()).toEqual(["Checking your details…"]);
 * ```
 */
export function spokenRegions(): string[] {
  return screen
    .queryAllByRole("status")
    .filter((region) => !region.closest("[inert]"))
    .map((region) => region.textContent?.trim() ?? "")
    .filter((text) => text.length > 0);
}

import { describe, expect, it, vi } from "vitest";

import { stubServerActions } from "./stub-server-actions";

const REAL = "/repo/src/app/[locale]/actions.ts";
const STUB = "/repo/.storybook/actions-stub.ts";

/**
 * Drives the plugin's `resolveId` the way Vite does, with a context whose
 * `resolve` answers `resolvesTo` for any specifier.
 */
function resolveThroughPlugin(specifier: string, resolvesTo: string | null) {
  const plugin = stubServerActions(new Map([[REAL, STUB]]));
  const context = { resolve: vi.fn().mockResolvedValue(resolvesTo && { id: resolvesTo }) };

  return plugin.resolveId.call(context, specifier, "/repo/src/app/[locale]/x.ts", {});
}

describe("stubServerActions", () => {
  it("redirects a relative specifier that lands on the stubbed module", async () => {
    await expect(resolveThroughPlugin("./actions", REAL)).resolves.toBe(STUB);
  });

  it("redirects an aliased specifier that lands on the same module", async () => {
    await expect(resolveThroughPlugin("@/app/[locale]/actions", REAL)).resolves.toBe(STUB);
  });

  it("redirects when the resolved id carries a query suffix", async () => {
    await expect(resolveThroughPlugin("./actions", `${REAL}?v=123`)).resolves.toBe(STUB);
  });

  it("leaves every other module to Vite", async () => {
    await expect(
      resolveThroughPlugin("./resolve-continue-watching", "/repo/src/app/[locale]/r.ts"),
    ).resolves.toBeNull();
  });

  it("leaves a specifier Vite cannot resolve alone", async () => {
    await expect(resolveThroughPlugin("./nope", null)).resolves.toBeNull();
  });

  it("leaves an entry module, which has no importer", async () => {
    const plugin = stubServerActions(new Map([[REAL, STUB]]));
    const context = { resolve: vi.fn() };

    await expect(plugin.resolveId.call(context, REAL, undefined, {})).resolves.toBeNull();
    expect(context.resolve).not.toHaveBeenCalled();
  });
});

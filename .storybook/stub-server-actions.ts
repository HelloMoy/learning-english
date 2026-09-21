import type { Plugin } from "vite";

/** Vite appends `?v=…`, `?import` and friends; the module is the part before it. */
function modulePathOf(resolvedId: string): string {
  return resolvedId.split("?")[0];
}

/**
 * Redirects server-only application modules to browser-safe stubs, matching on
 * the **resolved file** rather than on the import specifier.
 *
 * @remarks
 * `resolve.alias` matches the specifier a module was written with, which is not
 * enough here: `resolve-continue-watching.ts` sits beside `actions.ts` and
 * imports it as `"./actions"`, so a `@/app/[locale]/actions` alias never fires
 * and the preview still bundles `node:fs`. Resolving first and comparing paths
 * catches every spelling of the same module.
 *
 * Runs with `enforce: "pre"` so it decides before Vite's own resolver commits.
 *
 * @param stubsByModulePath - Absolute real module path → absolute stub path
 * @returns The Vite plugin to add to the preview's config
 *
 * @example
 * ```ts
 * stubServerActions(new Map([[realActionsPath, stubPath]]))
 * ```
 */
export function stubServerActions(stubsByModulePath: ReadonlyMap<string, string>): Plugin {
  return {
    name: "storybook:stub-server-actions",
    enforce: "pre",
    async resolveId(specifier, importer, options) {
      if (!importer) return null;

      const resolved = await this.resolve(specifier, importer, { ...options, skipSelf: true });
      if (!resolved) return null;

      return stubsByModulePath.get(modulePathOf(resolved.id)) ?? null;
    },
  };
}

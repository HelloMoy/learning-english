import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { findContinueWatchingAction } from "./actions-stub";

const storybookDir = path.dirname(fileURLToPath(import.meta.url));

const REAL_ACTIONS_MODULE = path.resolve(storybookDir, "../src/app/[locale]/actions.ts");
const STUB_MODULE = path.resolve(storybookDir, "actions-stub.ts");

/**
 * Names exported as values — `export const x`, `export function x`, `export class x`.
 *
 * Read from source rather than by importing: the real module is `"use server"`
 * and reaching it at runtime is the very thing the stub exists to avoid.
 */
function valueExportsOf(modulePath: string): ReadonlySet<string> {
  const source = readFileSync(modulePath, "utf8");
  const declarations = source.matchAll(
    /^export\s+(?:async\s+)?(?:const|let|var|function|class)\s+(\w+)/gm,
  );
  return new Set([...declarations].map(([, name]) => name));
}

describe("the Storybook stub for [locale]/actions", () => {
  it("resolves the continue-watching action to nothing to resume", async () => {
    await expect(findContinueWatchingAction()).resolves.toEqual({ data: null });
  });

  it("exports every value the real module exports", () => {
    const real = valueExportsOf(REAL_ACTIONS_MODULE);
    const stubbed = valueExportsOf(STUB_MODULE);

    expect(real.size).toBeGreaterThan(0);
    expect([...real].filter((name) => !stubbed.has(name))).toEqual([]);
  });
});

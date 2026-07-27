import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

/**
 * Guard test for the Immersion Cinema token layer (design.md §D2).
 *
 * It parses the real `globals.css` `:root` (cinema-light) and `.dark`
 * (cinema-dark) blocks and asserts that every text-bearing color pair
 * clears WCAG 2.1 AA. Binding the test to the shipped CSS means a future
 * token edit that regresses contrast fails here instead of shipping.
 */

const CSS_PATH = join(process.cwd(), "src/app/globals.css");

function extractBlock(css: string, selector: string): Record<string, string> {
  // Match the FIRST `<selector> { ... }` block. `:root`/`.dark` each
  // appear once as a variable definition block in globals.css.
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`);
  const body = css.match(re)?.[1] ?? "";
  const vars: Record<string, string> = {};
  for (const line of body.split("\n")) {
    const m = line.match(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/);
    if (m) vars[m[1]!] = m[2]!;
  }
  return vars;
}

function toRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const n = Number.parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relLuminance(hex: string): number {
  const srgb = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * srgb[0]! + 0.7152 * srgb[1]! + 0.0722 * srgb[2]!;
}

function contrast(a: string, b: string): number {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const css = readFileSync(CSS_PATH, "utf8");

describe.each([
  ["cinema-light (:root)", ":root"],
  ["cinema-dark (.dark)", ".dark"],
])("%s token contrast", (_label, selector) => {
  const v = extractBlock(css, selector);

  // Text pairs that MUST clear AA for normal text (4.5:1).
  const AA = 4.5;
  const pairs: Array<[string, string, string]> = [
    ["foreground / background", "--foreground", "--background"],
    ["muted-foreground / background", "--muted-foreground", "--background"],
    ["gold / background", "--gold", "--background"],
    ["practice-blue (link) / background", "--practice-blue", "--background"],
    ["card-foreground / card", "--card-foreground", "--card"],
    ["primary-foreground / primary", "--primary-foreground", "--primary"],
  ];

  test.each(pairs)("%s clears WCAG AA (4.5:1)", (_name, fg, bg) => {
    expect(v[fg], `${fg} missing`).toBeDefined();
    expect(v[bg], `${bg} missing`).toBeDefined();
    expect(contrast(v[fg]!, v[bg]!)).toBeGreaterThanOrEqual(AA);
  });
});

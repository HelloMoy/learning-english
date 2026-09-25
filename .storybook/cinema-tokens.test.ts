import { describe, expect, it } from "vitest";

import { pairCinemaColors, readCinemaTokens } from "./cinema-tokens";

const STYLESHEET = `
@theme inline {
  --color-background: var(--background);
  --radius-sm: calc(var(--radius) * 0.6);
}

/* The light variant. */
:root {
  --background: #f6f1e6;
  /* Gold is a bronze on light, see design.md. */
  --gold: #8a5e0f;
  --radius: 0.625rem;
}

.dark {
  --background: #08080b;
  --gold: #e7b64c;
}

@layer base {
  body {
    --background: #ff0000;
  }
}
`;

describe("readCinemaTokens", () => {
  it("reads the dark variant from the .dark block, in source order", () => {
    expect(readCinemaTokens(STYLESHEET, "dark")).toEqual([
      ["background", "#08080b"],
      ["gold", "#e7b64c"],
    ]);
  });

  it("reads the light variant from the :root block, skipping its comments", () => {
    expect(readCinemaTokens(STYLESHEET, "light")).toEqual([
      ["background", "#f6f1e6"],
      ["gold", "#8a5e0f"],
      ["radius", "0.625rem"],
    ]);
  });

  it("ignores the @theme inline aliases and properties declared by other selectors", () => {
    const names = readCinemaTokens(STYLESHEET, "light").map(([name]) => name);

    expect(names).not.toContain("color-background");
    expect(readCinemaTokens(STYLESHEET, "dark")).not.toContainEqual(["background", "#ff0000"]);
  });

  it("returns no tokens when the stylesheet has no block for the variant", () => {
    expect(readCinemaTokens("body { color: red; }", "dark")).toEqual([]);
  });
});

describe("pairCinemaColors", () => {
  it("pairs each colour token's light and dark values, in the light block's order", () => {
    expect(pairCinemaColors(STYLESHEET)).toEqual([
      { name: "background", light: "#f6f1e6", dark: "#08080b" },
      { name: "gold", light: "#8a5e0f", dark: "#e7b64c" },
    ]);
  });

  it("leaves out tokens that are not colours", () => {
    const names = pairCinemaColors(STYLESHEET).map(({ name }) => name);

    expect(names).not.toContain("radius");
  });
});

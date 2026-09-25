import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { CINEMA_THEME_TOKENS, cinemaLightTheme, cinemaTheme } from "./cinema-theme";
import { readCinemaTokens } from "./cinema-tokens";

const storybookDir = path.dirname(fileURLToPath(import.meta.url));
const globalsCss = readFileSync(path.resolve(storybookDir, "../src/app/globals.css"), "utf8");
const darkTokens = new Map(readCinemaTokens(globalsCss, "dark"));

describe.each([
  { name: "cinemaTheme", theme: cinemaTheme, variant: "dark" as const },
  { name: "cinemaLightTheme", theme: cinemaLightTheme, variant: "light" as const },
])("$name", ({ theme, variant }) => {
  const tokens = new Map(readCinemaTokens(globalsCss, variant));

  it.each(Object.entries(CINEMA_THEME_TOKENS))(
    `takes %s from the app's ${variant} --%s token`,
    (themeKey, tokenName) => {
      expect(tokens.has(tokenName)).toBe(true);
      expect(theme[themeKey as keyof typeof theme]).toBe(tokens.get(tokenName));
    },
  );

  it(`is a ${variant} theme`, () => {
    expect(theme.base).toBe(variant);
  });

  it("is set in the app's typefaces", () => {
    expect(theme.fontBase).toMatch(/^"Geist",/);
    expect(theme.fontCode).toMatch(/^"Geist Mono",/);
  });

  it("rounds corners with the app's --radius", () => {
    expect(theme.appBorderRadius).toBe(10);
    expect(theme.inputBorderRadius).toBe(10);
  });
});

describe("cinemaTheme", () => {
  describe("brand", () => {
    const brand = new DOMParser().parseFromString(cinemaTheme.brandTitle ?? "", "text/html").body
      .firstElementChild;
    const [wordmark, tag] = [...(brand?.children ?? [])];

    it("is the ENGLISH·COURSE wordmark with a gold middle dot", () => {
      expect(wordmark.textContent).toBe("ENGLISH·COURSE");
      expect(wordmark.querySelector("span")?.getAttribute("style")).toContain(
        darkTokens.get("gold"),
      );
    });

    it("tags the wordmark as the design system, the way the API reference tags it API", () => {
      expect(tag.textContent).toBe("Design system");
      expect(tag.getAttribute("style")).toContain("text-transform:uppercase");
      expect(tag.getAttribute("style")).toContain(`color:${darkTokens.get("gold")}`);
    });
  });
});

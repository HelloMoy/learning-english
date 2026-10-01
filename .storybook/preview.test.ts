import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { withCinemaBackdrop } from "./cinema-backdrop";
import { CinemaDocsContainer } from "./cinema-docs-container";
import { readCinemaTokens } from "./cinema-tokens";
import preview from "./preview";
import { canvasThemes } from "./toolbar";

// The preview imports the app stylesheet for the browser; jsdom cannot parse
// Tailwind 4's syntax, and nothing here reads computed styles.
vi.mock("../src/app/globals.css", () => ({}));

const storybookDir = path.dirname(fileURLToPath(import.meta.url));

describe("the Storybook preview", () => {
  it("opens stories in the dark variant, the app's default, and keeps light selectable", () => {
    expect(canvasThemes.defaultTheme).toBe("dark");
    expect(Object.keys(canvasThemes.themes)).toEqual(["light", "dark"]);
  });

  it("marks <html> with the default theme before anything renders, so no light frame flashes", () => {
    const previewHead = readFileSync(path.resolve(storybookDir, "preview-head.html"), "utf8");
    const inlineScripts = [...previewHead.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    document.documentElement.className = "";

    inlineScripts.forEach(([, source]) => new Function(source)());

    expect(document.documentElement).toHaveClass(canvasThemes.themes[canvasThemes.defaultTheme]);
  });

  it("paints Storybook's loading skeleton in cinema-dark tokens, not its stock white", () => {
    const previewHead = readFileSync(path.resolve(storybookDir, "preview-head.html"), "utf8");
    const globalsCss = readFileSync(path.resolve(storybookDir, "../src/app/globals.css"), "utf8");
    const darkValues = new Set(readCinemaTokens(globalsCss, "dark").map(([, value]) => value));
    const loaderRule = previewHead.match(/\.sb-preparing-docs\s*\{([^}]*)\}/)?.[1] ?? "";

    expect(loaderRule).toContain("background-color: #08080b");
    for (const [hex] of previewHead.matchAll(/#[\da-f]{6}\b/gi)) {
      expect(darkValues).toContain(hex);
    }
  });

  it("renders every story over the cinema backdrop", () => {
    expect(preview.decorators).toContain(withCinemaBackdrop);
  });

  it("hands docs pages to the container that themes them from the toolbar", () => {
    expect(preview.parameters?.docs?.theme).toBeUndefined();
    expect(preview.parameters?.docs?.container).toBe(CinemaDocsContainer);
  });

  it("carries no background swatches to paint over the backdrop", () => {
    expect(preview.parameters?.backgrounds).toBeUndefined();
  });
});

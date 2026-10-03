// @vitest-environment node
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { beforeAll, describe, expect, test } from "vitest";

import { readCinemaTokens } from "../../.storybook/cinema-tokens";
import {
  CINEMA_GRAPH_COLORS,
  cruiseLayers,
  renderSvg,
  writeArchitectureGraph,
} from "./architecture-graph.mts";

/**
 * Guards the `architecture-graph` capability: the layers of `src/` and the
 * dependencies between them, drawn in the portal's palette.
 */

const ROOT = path.resolve(__dirname, "../..");
const LAYER = /^src\/(domain\/[^/]+|adapters\/[^/]+|[^/.]+)$/;

const nodesOf = (dot: string) => [...dot.matchAll(/"([^"]+)"\s*\[label=/g)].map(([, node]) => node);
const edgesOf = (dot: string) =>
  [...dot.matchAll(/^\s*"([^"]+)"\s*->\s*"([^"]+)"/gm)].map(([, from, to]) => `${from} -> ${to}`);

/** Which cinema-dark token in `globals.css` each graph colour takes its value from. */
const GRAPH_COLOR_TOKENS = {
  card: "card",
  foreground: "foreground",
  border: "border",
  mutedForeground: "muted-foreground",
  gold: "gold",
} as const;

describe("CINEMA_GRAPH_COLORS", () => {
  const darkTokens = new Map(
    readCinemaTokens(readFileSync(path.join(ROOT, "src/app/globals.css"), "utf8"), "dark"),
  );

  test.each(Object.entries(GRAPH_COLOR_TOKENS))("%s takes the app's dark --%s", (color, token) => {
    expect(CINEMA_GRAPH_COLORS[color as keyof typeof CINEMA_GRAPH_COLORS]).toBe(
      darkTokens.get(token),
    );
  });
});

describe("cruiseLayers", () => {
  let dot: string;

  beforeAll(async () => {
    dot = await cruiseLayers();
  }, 60_000);

  test("draws one node per layer of src, and nothing else", () => {
    const nodes = nodesOf(dot);

    expect(nodes).toContain("src/domain/use-cases");
    expect(nodes).toContain("src/components");
    expect(nodes.filter((node) => !LAYER.test(node))).toEqual([]);
  });

  test("counts type-only imports, so use cases depend on ports", () => {
    expect(edgesOf(dot)).toContain("src/domain/use-cases -> src/domain/ports");
  });

  test("leaves tests, stories and test setup out", () => {
    expect(dot).not.toMatch(/\.(test|stories)\.tsx?|test-setup/);
  });
});

describe("renderSvg", () => {
  let svg: string;

  beforeAll(async () => {
    svg = await renderSvg(await cruiseLayers());
  }, 60_000);

  test("draws the graph as SVG", () => {
    expect(svg).toMatch(/<svg[\s>]/);
  });

  test("outlines the domain layers in gold", () => {
    const useCases = svg.slice(svg.indexOf("<title>src/domain/use&#45;cases</title>"));

    expect(useCases.slice(0, 400)).toContain(`stroke="${CINEMA_GRAPH_COLORS.gold}"`);
  });

  test("links nowhere: a layer is not a page", () => {
    expect(svg).not.toContain("xlink:href");
  });
});

describe("writeArchitectureGraph", () => {
  test("writes the SVG where the portal serves it", () => {
    const portalDir = mkdtempSync(path.join(tmpdir(), "architecture-graph-"));

    writeArchitectureGraph("<svg/>", portalDir);

    expect(readFileSync(path.join(portalDir, "public/architecture/layers.svg"), "utf8")).toBe(
      "<svg/>",
    );
  });
});

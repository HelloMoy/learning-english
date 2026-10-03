import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { Graphviz } from "@hpcc-js/wasm-graphviz";
import { cruise, type ICruiseOptions } from "dependency-cruiser";
import extractTSConfig from "dependency-cruiser/config-utl/extract-ts-config";

/**
 * The cinema-dark values the graph is drawn with. Each is the `.dark` value of
 * a token in `src/app/globals.css`; the tests fail when one drifts.
 */
export const CINEMA_GRAPH_COLORS = {
  card: "#16171d",
  foreground: "#f4f1ea",
  border: "#26262f",
  mutedForeground: "#9b968c",
  gold: "#e7b64c",
} as const;

/** Collapses every module into its layer: `src/domain/<x>`, `src/adapters/<x>` or `src/<x>`. */
const LAYER_PATTERN = "^src/(domain/[^/]+|adapters/[^/]+|[^/]+)";

/** Tests, stories, test setup and the Next.js/Sentry entry files are not layers. */
const NOT_A_LAYER = "\\.(test|stories)\\.tsx?$|^src/test-setup|^src/(instrumentation|sentry|proxy)";

const DOMAIN_LAYER = "^src/domain/";

const CINEMA_THEME = {
  replace: true,
  graph: {
    bgcolor: "transparent",
    rankdir: "LR",
    splines: "true",
    fontname: "Helvetica",
    fontcolor: CINEMA_GRAPH_COLORS.mutedForeground,
    color: CINEMA_GRAPH_COLORS.border,
  },
  node: {
    shape: "box",
    style: "rounded,filled",
    fillcolor: CINEMA_GRAPH_COLORS.card,
    color: CINEMA_GRAPH_COLORS.border,
    fontcolor: CINEMA_GRAPH_COLORS.foreground,
    fontname: "Helvetica",
    fontsize: "11",
    penwidth: "1.5",
  },
  edge: {
    color: CINEMA_GRAPH_COLORS.mutedForeground,
    arrowhead: "vee",
    arrowsize: "0.7",
    penwidth: "1.2",
  },
  modules: [
    {
      criteria: { source: DOMAIN_LAYER },
      attributes: { color: CINEMA_GRAPH_COLORS.gold, penwidth: "2.5" },
    },
  ],
};

const CRUISE_OPTIONS: ICruiseOptions = {
  includeOnly: "^src/",
  exclude: { path: NOT_A_LAYER },
  collapse: LAYER_PATTERN,
  // Ports are interfaces, imported with `import type`; without this, use
  // cases would look independent of them.
  tsPreCompilationDeps: true,
  tsConfig: { fileName: "tsconfig.json" },
  outputType: "dot",
  reporterOptions: { dot: { theme: CINEMA_THEME } },
};

/**
 * Computes the dependencies between the layers of `src/`, type-only imports
 * included, as a Graphviz DOT graph in the cinema palette.
 *
 * @returns The DOT source, one node per layer
 */
export async function cruiseLayers(): Promise<string> {
  const { output } = await cruise(["src"], CRUISE_OPTIONS, undefined, {
    tsConfig: extractTSConfig("tsconfig.json"),
  });
  return String(output);
}

/**
 * Lays the graph out with Graphviz compiled to WebAssembly, so drawing it needs
 * no Graphviz installed.
 *
 * @param dot - The graph from {@link cruiseLayers}
 * @returns The SVG markup
 */
export async function renderSvg(dot: string): Promise<string> {
  const graphviz = await Graphviz.load();
  return graphviz.layout(withoutLinks(dot), "svg", "dot");
}

/** dependency-cruiser links each node to its path; a layer is not a page, so the links would 404. */
function withoutLinks(dot: string): string {
  return dot.replace(/ URL="[^"]*"/g, "");
}

/**
 * Writes the SVG where the docs portal serves it, `public/architecture/layers.svg`.
 *
 * @param svg - The markup from {@link renderSvg}
 * @param portalDir - The portal project's root, `docs-portal/`
 */
export function writeArchitectureGraph(svg: string, portalDir: string): void {
  const architectureDir = path.join(portalDir, "public/architecture");
  mkdirSync(architectureDir, { recursive: true });
  writeFileSync(path.join(architectureDir, "layers.svg"), svg);
}

async function main(): Promise<void> {
  const portalDir = path.resolve(import.meta.dirname, "../../docs-portal");

  writeArchitectureGraph(await renderSvg(await cruiseLayers()), portalDir);
  console.log(`Drew the layer graph into ${portalDir}`);
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}

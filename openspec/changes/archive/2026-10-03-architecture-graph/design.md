## Context

`src/` holds the hexagon (`domain/entities`, `domain/ports`,
`domain/use-cases`, `domain/result`), its driven adapters
(`adapters/persistence`, `adapters/email`), and the delivery side (`app`,
`components`, `hooks`, `lib`, `i18n`, `emails`, `content`, `messages`).
ESLint enforces the boundaries (`openspec/specs/architecture-boundaries`).
Imports use the `@/` alias from `tsconfig.json`. Ports are interfaces, so use
cases import them with `import type`.

A prototype confirmed the approach: dependency-cruiser's `cruise()` with the
`tsconfig` and `tsPreCompilationDeps` finds 44 edges between 16 layers in
~0.6 s, and `@hpcc-js/wasm-graphviz` renders the resulting DOT to SVG in-process.
Without `tsPreCompilationDeps` the `use-cases → ports` edge disappears; run
through `pnpm dlx`, dependency-cruiser cannot see TypeScript at all, which is
why it is a project dependency.

## Goals / Non-Goals

**Goals:** a readable, always-current picture of the layers, drawn in the
portal's palette, generated with no system tools.

**Non-Goals:** see the proposal — no rules or CI check, no module-level graph,
no interactivity.

## Decisions

### 1. `scripts/architecture-graph/architecture-graph.mts`

An `.mts` module, like the TypeDoc theme: dependency-cruiser is ESM-only, and
`tsx` loads a plain `.ts` script as CommonJS, which cannot `require` it.

- `cruiseLayers(): Promise<string>` — runs `cruise(["src"], options,
  undefined, { tsConfig: extractTSConfig("tsconfig.json") })` with
  `includeOnly: "^src/"`, the exclusions from the spec, `collapse:
  LAYER_PATTERN` (`^src/(domain/[^/]+|adapters/[^/]+|[^/]+)`),
  `tsPreCompilationDeps: true`, `tsConfig: { fileName: "tsconfig.json" }`,
  `outputType: "dot"`, and `reporterOptions.dot.theme` set from the cinema
  palette. Returns the DOT.
- `renderSvg(dot): Promise<string>` — `Graphviz.load()` then
  `layout(dot, "svg", "dot")`.
- `writeArchitectureGraph(svg, portalDir)` — writes
  `public/architecture/layers.svg`, creating the folder.
- `main` wires the three, run by `tsx` like the email gallery.

**Why the API, not the CLI:** the CLI needs either a
`.dependency-cruiser.js` config file or a long flag list in `package.json`,
and its DOT goes through stdout; the API keeps the options next to the code
that tests them.

### 2. The palette

`CINEMA_GRAPH_COLORS` holds the literal `.dark` values the theme uses —
`card` (node fill), `foreground` (labels), `border` (node outline),
`mutedForeground` (edges), `gold` (domain outline) — and the theme sets a
transparent background so the page's own background shows through. A test
compares each value with `globals.css` through `readCinemaTokens`, as the
portal palette test does. Domain layers are picked out with a theme `modules`
rule on `source: "^src/domain/"`.

### 3. The page and build order

`docs-portal/src/content/docs/architecture.mdx`: one paragraph on the layers,
one on ESLint enforcing them, and
`<img src="/architecture/layers.svg" alt="…">` inside a link that opens the
SVG at full size. Sidebar `{ label: "Architecture", link: "/architecture/" }`
and a home `LinkCard`.

```
portal:build = portal:emails && portal:changelog && portal:architecture
            && astro build && storybook build && typedoc
portal:dev   = portal:emails && portal:changelog && portal:architecture && astro dev
```

Like the email gallery, the SVG goes to `public/` so Astro copies it.

## Risks / Trade-offs

- **SVG text in an `<img>` cannot use web fonts** → labels fall back to
  Helvetica/Arial; legible, and an `<img>` keeps the page simple.
- **A layer with many edges crowds the picture** → 16 nodes and 44 edges lay
  out cleanly left-to-right today; a module-level view stays out of scope.
- **`@hpcc-js/wasm-graphviz` ships a large WASM blob** → dev dependency only;
  it never reaches the app bundle.

## Testing strategy

- **Vitest unit (node), `scripts/architecture-graph/architecture-graph.test.ts`**
  — mirrors `scripts/email-gallery/email-gallery.test.ts`: `cruiseLayers()`
  yields only layer nodes, includes `domain/use-cases → domain/ports`, no test
  or story files; `renderSvg()` returns an SVG whose domain nodes carry the
  gold outline; `writeArchitectureGraph()` writes into a temp portal;
  `CINEMA_GRAPH_COLORS` equal their tokens.
- **`src/deployment/docs-portal.test.ts`** — the script, its place in
  `portal:build` and `portal:dev`, the sidebar link and the ignore.
- **Visual check** — Playwright MCP on `pnpm portal:preview`.

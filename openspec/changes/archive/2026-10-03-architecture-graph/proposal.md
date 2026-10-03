## Why

The codebase is a hexagon — domain, ports, adapters, and the delivery layers
around them — and ESLint enforces its boundaries, but nobody can *see* it. The
API reference lists modules by folder; it does not show which layer reaches
into which. A picture of the dependencies between layers makes the
architecture reviewable at a glance, and makes a surprising dependency (a hook
importing from `app`, say) visible before it becomes a habit.

## What Changes

- Add an **Architecture** page to the docs portal with a graph of the
  dependencies between the codebase's layers: `domain/entities`,
  `domain/ports`, `domain/use-cases`, each adapter family, and `app`,
  `components`, `hooks`, `lib`, `i18n`, `emails`, `content`, `messages`.
- Generate it with **dependency-cruiser**, every module of `src/` collapsed
  into its layer, type-only imports included (ports are interfaces), tests and
  stories left out.
- Render it to SVG with **Graphviz compiled to WebAssembly**
  (`@hpcc-js/wasm-graphviz`), so neither CI nor a laptop needs Graphviz
  installed, in the Immersion Cinema dark palette with the domain layers
  marked in gold.
- `pnpm portal:architecture` writes the SVG; `pnpm portal:build` and
  `pnpm portal:dev` run it before the portal. Sidebar link and home entry.

## Capabilities

### New Capabilities

- `architecture-graph`: the portal page showing the layer dependency graph,
  how it is computed from the code, and how it is drawn.

### Modified Capabilities

<!-- None. `docs-portal`'s requirements hold; the graph is one more part
     generated before the portal is built, like the email gallery and the
     changelog. `architecture-boundaries` is unchanged: ESLint stays the only
     thing that enforces the rules; the graph only shows them. -->

## Non-goals

- Enforcing anything. No dependency-cruiser rules, no CI check on the graph —
  `pnpm lint:domain` already enforces the boundaries, and two validators would
  disagree sooner or later.
- A module-level graph. With ~430 documented modules it is unreadable; the
  graph stops at layers.
- Graphs of `node_modules` or of the portal, scripts or tests.
- Interactivity (zoom, click-through to the API reference).

## Impact

- **New dev dependencies:** `dependency-cruiser`, `@hpcc-js/wasm-graphviz`.
- **New script:** `scripts/architecture-graph/`, with its tests.
- **Portal:** `architecture.mdx`, sidebar link, home entry; the SVG is
  generated and gitignored.
- **Root scripts:** `portal:architecture`, added to `portal:build` and
  `portal:dev`.

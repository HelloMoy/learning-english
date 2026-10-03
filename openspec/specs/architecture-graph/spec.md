# architecture-graph Specification

## Purpose
Define the docs portal's Architecture page: a graph of the dependencies between the layers of `src/` — the domain's entities, ports, use cases and result, each adapter family, and the delivery layers — computed with dependency-cruiser from the code (type-only imports included), rendered to SVG with Graphviz compiled to WebAssembly in the cinema palette, and regenerated on every portal build. It shows the hexagon's boundaries; ESLint, not this graph, enforces them.
## Requirements
### Requirement: The graph shows dependencies between layers

`pnpm portal:architecture` SHALL compute, with dependency-cruiser and the
project's `tsconfig.json`, the dependencies between the modules of `src/`,
collapse every module into its layer — `src/domain/<folder>`,
`src/adapters/<folder>`, or `src/<folder>` for everything else — and draw one
node per layer and one edge per layer that imports from another. Type-only
imports SHALL count. Test files, stories, `src/test-setup`, the Next.js and
Sentry entry files (`instrumentation*`, `sentry.*`, `proxy`) and anything
outside `src/` SHALL be left out.

#### Scenario: Use cases depend on ports
- **WHEN** the graph is computed
- **THEN** it has an edge from `src/domain/use-cases` to `src/domain/ports`, although use cases import ports only as types

#### Scenario: Only layers appear
- **WHEN** the graph is computed
- **THEN** every node names a layer under `src/`, and none is a single module, a test, a story or a package

### Requirement: The graph is drawn in Immersion Cinema dark without system tools

The graph SHALL be rendered to SVG with Graphviz compiled to WebAssembly, so
no Graphviz installation is needed, and written to
`docs-portal/public/architecture/layers.svg`, which git ignores. Its nodes,
labels and edges SHALL take their colours from the cinema-dark tokens in
`src/app/globals.css`, with the domain layers outlined in `--gold`; a test
MUST fail when a colour drifts from its token.

#### Scenario: The domain stands out
- **WHEN** the SVG is opened
- **THEN** the `domain/*` nodes are outlined in gold and every other node in the border colour

### Requirement: The portal shows the architecture

The portal SHALL have an "Architecture" page at `/architecture/` that
introduces the layers in a short paragraph, notes that ESLint
(`pnpm lint:domain`) enforces the boundaries the graph shows, and displays the
SVG with a text alternative. The sidebar SHALL link it, and the home page
SHALL offer an entry to it. `pnpm portal:build` and `pnpm portal:dev` SHALL
run `pnpm portal:architecture` before the portal is built or served.

#### Scenario: Reaching the graph
- **WHEN** a reader follows "Architecture" in the sidebar
- **THEN** `/architecture/` shows the layer graph

#### Scenario: A new layer appears on its own
- **WHEN** a folder such as `src/workers` is added and imported from `src/lib`
- **THEN** the next portal build shows a `src/workers` node with an edge from `src/lib`


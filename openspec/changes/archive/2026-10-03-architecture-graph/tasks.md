## 1. Dependencies

- [x] 1.1 Add `dependency-cruiser` and `@hpcc-js/wasm-graphviz` as dev dependencies (check `package.json` afterwards)

## 2. Graph script

- [x] 2.1 (TDD: test → impl) `CINEMA_GRAPH_COLORS` equal their `.dark` tokens in `globals.css`
- [x] 2.2 (TDD: test → impl) `cruiseLayers()` returns DOT with only layer nodes, the type-only `domain/use-cases → domain/ports` edge, and no tests or stories
- [x] 2.3 (TDD: test → impl) `renderSvg(dot)` returns an SVG with the domain nodes outlined in gold; `writeArchitectureGraph(svg, portalDir)` writes `public/architecture/layers.svg`; add `main`

## 3. Portal wiring

- [x] 3.1 (TDD: test → impl) In `docs-portal.test.ts`, assert `portal:architecture`, its place in `portal:build` and `portal:dev`, the "Architecture" sidebar link and the ignored SVG; implement
- [x] 3.2 Write `architecture.mdx` and the home entry

## 4. Verification

- [x] 4.1 Run `pnpm portal:build`; check the page with Playwright MCP (desktop and phone)
- [x] 4.2 Run `pnpm verify`

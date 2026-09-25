## 1. Wiring

- [x] 1.1 Integration test: bootstrapping TypeDoc over a small fixture with the plugin loaded renders `index.html`, a function page and `assets/custom.css` under the `cinema` theme (TDD: test → impl: `load(app)` registering a `CinemaTheme` that still renders the default templates)
- [x] 1.2 Point `typedoc.json` at the plugin (`plugin`, `theme: "cinema"`, `customCss`, `includeVersion`, both highlight themes) and run `docs` / `docs:watch` through `tsx`; confirm `pnpm run docs` succeeds

## 2. Module index (pure logic)

- [x] 2.1 `displayModuleName` collapses a repeated final segment and leaves other names alone (TDD: test → impl)
- [x] 2.2 `folderOf` returns the first segment, or the first two under `domain/`, and a root label for top-level modules (TDD: test → impl)
- [x] 2.3 `groupModulesByFolder` orders layer groups first in layer order, then the rest alphabetically (TDD: test → impl)
- [x] 2.4 `countModulesInLayer` counts modules under a folder prefix without matching sibling prefixes (`hooks` vs `hooks-x`) (TDD: test → impl)

## 3. Home page

- [x] 3.1 Marquee renders the project name eyebrow, headline, version badge and module-count badge (TDD: test → impl)
- [x] 3.2 Layer posters render one poster per layer with path, count, title, blurb and a link to the group anchor (TDD: test → impl)
- [x] 3.3 Module index renders grouped rows with collapsed name, module link, first short summary and distinct kinds (TDD: test → impl)
- [x] 3.4 `CinemaThemeContext` renders the home page for the project model, skips the default header there, and delegates other models to the default template (TDD: integration test → impl)

## 4. Chrome

- [x] 4.1 Toolbar renders the wordmark with a gold dot and `API` tag and keeps TypeDoc's search and menu IDs (TDD: test → impl)
- [x] 4.2 Declaration header renders breadcrumb, kind eyebrow and a name-only `h1` (TDD: test → impl)
- [x] 4.3 Footer renders the wordmark and the `pnpm run docs` regenerate line, keeping the footer hooks (TDD: test → impl)

## 5. Stylesheet

- [x] 5.1 `cinema.css`: cinema tokens over every TypeDoc `data-theme` state, glow background, hidden theme selector, typography (Geist / Geist Mono)
- [x] 5.2 `cinema.css`: toolbar, sidebar navigation, page menu, breadcrumbs, badges
- [x] 5.3 `cinema.css`: home marquee, posters, module index, responsive breakpoints
- [x] 5.4 `cinema.css`: declaration pages — signature panel, section headings, parameter lists, code blocks, sources
- [x] 5.5 Pick the Shiki highlight theme by visual check against the mock

## 6. Verification

- [x] 6.1 Run `pnpm run docs`, serve it, and check home, a function page, a type page and a component page with Playwright MCP at desktop and 400px, including the search dialog and a stored `tsd-theme = light`
- [x] 6.2 Run `pnpm verify` (typecheck, format, lint, `pnpm test:run`) and fix any failure

## 7. Pre-PR refinements

- [x] 7.1 Favicon and cache busting: pages link `assets/favicon.svg` and load `custom.css` with a `?cache=` query (TDD: integration test → `typedoc.json`); `docs:serve` runs `http-server` with caching off
- [x] 7.2 Row summaries prefer a documented function or class, then a variable or enum, then anything else (TDD: test → impl)
- [x] 7.3 Layer posters and the signature panel on flat card surfaces, with the page glow as the only gradient; check in the browser
- [x] 7.4 Run `pnpm verify` and regenerate the reference


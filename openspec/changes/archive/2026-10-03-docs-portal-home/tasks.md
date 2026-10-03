## 1. Outbound link rule

- [x] 1.1 (TDD: test → impl) `opensOutsideStarlight(href)` in `docs-portal/src/outbound-links.mjs`: absolute URLs, `/storybook/` and `/api/` paths, and file paths leave; portal pages and anchors stay; export `NEW_TAB`
- [x] 1.2 (TDD: test → impl) `SIDEBAR` in `docs-portal/src/navigation.mjs`: five entries, the outbound ones with `attrs: NEW_TAB`; `astro.config.mjs` uses it and wires `rehype-external-links` with the rule (add the dependency with `pnpm --dir docs-portal add`)
- [x] 1.3 (TDD: test → impl) The guard: every HTML link under `docs-portal/src/` that leaves Starlight opens a new tab; fix `architecture.mdx`

- [x] 1.4 (TDD: test → impl) `paginationWithinStarlight` drops previous/next links that leave Starlight; a Starlight route middleware (`src/route-data.ts`) applies it — found when the built `/emails/` offered "Previous: API reference"

## 2. Release summary

- [x] 2.1 (TDD: test → impl) `readReleaseSummary(git)` in `docs-portal/src/release-summary.mjs`, with a fake runner: a release, and no release (git failing)

## 3. Home page

- [x] 3.1 Components `HomeHero`, `HeroSearch`, `ReferenceCard`, `ReleaseStrip` under `docs-portal/src/components/home/`, and their styles
- [x] 3.2 Rewrite `index.mdx` with them; Emails card reads `email-gallery.json`
- [x] 3.3 Outward arrow for sidebar links that open a new tab

## 4. Verification

- [x] 4.1 `pnpm portal:build`; built changelog commit links and home cards carry `target="_blank"`; Playwright MCP check on desktop and phone, hero search opens the dialog
- [x] 4.2 `pnpm verify`

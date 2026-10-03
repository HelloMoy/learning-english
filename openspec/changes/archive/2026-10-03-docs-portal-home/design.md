## Context

- The home (`docs-portal/src/content/docs/index.mdx`) is a splash page with
  Starlight's `hero` front matter and a `CardGrid` of five `LinkCard`s.
- Starlight renders splash pages (no sidebar) at `--sl-content-width:
  67.5rem`. Its search is `<site-search>` with a `button[data-open-modal]`
  that opens the Pagefind dialog; `⌘K`/`Ctrl+K` already open it.
- Sidebar link entries accept `attrs` (HTML attributes on the `<a>`).
- Generated before Astro builds: `src/email-gallery.json` (kinds × locales),
  the changelog page, the architecture SVG. Storybook and TypeDoc land in
  `dist/storybook/` and `dist/api/` after Astro.
- The workflow checks out full history with tags; `git describe` works in CI.
- Root Vitest excludes `docs-portal/**` from collection but can import plain
  `.mjs` modules from it, as long as they import nothing from the portal's own
  `node_modules` (the `verify` job does not install them).

## Goals / Non-Goals

**Goals:** the recommended home, drawn in the cinema palette; one enforced
rule for links leaving Starlight.

**Non-Goals:** see the proposal — no screenshots, no stale counts, no custom
header.

## Decisions

### 1. Plain modules for the rules, so the root tests can import them

- `docs-portal/src/outbound-links.mjs` — `opensOutsideStarlight(href)`,
  `HOSTED_SITES = ["/storybook/", "/api/"]`, and `NEW_TAB = { target:
  "_blank", rel: "noopener noreferrer" }`. No imports.
- `docs-portal/src/navigation.mjs` — `SIDEBAR`: the five entries, each
  outbound one carrying `attrs: NEW_TAB`. `astro.config.mjs` imports it.
- `docs-portal/src/release-summary.mjs` — `readReleaseSummary(git)`,
  returning `{ version, date, waiting }` or `undefined` before the first
  release (or when git fails), by running `git describe --tags --abbrev=0 --match
  "v[0-9]*"`, `git log -1 --format=%cs <tag>` and `git rev-list --count
  --no-merges <tag>..HEAD` through an injected runner, so tests pass a fake.

**Why not compute in the components only:** the root suite runs where the
portal's dependencies are not installed; `.mjs` files with no imports are the
only portal code it can reach.

### 2. Markdown links via `rehype-external-links`

`astro.config.mjs` sets `markdown.rehypePlugins` to
`[rehypeExternalLinks, { test: (el) => opensOutsideStarlight(el.properties.href), target: "_blank", rel: ["noopener", "noreferrer"] }]`.
Astro applies it to `.md` and `.mdx` content, so the generated changelog's
commit links and any future Markdown link follow the rule. Astro 7's default
Markdown processor (Sätteri) does not run rehype plugins: they need
`@astrojs/markdown-remark` installed (a Starlight peer dependency), so the
portal adds it — without it `astro build` refuses the config.

It does not reach HTML written inside MDX (`<a …>` is a JSX element there,
not a HAST element), nor Astro components. Those carry the attributes
themselves, and the test below guards them.

### 3. The home components (`docs-portal/src/components/home/`)

- `HomeHero.astro` — eyebrow, headline, lede, the glow, and `HeroSearch`.
- `HeroSearch.astro` — a `<button>` drawn as a search field (icon,
  placeholder text, `⌘K` hint) whose click calls `.click()` on
  `site-search button[data-open-modal]`. A real button, so it is focusable
  and announced; Starlight's dialog does the rest.
- `ReferenceCard.astro` — props `href`, `eyebrow`, `title`, `description`,
  `size` (`"feature"` | `"compact"`); a `preview` slot (feature) or `icon`
  slot (compact). It applies `NEW_TAB` and the arrow when
  `opensOutsideStarlight(href)`, plus a visually hidden "(opens in a new
  tab)".
- `ReleaseStrip.astro` — calls `readReleaseSummary` with a runner that uses
  `execFileSync("git", …)` at build time; renders nothing without a tag.

`index.mdx` drops the `hero` front matter (the custom hero replaces it), keeps
`template: splash`, and composes these. Preview drawings are `aria-hidden`
markup in the card's slot; the Emails card text reads `gallery.length` and the
first entry's locales from `src/email-gallery.json`.

### 4. Pagination stays in Starlight

Starlight's previous/next links come from the sidebar and ignore its `attrs`,
so `/emails/` offered "Previous: API reference" in the same tab. A Starlight
route middleware (`src/route-data.ts`, `routeMiddleware` in the config) runs
`paginationWithinStarlight` on every page, dropping links that leave
Starlight rather than opening another site as a "previous page".

### 5. Arrows and labels

`cinema.css` adds an outward-arrow after sidebar links with
`target="_blank"`. Cards draw their own arrow icon. Commit links in the
changelog get no arrow — hundreds of them would be noise; they still open in
a new tab.

### 6. The guard test

`src/deployment/docs-portal-home.test.ts` reads every `.mdx`/`.astro` under
`docs-portal/src/`, finds `<a …href="…"…>` tags (multi-line), and fails for
each one whose `href` leaves Starlight without `target="_blank"`, naming the
file and the link.

## Risks / Trade-offs

- **Starlight's search button markup could change** → the selector is
  `button[data-open-modal]`, Starlight's own hook; the visual check catches a
  break, and the hero still shows the `⌘K` hint.
- **A link built in a component from a variable escapes the guard** → the
  guard reads literal `href`s; `ReferenceCard` and `navigation.mjs` apply the
  rule in code, and their unit tests cover it.
- **`git` missing at build** → `readReleaseSummary` returns `undefined` and
  the strip is skipped instead of failing the build.

## Testing strategy

- **Vitest unit (node), `src/deployment/docs-portal-home.test.ts`** — mirrors
  `src/deployment/docs-portal.test.ts`: `opensOutsideStarlight` for each kind
  of link; `SIDEBAR` entries and their `attrs`; `readReleaseSummary` with a
  fake runner (a release, and no release — git failing); the
  guard over every page; `astro.config.mjs` wiring the rehype plugin and
  `SIDEBAR`.
- **Build** — `pnpm portal:build`, then the built changelog's commit links and
  the home's cards carry `target="_blank"`.
- **Visual check** — Playwright MCP on `pnpm portal:preview`: desktop and
  phone, the hero search opening the dialog, the cards opening new tabs.

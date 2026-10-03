## 1. Isolate the portal from the app

- [x] 1.1 (TDD: test → impl) In `src/deployment/docs-portal.test.ts`, assert the root `package.json` lists neither `astro` nor `@astrojs/starlight` and that `portal:install` installs `docs-portal` as its own workspace root (`--dir docs-portal` + its own `pnpm-workspace.yaml`); add the `portal:install` script
- [x] 1.2 (config, no behaviour) Exclude `docs-portal/` from `tsconfig.json`, the ESLint `globalIgnores` and Vitest's `exclude`; add its `dist/` and `.astro/` to `.prettierignore`; ignore `docs-portal/dist/`, `docs-portal/.astro/` and `docs-portal/node_modules/` in `.gitignore`

## 2. Scaffold the Starlight portal

- [x] 2.1 (TDD: test → impl) Assert `docs-portal/astro.config.mjs` declares `site: "https://docs.english-course.online"` and no `base`; create `docs-portal/` (`package.json`, `astro.config.mjs`, `src/content.config.ts`) and install `astro` + `@astrojs/starlight` with `pnpm portal:install`
- [x] 2.2 (TDD: test → impl) Assert the sidebar links `/storybook/` and `/api/`; add both entries ("Design system", "API reference") to the Starlight config
- [x] 2.3 Write the home page `docs-portal/src/content/docs/index.mdx` in English: a one-paragraph introduction, a note that the site tracks `develop`, and one entry each for the design system (`/storybook/`) and the API reference (`/api/`)

## 3. Immersion Cinema dark

- [x] 3.1 (TDD: test → impl) Assert every `--sl-color-*` in `docs-portal/src/styles/cinema.css` equals the `.dark` token it maps to in `src/app/globals.css` (read with `readCinemaTokens`), failing with the property and both values; write `cinema.css` and register it in `customCss`, with Geist and Geist Mono in Starlight's `head`
- [x] 3.2 (TDD: test → impl) Assert the config overrides `ThemeProvider`, `ThemeSelect` and `SiteTitle`; add the three components: an empty provider (so the server-rendered `data-theme="dark"` stands), an empty selector, and a site title rendering `ENGLISH·COURSE` with a gold dot and a `DOCS` tag styled like `.cinema-api-tag`

## 4. Assemble the whole site

- [x] 4.1 (TDD: test → impl) Assert `portal:build` builds Astro first, then Storybook into `docs-portal/dist/storybook`, then TypeDoc into `docs-portal/dist/api`, joined with `&&`, and that `portal:preview` and `portal:dev` run Astro's `preview` and `dev`; add the scripts
- [x] 4.2 Run `pnpm portal:build`; confirm the three `index.html` files exist and `git status` shows nothing new under `docs-portal/` beyond its sources

## 5. Workflow

- [x] 5.1 (TDD: test → impl) Assert `.github/workflows/docs-portal.yml` triggers on `pull_request` and on `push` to `develop`, runs `pnpm portal:build`, checks the three `index.html` files, uploads `docs-portal/dist`, and runs the deploy job only on a push; write the workflow (build + deploy jobs, concurrency, least-privilege permissions, pnpm 11, Node 22)

## 6. Visual check

- [x] 6.1 With `pnpm portal:preview`, drive the site through Playwright MCP: cinema-dark under a light colour-scheme preference, no theme selector, wordmark with gold dot and `DOCS` tag, and both home entries loading Storybook at `/storybook/` and the API reference at `/api/`

## 7. GitHub settings

- [x] 7.1 Enable GitHub Pages with build type `workflow`
- [x] 7.2 Add a deployment-branch policy allowing `develop` on the `github-pages` environment; confirm with `gh api`
- [x] 7.3 Set the Pages custom domain to `docs.english-course.online` (before the DNS record exists); confirm with `gh api`
- [x] 7.4 Hand the owner the GoDaddy records: `CNAME docs → hellomoy.github.io` and the domain-verification `TXT` from *Settings → Pages → Verified domains*

## 8. Verification

- [x] 8.1 Run `pnpm verify` (typecheck, format, lint, `pnpm test:run`) and `pnpm portal:build`; `pnpm test:e2e` is not affected — no app code changes

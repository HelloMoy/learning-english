## Context

Two generated references exist today, both only locally:

- **Storybook** (`pnpm storybook` / `pnpm build-storybook`), themed by
  `storybook-workshop-theme`. Its static build uses relative asset paths
  (`./sb-manager/...`), so it works from any sub-path. It copies the tracked
  `public/` folder (about 50 MB) through `staticDirs`.
- **TypeDoc** (`pnpm run docs` → `docs/`, gitignored), themed by
  `api-reference-theme`. Its HTML is relative too. Today it builds with 0
  errors and 156 unresolved-link warnings.

The repository is public and GitHub Pages is not enabled. A repository has
one Pages site, and each deployment replaces the whole site — so both
references and the portal must be built and deployed together, by one
workflow. The site will be served on `docs.english-course.online`; the
`english-course.online` zone is managed in GoDaddy, where `develop` already
has a `CNAME` for the Vercel preview.

The app deploys through Vercel's Git integration, outside GitHub Actions.
`ci.yml` runs on pull requests and on pushes to `main`; it does not run on
pushes to `develop`.

## Goals / Non-Goals

**Goals:**

- A Starlight portal at `/`, Storybook at `/storybook/`, TypeDoc at `/api/`,
  all on one Pages site.
- Every pull request proves the three still build; every push to `develop`
  publishes them.
- One local command builds exactly what CI builds.
- Room for written documentation later, without moving the references' URLs.

**Non-Goals:** see the proposal's Non-goals. In short: no written pages yet,
no TypeDoc-in-Starlight, no React in the portal yet, no story tests, no
warnings-as-errors, no i18n, no changes to `ci.yml`.

## Decisions

### 1. Starlight in a standalone `docs-portal/` project, installed apart from the app

`docs-portal/` gets its own `package.json`, `pnpm-lock.yaml` and
`pnpm-workspace.yaml`, and is installed with `pnpm install --dir docs-portal`.
Its own `pnpm-workspace.yaml` makes it the nearest workspace root, so pnpm
installs it on its own; it also carries the portal's `allowBuilds`
(`esbuild: true`, as at the root), without which pnpm 11 fails the install
with `ERR_PNPM_IGNORED_BUILDS`. `--ignore-workspace` was tried first and
rejected: it ignores that file, so the build approval is lost and the install
fails.

- **Why not root dependencies:** Astro brings its own Vite and a large
  dependency tree. In the root `package.json` it would ride along in every app
  install, including Vercel's production and preview builds, and could clash
  with the Vite that Storybook and Vitest resolve.
- **Why not a pnpm workspace package:** listing it under `packages:` in
  `pnpm-workspace.yaml` makes the root `pnpm install` — and therefore Vercel —
  install it as well. A separate workspace root keeps it fully apart, at the
  cost of a second lockfile.
- **Folder name:** `docs/` is taken (TypeDoc's gitignored output and VitePress'
  convention, which would collide). `docs-portal/` says what it is.

Root tooling ignores it: `tsconfig.json` `exclude` (its `content.config.ts`
imports Astro virtual modules the root compiler cannot resolve), the ESLint
`globalIgnores`, `.prettierignore` for its build output and cache, and Vitest's
`exclude`. `.gitignore` ignores `docs-portal/dist/`, `docs-portal/.astro/` and
its `node_modules/`.

### 2. Assemble after the Astro build, into `docs-portal/dist/`

```
pnpm portal:build
  = pnpm --dir docs-portal run build                        → dist/ (cleans it first)
  && storybook build -o docs-portal/dist/storybook          → dist/storybook/
  && pnpm run docs --out docs-portal/dist/api               → dist/api/
```

- **Order matters:** `astro build` empties its `outDir`, so it runs first.
  Storybook and TypeDoc each clean only their own sub-folder.
- **Why not through Astro's `public/`:** copying the two builds into
  `docs-portal/public/` would make Astro re-copy 50+ MB and couple the portal
  build to the other two. Writing them straight into `dist/` keeps each tool's
  output byte-for-byte what it produces.
- **Search stays scoped:** Starlight's Pagefind index is built during
  `astro build`, before the references land, so it covers portal pages only.
  Each reference keeps its own search.
- `&&` makes the first failing build stop the command with its exit code.
- `pnpm portal:preview` runs `astro preview`, which serves `dist/` — references
  included — from the root, as deployed. `pnpm portal:dev` runs `astro dev`
  for writing portal pages (the references are absent there).

`--out` on the command line overrides `typedoc.json`'s `out`, so the local
`pnpm run docs` → `docs/` flow and `pnpm docs:serve` are untouched.

### 3. Custom domain at the root, so no base path

`astro.config.mjs` sets `site: "https://docs.english-course.online"` and no
`base`. Serving from a domain root means the portal's links need no prefix,
sidebar entries such as `{ label: "Design system", link: "/storybook/" }` and
the home page's `/storybook/` and `/api/` links are plain root-relative paths,
and `site` gives Starlight the canonical URLs and sitemap it emits.

- **Why the domain lives in GitHub settings, not a `CNAME` file:** with a
  GitHub Actions deployment, GitHub ignores any `CNAME` file in the artifact;
  the domain is the repository's Pages setting. The domain is set there
  **before** the DNS record exists, as GitHub advises, so there is no window
  in which the record points at Pages while no repository claims it.
- **Why also verify the domain:** a verified `english-course.online` on the
  GitHub account stops any other account from serving a site on one of its
  subdomains if the Pages site is ever disabled while the `CNAME` remains.
- **HTTPS:** GitHub provisions the certificate once DNS resolves; "Enforce
  HTTPS" is switched on as soon as it is issued. The default
  `hellomoy.github.io/learning-english/` address then redirects to the domain.

Astro has no client-side router by default (Starlight does not enable view
transitions), so following either link is a full page load into the
reference — no special attribute is needed, unlike VitePress.

### 4. Immersion Cinema dark, forced, with a drift test

- `docs-portal/src/styles/cinema.css` sets Starlight's `--sl-color-*`
  properties on `:root` to the literal `.dark` values of
  `src/app/globals.css`: page `--background`, nav and sidebar `--sidebar`,
  text and white `--foreground`, gray-3 `--muted-foreground`, hairlines
  `--border`, inline code `--card`, accent `--gold`, accent-high `--amber`.
  Fonts are Geist and Geist Mono, loaded from Google Fonts in Starlight's
  `head`.
- **Forcing dark:** Starlight renders `<html data-theme="dark">` on the
  server; its `ThemeProvider` is the inline script that switches that to the
  stored or OS preference, and `ThemeSelect` renders the toggle. Both are
  replaced through Starlight's `components` option by empty components, so the
  server's `dark` stands for every reader — one whose OS prefers light still
  gets cinema-dark, as the API reference does.
- **Wordmark:** Starlight's `SiteTitle` is overridden to render
  `ENGLISH·COURSE` with a gold dot plus a `DOCS` tag styled like
  `.cinema-api-tag` in `scripts/typedoc-cinema-theme/cinema.css`.
- **Header divider and favicon:** without social links or a theme selector,
  Starlight's divider after the (empty) social-icons group would stand alone,
  so `cinema.css` hides it while that group is empty. The favicon is a copy of
  the app's `src/app/icon.svg` in `docs-portal/public/favicon.svg` — a copy,
  not a symlink, because the Pages artifact must carry the file itself.
- **Why literals plus a test, not an import:** the portal is a separate
  project that cannot import the app's stylesheet without pulling Tailwind's
  pipeline into Astro. Copying the values and failing a test on drift is the
  same trade `storybook-workshop-theme` makes for the Storybook manager.

### 5. One workflow, two triggers: `.github/workflows/docs-portal.yml`

```yaml
on:
  pull_request:
  push:
    branches: [develop]

jobs:
  build:   # install app + portal, pnpm portal:build, check the three index.html,
           # upload-pages-artifact (docs-portal/dist) only on push
  deploy:  # needs: build; if: push to develop; environment github-pages
```

- **Why one workflow, not a job in `ci.yml`:** the pull-request check then
  runs exactly the build that deploys, defined once. A separate validation job
  in `ci.yml` would duplicate the steps and could drift until a green pull
  request fails to deploy. `ci.yml` also stays as it is.
- **Concurrency:** the build job groups on `docs-portal-${{ github.ref }}` and
  cancels in progress only for pull requests; the deploy job groups on
  `pages` and never cancels, so a deployment always finishes.
- **Permissions:** `contents: read` for build; `pages: write` and
  `id-token: write` only on deploy.
- **Toolchain:** pnpm 11 and Node 22, as in `ci.yml`. The app install is
  needed because Storybook and TypeDoc read the app's sources and
  dependencies.
- **Smoke check:** after `portal:build`, the job fails unless
  `dist/index.html`, `dist/storybook/index.html` and `dist/api/index.html`
  exist.

### 6. GitHub settings (one-off, outside the repo)

- Enable Pages with build type `workflow` (`POST /repos/{owner}/{repo}/pages`).
- The `github-pages` environment only allows the default branch (`main`) by
  default. Add a deployment-branch policy for `develop`, or the first deploy is
  rejected with "Branch develop is not allowed to deploy".
- Set the custom domain `docs.english-course.online`
  (`PUT /repos/{owner}/{repo}/pages` with `cname`), then — once the
  certificate is issued — `https_enforced: true`.

**DNS, in GoDaddy (done by the owner; no API access from here):**

| Type | Name | Value |
| --- | --- | --- |
| `CNAME` | `docs` | `hellomoy.github.io` |
| `TXT` | the challenge host GitHub shows under *Settings → Pages → Verified domains* | the challenge value GitHub shows |

## Risks / Trade-offs

- **The deployed site reflects `develop`, not production** → intended: it is
  internal documentation of what has been integrated. Stated on the portal
  home.
- **A second lockfile to keep current** → small (Astro + Starlight); Dependabot
  is not configured for either lockfile today, so nothing changes there.
- **Copied colour literals can drift** → the drift test fails on any
  difference, naming the property and both values.
- **Starlight component overrides depend on its internal component names**
  (`ThemeProvider`, `ThemeSelect`, `SiteTitle`) → they are part of Starlight's
  documented override API; the versions are pinned by the lockfile, and the
  visual check in the tasks catches a regression on upgrade.
- **PR builds add a few minutes of runner time** → the repository is public,
  so Actions minutes are free; the job runs alongside `ci.yml`, not after it.
- **Storybook ships the 50 MB `public/` folder** → well under the Pages 1 GB
  limit, and every file is already public in the repository.
- **Pull requests from forks** cannot deploy anyway (no `pages: write` on
  `pull_request`), and the deploy job does not run for them.
- **The site is unreachable on its domain until DNS is in place** → the
  `CNAME` record is a manual GoDaddy step; until it propagates, the site is
  served at the default Pages address. HTTPS enforcement waits for the
  certificate, which needs that record.
- **Subdomain takeover if Pages is disabled but the record stays** → the
  account-level domain verification blocks other accounts from claiming it;
  the rollback step removes the record too.

## Migration Plan

1. Enable Pages, allow `develop`, and set the custom domain (before DNS).
2. Owner adds the `CNAME` (and the verification `TXT`) in GoDaddy.
3. Merge to `develop` after the pull request's `docs-portal` check is green.
4. The push to `develop` deploys; the site appears at
   `https://docs.english-course.online` once DNS resolves.
5. Enforce HTTPS when GitHub reports the certificate issued.
6. **Rollback:** disable Pages in the repository settings and remove the
   `docs` `CNAME` record; nothing in the app depends on the portal.

## Testing strategy

- **Vitest unit (node environment),
  `src/deployment/docs-portal.test.ts`** — mirrors
  `src/deployment/deployment.test.ts`, which guards repository contracts by
  reading files and matching lines without a YAML parser. It covers:
  - the root `package.json` lists neither `astro` nor `@astrojs/starlight`,
    the portal has its own `pnpm-workspace.yaml`, and the `portal:*` scripts
    install it with `--dir docs-portal`, build Astro
    first, then Storybook into `dist/storybook`, then TypeDoc into `dist/api`;
  - `docs-portal/astro.config.mjs` declares
    `site: "https://docs.english-course.online"` with no `base`, and overrides `ThemeProvider`, `ThemeSelect` and `SiteTitle`;
  - the workflow triggers on pull requests and pushes to `develop`, runs
    `pnpm portal:build`, uploads `docs-portal/dist`, and gates the deploy job
    on a push;
  - every `--sl-color-*` value in `docs-portal/src/styles/cinema.css` equals
    the `.dark` token it maps to — the same check
    `.storybook/cinema-theme.test.ts` makes for the Storybook manager, reading
    `globals.css` with `readCinemaTokens` from `.storybook/cinema-tokens.ts`.
- **Build itself** — `pnpm portal:build` locally, and the workflow's smoke
  check in CI, prove the three tools build and land in place.
- **Visual and navigation check** — Playwright MCP against
  `pnpm portal:preview`: cinema-dark under a light OS preference, no theme
  selector, wordmark and `DOCS` tag, both home entries
  load the references at `/storybook/` and `/api/`.
- **No Playwright e2e spec:** the e2e suite runs against the Next.js app; a
  portal spec would need a second web server for a static site whose
  structure the unit tests and the CI smoke check already pin.
- **After the first deploy:** open the three URLs on
  `https://docs.english-course.online`, and confirm `http://` redirects to
  `https://`.

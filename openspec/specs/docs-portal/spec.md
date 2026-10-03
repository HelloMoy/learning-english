# docs-portal Specification

## Purpose
Define the published documentation portal at `https://docs.english-course.online`: one GitHub Pages site that serves a Starlight portal at `/`, the Storybook build at `/storybook/` and the TypeDoc reference at `/api/`, dressed in Immersion Cinema dark under the `ENGLISH·COURSE` wordmark tagged `DOCS`. It covers the command that assembles the site, the portal's isolation from the app's install and checks, and the workflow that builds the site on every pull request and deploys it on every push to `develop`. How Storybook and the API reference look on their own stays with `storybook-workshop-theme` and `api-reference-theme`.
## Requirements
### Requirement: One site serves the portal, the design system and the API reference

The documentation portal SHALL be published on GitHub Pages at the custom
domain `https://docs.english-course.online` as a single site with three
parts:

- `/` — the Starlight portal.
- `/storybook/` — the Storybook static build, exactly as `storybook build`
  produces it.
- `/api/` — the TypeDoc HTML, exactly as `pnpm run docs` produces it with the
  `cinema` theme.

The site SHALL be served from the root of that domain, over HTTPS only, and
the portal's canonical URLs and sitemap SHALL use that domain. The repository's
default Pages address (`https://hellomoy.github.io/learning-english/`) SHALL
redirect to it.

#### Scenario: Each part answers at its path
- **WHEN** the deployed site is opened at `https://docs.english-course.online/`, `/storybook/` and `/api/`
- **THEN** the first shows the portal home, the second the Storybook manager and the third the API reference home

#### Scenario: Plain HTTP is upgraded
- **WHEN** a reader opens `http://docs.english-course.online/`
- **THEN** they are redirected to `https://docs.english-course.online/`

#### Scenario: Canonical URLs name the custom domain
- **WHEN** the portal's generated pages are inspected
- **THEN** their canonical link and sitemap entries start with `https://docs.english-course.online/`

### Requirement: The portal home leads to both references

The portal home page SHALL introduce the project in one short paragraph and
offer one entry for the design system (linking to `/storybook/`) and one for
the API reference (linking to `/api/`). The portal's sidebar configuration
SHALL list the same two links, so every portal page that shows a sidebar
offers them; the home page uses Starlight's splash layout, which has none.
Both links SHALL load the reference as a full page, not through the portal's
client-side navigation. The portal SHALL be in English only.

#### Scenario: Reaching Storybook from the home page
- **WHEN** a reader opens the portal home and follows the design system entry
- **THEN** the browser loads `/storybook/` and Storybook renders

#### Scenario: Reaching the API reference from the home page
- **WHEN** a reader opens the portal home and follows the API reference entry
- **THEN** the browser loads `/api/` and the API reference home renders

#### Scenario: The sidebar offers both references
- **WHEN** the portal's Starlight configuration is read
- **THEN** its sidebar links "Design system" to `/storybook/` and "API reference" to `/api/`

### Requirement: The portal wears Immersion Cinema dark

The portal SHALL render in the Immersion Cinema dark palette whatever the
reader's operating-system preference: its page, navigation and sidebar
surfaces, text, borders and accent SHALL take their colours from the
cinema-dark tokens declared under `.dark` in `src/app/globals.css`, with
`--gold` as the accent. Starlight's theme selector SHALL NOT be shown. The
site title SHALL be the `ENGLISH·COURSE` wordmark with the middle dot in gold,
tagged `DOCS` in the same gold tag the API reference uses for `API`.

Every colour the portal takes from a token MUST equal that token's current
`.dark` value, and a test MUST fail when they differ.

#### Scenario: A reader whose OS prefers light
- **WHEN** the portal is opened in a browser that prefers a light colour scheme
- **THEN** it renders on the cinema-dark background with cinema-dark text and gold links

#### Scenario: No theme selector
- **WHEN** any portal page is rendered
- **THEN** the header offers no light/dark/auto choice

#### Scenario: A token change is caught
- **WHEN** a colour in the `.dark` block of `globals.css` changes
- **AND** the portal still carries the old value for that token
- **THEN** a test fails naming the portal property and both values

### Requirement: One command assembles the whole site

`pnpm portal:build` SHALL build the portal and then write the Storybook build
into `docs-portal/dist/storybook/` and the TypeDoc HTML into
`docs-portal/dist/api/`, leaving the complete site in `docs-portal/dist/`. It
SHALL stop with a non-zero exit code as soon as any of the three builds fails.
`pnpm portal:preview` SHALL serve the assembled site locally from the root,
as it is deployed.

#### Scenario: A clean build
- **WHEN** `pnpm portal:build` runs on a checkout where all three tools build
- **THEN** `docs-portal/dist/index.html`, `docs-portal/dist/storybook/index.html` and `docs-portal/dist/api/index.html` exist

#### Scenario: A broken story stops the build
- **WHEN** a story imports a module that does not exist and `pnpm portal:build` runs
- **THEN** the command exits non-zero

### Requirement: The portal stays out of the app's install and checks

The portal SHALL be a standalone project in `docs-portal/` with its own
`package.json` and lockfile. Its dependencies SHALL NOT be added to the root
`package.json`, and installing the app (`pnpm install` at the root, including
Vercel's install) SHALL NOT install them. `pnpm portal:install` SHALL install
them from the portal's lockfile. The root typecheck, lint, format check and
Vitest run SHALL NOT read files under `docs-portal/` other than through tests
written for this capability, and the portal's build output and Astro cache
SHALL be ignored by git.

#### Scenario: The app install does not pull Astro
- **WHEN** the root `package.json` is read
- **THEN** it lists neither `astro` nor `@astrojs/starlight`

#### Scenario: A portal build leaves no tracked changes
- **WHEN** `pnpm portal:build` has run
- **THEN** `git status` reports nothing new under `docs-portal/`

### Requirement: Pull requests validate the site and `develop` deploys it

A GitHub Actions workflow SHALL run `pnpm portal:build` on every pull request
and on every push to `develop`. A run triggered by a pull request SHALL NOT
deploy. A run triggered by a push to `develop` SHALL upload
`docs-portal/dist/` and deploy it to GitHub Pages through the `github-pages`
environment. Deployments SHALL NOT cancel one another; a newer pull-request
run for the same branch SHALL cancel the older one.

#### Scenario: A pull request with a broken Storybook
- **WHEN** a pull request breaks the Storybook build
- **THEN** the workflow's build job fails on that pull request and nothing is deployed

#### Scenario: A merge into develop
- **WHEN** a pull request is merged into `develop`
- **THEN** the workflow builds the site and deploys it, and the deployed site reflects the merged commit

#### Scenario: Pull requests never deploy
- **WHEN** the workflow file is read
- **THEN** its deploy job runs only when the event is a push to `develop`


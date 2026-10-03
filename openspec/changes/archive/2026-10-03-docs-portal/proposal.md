## Why

Storybook (the design system) and the TypeDoc API reference only exist on the
machine of whoever runs `pnpm storybook` or `pnpm run docs`. Nobody can open
them from a link, and nothing checks that they still build: `pnpm verify`
builds neither, so a broken story or a TypeDoc error goes unnoticed until
someone tries to open them locally. More project documentation is planned, so
the two references need a home that written pages can join later.

## What Changes

- Add a documentation portal built with **Starlight** (Astro), published on
  GitHub Pages on the custom domain `https://docs.english-course.online`. Its home page
  introduces the project and links to the two references; its sidebar links to
  them too.
- Serve the Storybook static build at `/storybook/` and the TypeDoc HTML at
  `/api/` on the same site, each exactly as its own tool produces it.
- Dress the portal in the Immersion Cinema dark palette under the
  `ENGLISH·COURSE` wordmark, tagged `DOCS`, matching the `API` and
  `DESIGN SYSTEM` tags the other two already wear.
- Add one command that assembles the whole site locally, so CI and developers
  build it the same way.
- Add a GitHub Actions workflow that builds the assembled site on every pull
  request (validation only) and builds and deploys it on every push to
  `develop`.
- Enable GitHub Pages with "GitHub Actions" as its source, allow `develop`
  to deploy to the `github-pages` environment, and serve the site on
  `docs.english-course.online` over HTTPS.

## Capabilities

### New Capabilities

- `docs-portal`: the published documentation site — its address and layout
  (`/`, `/storybook/`, `/api/`), its look, the command that assembles it, and
  the workflow that validates it on pull requests and deploys it from
  `develop`.

### Modified Capabilities

<!-- None. `api-reference-theme` and `storybook-workshop-theme` keep their
     requirements: the portal serves their output unchanged. -->

## Non-goals

- Moving `GLOSSARY.md`, `DEPLOYMENT.md`, the OpenSpec specs or any other
  written documentation into the portal. The portal is built so those pages
  can be added later; this change adds none.
- Rendering the API reference inside Starlight (for example through
  `typedoc-plugin-markdown`). The TypeDoc HTML keeps its own cinema theme and
  search.
- React components inside the portal (`@astrojs/react`). Starlight was chosen
  so they can be added when a page needs one; none does yet.
- Running the stories as tests (`@storybook/addon-vitest`). The workflow checks
  that Storybook builds, not that every story renders.
- Turning TypeDoc warnings into errors. There are 156 unresolved `{@link}`
  warnings today; the build fails only on errors.
- Translating the portal. Like the API reference, it is English only.
- Changing when `ci.yml` runs, or making the new check a required status check
  in branch protection.
- Protecting the portal behind a login. It is public, like the repository.

## Impact

- **New project:** a standalone Starlight site in `docs-portal/` with its own
  `package.json` and lockfile, installed apart from the app so its
  dependencies never reach the app's install or its Vercel builds.
- **Root tooling:** new `package.json` scripts to install, build and preview
  the portal; `docs-portal/` excluded from the root TypeScript, ESLint,
  Prettier and Vitest scopes; its build output ignored by git.
- **CI:** new `.github/workflows/docs-portal.yml`. `ci.yml` is untouched.
- **GitHub settings:** Pages enabled (source: GitHub Actions) with the custom
  domain `docs.english-course.online` and HTTPS enforced; `develop` added to
  the `github-pages` environment's deployment branches.
- **DNS (GoDaddy):** a `CNAME` record `docs` → `hellomoy.github.io`, and a
  `TXT` record verifying `english-course.online` for the GitHub account so no
  other account can claim the subdomain. These are made in GoDaddy by the
  owner; they are not in the repository.
- **Visibility:** the site is public, like the repository. Storybook copies
  the tracked `public/` folder (about 50 MB), which is already public in the
  repo.

## Why

The repository's front page is still the `create-next-app` README: it says the
project is "bootstrapped with create-next-app", tells readers to edit
`app/page.tsx`, and never mentions what English Course is or where it runs.
Production, the `develop` preview and the docs portal are all live now, so the
first thing a visitor sees should say what the product is and link to all three.

## What Changes

- Replace `README.md` with the "A · Marquesina" design picked on the design
  canvas (<https://claude.ai/artifact/2XcKUEJdA1NfFPcqhpETVZ>):
  - an Immersion Cinema banner (wordmark, headline, the _ship / sheep_ motif);
  - three link buttons — **Live app**, **Develop preview**, **Docs portal** —
    each an image wrapped in a link;
  - a row of status badges (CI, docs portal, latest release, Next.js, Node);
  - sections: _What this is_, _Environments_, _Stack_, _Run it locally_,
    _How we work_.
- Add the four images the README shows under `.github/assets/readme/`.
- Add a guard test so the README cannot drift from the repository: the three
  environment URLs stay linked and copyable, every image exists and has alt
  text, every button paints the address it links to, and every `pnpm` script
  and repository file the README names exists.
- Remove the `create-next-app` boilerplate (Getting Started with four package
  managers, Learn More, Deploy on Vercel).

## Capabilities

### New Capabilities

- `repo-readme`: what the repository's README must tell a visitor — the product,
  the three environments and who can open each, how to run it — and the checks
  that keep those statements true.

### Modified Capabilities

_None._ The docs portal, deployment and release requirements are unchanged; the
README only links to what they already publish.

## Non-goals

- The repository's _About_ panel (description, website, topics). It is a GitHub
  setting, not a file; it is updated by hand once the README lands.
- Screenshots of the product in the README. That was the "C · Vitrina" direction.
- A generator for the images. They are hand-authored SVG, edited as text.
- Translating the README. Repository documentation is English-only.
- Changing `AGENTS.md`, `DEPLOYMENT.md` or any other document the README links to.

## Impact

- `README.md` — rewritten.
- `.github/assets/readme/` — new: `banner.svg`, `button-live.svg`,
  `button-develop.svg`, `button-docs.svg`.
- `src/deployment/readme.test.ts` — new guard test, beside the other
  repository-level guards.
- No dependencies, no application code, no configuration.
- External: badges are served by shields.io and read this public repository's
  workflow and release status.

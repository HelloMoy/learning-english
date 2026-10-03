## Why

The portal home is still the first draft: a stock Starlight hero and five
equal link cards. It does not look like the API reference or Storybook home
pages beside it, buries search in the header, gives every reference the same
weight although the design system and the API are the ones used daily, and
says nothing about what is in production. The "Recommended · Marquee + index"
design answers all four.

Separately, the portal mixes two kinds of link: pages Starlight renders, and
pages it does not — Storybook, the TypeDoc reference, the raw architecture
SVG, GitHub. Following one of the latter replaces the portal with a different
site whose navigation has no way back. Those links should open in a new tab,
and the rule must hold for every link added later, not only today's.

## What Changes

- **New home page** (`/`), built from the recommended design:
  - a cinema marquee hero — gold eyebrow, "How English Course *is built.*",
    one-line lede — over the cinema glow;
  - a large search field under the headline that opens Starlight's search;
  - two feature cards with a small preview drawing, for the design system and
    the API reference;
  - three compact cards for Emails, Architecture and Changelog;
  - a release strip naming the version in production, its date, and how many
    changes are waiting in `develop`, read from git at build time.
- **Links that leave Starlight open in a new tab**, marked as such:
  - one shared rule decides what "leaves Starlight": an absolute URL, or a
    path into a site the portal hosts but does not render (`/storybook/`,
    `/api/`), or a file (a path with an extension);
  - the sidebar, the home cards and raw links in pages use it; Markdown links
    (the changelog's commit links) get it through a rehype plugin;
  - a test fails when a page links outside Starlight without opening a new tab.

## Capabilities

### New Capabilities

- `portal-outbound-links`: which portal links leave Starlight, how they open,
  and how the rule is enforced for future links.

### Modified Capabilities

- `docs-portal`: "The portal home leads to both references" becomes the new
  home page, and its links to the references open in a new tab instead of
  replacing the portal.

## Non-goals

- Screenshot thumbnails of the references (the "live previews" variant). The
  feature cards use drawn previews; captured screenshots are a later change.
- Counts that would go stale (modules, layers). Only figures read at build
  time appear: the release, its date and the waiting changes, and the email
  gallery's kinds and languages.
- Replacing Starlight's header or adding a top navigation bar.
- Opening Starlight pages (Emails, Architecture, Changelog) in a new tab.

## Impact

- **Portal:** `index.mdx` rewritten; new components under
  `docs-portal/src/components/home/`; a shared `outbound-links.mjs` and
  `release-summary.mjs`; the sidebar defined in `navigation.mjs`; styles in
  `cinema.css`.
- **Portal dependency:** `rehype-external-links`.
- **Tests:** `src/deployment/docs-portal-home.test.ts`.

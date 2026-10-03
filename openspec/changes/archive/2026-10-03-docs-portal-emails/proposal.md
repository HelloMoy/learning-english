## Why

The five transactional emails (verify email, reset password, change email,
password changed, delete account) have no stories, so the only way to see one
is `pnpm email:dev` on a developer's machine — and that shows English only,
from each template's `PreviewProps`. A reviewer cannot check how an email
reads in Spanish or Portuguese, or what its subject line says, without
triggering it for real. The docs portal is now the place where the project's
references live, so the emails belong there too.

## What Changes

- Add an **email gallery** to the docs portal at `/emails/`: every account
  email in every locale (`en`, `es`, `pt`), with its subject, rendered by the
  same `composeAccountEmail` that production sends through — not from the
  templates' `PreviewProps`.
- A script renders the gallery's HTML files and a manifest of what it
  rendered; the portal page reads that manifest, so a new email kind or
  locale appears without editing the page.
- `pnpm portal:build` renders the gallery first, then builds the portal, then
  Storybook and TypeDoc as today.
- The portal home gains a third entry, and the sidebar a third link, to the
  gallery. With a real docs page in the portal, the sidebar now shows.
- Export the list of account email kinds from `account-emails`, so the gallery
  enumerates the same kinds production can send.

## Capabilities

### New Capabilities

- `email-gallery`: the portal page that shows every account email in every
  locale as production renders it, how it is generated, and how it joins the
  portal build.

### Modified Capabilities

<!-- None. `docs-portal` keeps its requirements: the gallery is an additional
     part of the site, and `portal:build` still builds the portal, Storybook
     and TypeDoc in the order that requirement states. `transactional-email`
     is unchanged: the gallery only calls `composeAccountEmail`. -->

## Non-goals

- Using `react-email export`. It renders every template with empty props, and
  these templates take their copy as props, so it fails on all five.
- Stories for the emails in Storybook.
- Sending any email, or rendering with live data. The gallery uses fixed
  sample values (a sample link and `ana.g@example.com` as the new address).
- A plain-text view. Production also sends `toPlainText(html)`; the gallery
  shows the HTML only.
- Email-client screenshots (Outlook, Gmail). The gallery shows the HTML in a
  browser.

## Impact

- **New script:** `scripts/email-gallery/` (run with `tsx`, like the other
  scripts), with its unit tests.
- **`src/lib/account-emails/account-emails.tsx`:** exports
  `ACCOUNT_EMAIL_KINDS`; `AccountEmailKind` is derived from it. No behaviour
  change.
- **Portal:** a new `emails.mdx` page, a sidebar link and a home entry; the
  gallery's generated files are gitignored.
- **Root scripts:** `portal:emails`, called first by `portal:build` and by
  `portal:dev`.

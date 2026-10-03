## Context

`src/emails/` holds five React Email templates. They receive their copy
already translated (`AccountEmailProps.copy`); production renders them
through `composeAccountEmail(kind, actionUrl, values)` in
`src/lib/account-emails/account-emails.tsx`, which reads the locale from the
link, translates `Emails.<Template>` with `createTranslator`, renders the HTML
and returns `{ subject, html, text }`. The kinds live in a private `TEMPLATES`
map; `AccountEmailKind` is a hand-written union of the same five keys.

`react-email export` builds and renders every template with `{}` as props
(confirmed in its render worker), so all five throw on `props.copy.preview`.

The docs portal (`docs-portal/`, Starlight) is built by `pnpm portal:build`:
Astro first (it empties `dist/`), then Storybook and TypeDoc into `dist/`.

## Goals / Non-Goals

**Goals:** every account email in every locale, as production renders it,
on a portal page that updates itself when a kind or locale is added.

**Non-Goals:** see the proposal — no `react-email export`, no stories, no
plain-text view, no client screenshots.

## Decisions

### 1. Render through `composeAccountEmail`, not the templates

The gallery calls the production function with a sample link per locale
(`https://english-course.online/<locale>/preview`, whose first path segment
`localeFromActionUrl` reads) and `{ newEmail: "ana.g@example.com" }`. What
the reader sees is then exactly what a learner receives — translation,
interpolation, subject and all — and a regression in that function shows up
in the gallery too. Rendering templates from `PreviewProps` would show
English only and skip the code path that matters.

**`ACCOUNT_EMAIL_KINDS`:** `account-emails.tsx` exports the kinds as a
`readonly` tuple and derives `AccountEmailKind` from it; `TEMPLATES` keeps
`satisfies Record<AccountEmailKind, …>` so the two cannot disagree. The
gallery iterates that tuple and `routing.locales`, so neither list is copied.

### 2. A script writes HTML into `public/` and a manifest into `src/`

`scripts/email-gallery/email-gallery.ts`, run by `pnpm portal:emails`:

- `renderEmailGallery()` — composes every kind × locale and returns the
  entries (kind, and per locale: subject, path, html). Pure apart from the
  rendering it delegates to.
- `writeEmailGallery(entries, portalDir)` — writes each HTML to
  `docs-portal/public/emails/<kind>.<locale>.html` and the manifest (entries
  without the HTML) to `docs-portal/src/email-gallery.json`.

**Why `public/` here, when Storybook and TypeDoc go straight into `dist/`:**
the page is built *from* the manifest, so the gallery must exist before
`astro build`, and Astro copies `public/` into `dist/` itself. The files are
small (15 × ~10 KB), unlike Storybook's 50 MB. Both outputs are gitignored.

### 3. The page reads the manifest at build time

`docs-portal/src/content/docs/emails.mdx` imports `../../email-gallery.json`
and maps it: per email, a heading (the English subject) and a Starlight
`<Tabs syncKey="email-locale">` with one `<TabItem>` per locale, holding that
locale's subject and an `<iframe>` of its HTML (`loading="lazy"`, titled with
the subject). `syncKey` makes one locale choice apply to every email, as the
spec asks. A missing manifest fails the Astro build loudly, which is why
`portal:build` and `portal:dev` both render the gallery first.

### 4. Build order

```
portal:build = pnpm portal:emails
            && pnpm --dir docs-portal run build
            && storybook build -o docs-portal/dist/storybook
            && pnpm run docs --out docs-portal/dist/api
portal:dev   = pnpm portal:emails && pnpm --dir docs-portal run dev
```

The workflow calls `pnpm portal:build` and needs no change.

### 5. Sidebar and home

The sidebar gains `{ label: "Emails", link: "/emails/" }`; `emails.mdx` is a
regular (non-splash) page, so the sidebar finally shows. The home gets a
third `LinkCard`.

## Risks / Trade-offs

- **Frames and page height** → each iframe has a fixed height that fits the
  account layout; the email scrolls inside it if a future template is longer.
- **The script imports app code (`@/lib`, `@/messages`)** → same as
  `db-seed`; `tsx` resolves the `@/` alias from `tsconfig.json`.
- **Generated files under the portal's `src/`** → only the manifest, ignored by
  git and by Prettier, rewritten on every build.

## Testing strategy

- **Vitest unit (node), `scripts/email-gallery/email-gallery.test.ts`** —
  mirrors the colocated script tests (`scripts/db-seed/seed-learner.test.ts`):
  `renderEmailGallery()` returns every kind in `ACCOUNT_EMAIL_KINDS` order,
  each in `en`/`es`/`pt` with `lang` set, the subject production uses, the
  interpolated address and no `{newEmail}`; `writeEmailGallery()` into a
  temporary directory writes 15 HTML files and a manifest without HTML.
- **Vitest unit, `src/lib/account-emails/account-emails.test.ts`** (exists) —
  add: `ACCOUNT_EMAIL_KINDS` lists the five kinds `composeAccountEmail`
  renders.
- **Vitest unit, `src/deployment/docs-portal.test.ts`** (exists) — update the
  `portal:build` steps; assert `portal:emails`, `portal:dev`, the sidebar
  link and the gitignored outputs.
- **Visual check** — Playwright MCP against `pnpm portal:preview`: the
  gallery page, a locale switch syncing every email, the sidebar, phone width.
- **No e2e spec**, for the same reason as the portal itself.

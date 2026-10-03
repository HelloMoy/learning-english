## 1. Account email kinds

- [x] 1.1 (TDD: test → impl) In `account-emails.test.ts`, assert `ACCOUNT_EMAIL_KINDS` lists the five kinds and each composes; export it from `account-emails.tsx` as a readonly tuple and derive `AccountEmailKind` from it

## 2. Gallery script

- [x] 2.1 (TDD: test → impl) `renderEmailGallery()` returns one entry per kind in `ACCOUNT_EMAIL_KINDS` order, each with `en`/`es`/`pt` renders carrying `lang`, the production subject, the `/emails/<kind>.<locale>.html` path, and the sample address interpolated
- [x] 2.2 (TDD: test → impl) `writeEmailGallery(entries, portalDir)` writes each HTML under `public/emails/` and the manifest (without HTML) to `src/email-gallery.json`; add the `main` that renders and writes into `docs-portal/`

## 3. Portal wiring

- [x] 3.1 (TDD: test → impl) In `docs-portal.test.ts`, assert `portal:emails` runs the script, `portal:build` starts with it, `portal:dev` renders first, the sidebar links `/emails/`, and `.gitignore` covers `docs-portal/public/emails/` and `docs-portal/src/email-gallery.json`; update the scripts, sidebar and ignores (also `.prettierignore`)
- [x] 3.2 Write `emails.mdx` (subject heading, synced locale tabs, lazy iframes) and add the gallery entry to the home page

## 4. Verification

- [x] 4.1 Run `pnpm portal:build`; check the visual result with Playwright MCP on `pnpm portal:preview` (gallery, locale sync, sidebar, phone width)
- [x] 4.2 Run `pnpm verify`

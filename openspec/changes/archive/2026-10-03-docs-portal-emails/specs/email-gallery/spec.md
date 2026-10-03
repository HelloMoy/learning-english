## ADDED Requirements

### Requirement: The gallery renders every account email in every locale as production does

`pnpm portal:emails` SHALL render, for every kind in `ACCOUNT_EMAIL_KINDS`
and every locale in `routing.locales`, the email that `composeAccountEmail`
produces for a sample link in that locale, and write its HTML to
`docs-portal/public/emails/<kind>.<locale>.html`. It SHALL NOT render from a
template's `PreviewProps`. Copy that interpolates values SHALL receive fixed
sample values (`newEmail` = `ana.g@example.com`), so no raw ICU placeholder
reaches the page.

#### Scenario: Every kind in every locale
- **WHEN** `pnpm portal:emails` runs
- **THEN** `docs-portal/public/emails/` holds one HTML file per kind and locale — 15 for five kinds and three locales

#### Scenario: Each file is in its own locale
- **WHEN** the Spanish verify-email file is read
- **THEN** its `<html>` carries `lang="es"` and its heading is the `es` copy of `Emails.VerifyEmail.heading`

#### Scenario: Interpolated copy is filled
- **WHEN** the change-email file of any locale is read
- **THEN** it contains `ana.g@example.com` and no `{newEmail}`

#### Scenario: A new email kind appears on its own
- **WHEN** a kind is added to `ACCOUNT_EMAIL_KINDS` with its template and messages
- **THEN** the next `pnpm portal:emails` renders it in every locale without any change to the gallery

### Requirement: A manifest describes what was rendered

Alongside the HTML, `pnpm portal:emails` SHALL write
`docs-portal/src/email-gallery.json`: one entry per kind, in
`ACCOUNT_EMAIL_KINDS` order, each listing per locale the subject production
sends and the root-relative path of its HTML file. The generated HTML and
the manifest SHALL be ignored by git.

#### Scenario: The manifest names each subject
- **WHEN** the manifest is read after a run
- **THEN** each kind lists `en`, `es` and `pt`, each with that locale's `subject` and a `/emails/<kind>.<locale>.html` path

### Requirement: The portal shows the gallery

The portal SHALL have an "Emails" page at `/emails/`, built from the
manifest, that shows each email with its subject and its rendered HTML in an
embedded frame, with one tab per locale; choosing a locale on one email SHALL
choose it on all of them. The portal home SHALL offer an entry to the
gallery, and the sidebar SHALL link it.

#### Scenario: Reading an email in Portuguese
- **WHEN** a reader opens `/emails/` and chooses the `pt` tab on the reset-password email
- **THEN** the frame shows the Portuguese reset-password email, its subject is the `pt` subject, and every other email switches to `pt`

#### Scenario: Reaching the gallery
- **WHEN** a reader opens the portal home
- **THEN** an entry links to `/emails/`, and the sidebar on the gallery page lists "Emails"

### Requirement: The portal build renders the gallery first

`pnpm portal:build` SHALL run `pnpm portal:emails` before building the
portal, so the page and the copied HTML always come from the same run, and
SHALL stop if it fails. `pnpm portal:dev` SHALL also render the gallery
before starting.

#### Scenario: A broken template stops the build
- **WHEN** an account email template throws while rendering and `pnpm portal:build` runs
- **THEN** the command exits non-zero before the portal is built

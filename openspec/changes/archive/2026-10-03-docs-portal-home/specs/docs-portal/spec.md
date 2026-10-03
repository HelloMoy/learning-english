## MODIFIED Requirements

### Requirement: The portal home leads to both references

The portal home page SHALL be a splash page, in this order:

1. A hero over the cinema glow: the gold eyebrow `NOW SHOWING · ENGLISH
   COURSE DOCS`, the headline "How English Course is built." with "is built."
   in gold, and a one-line lede.
2. A search field under the headline that opens the portal's search dialog,
   the same one the header's search and `⌘K`/`Ctrl+K` open.
3. Two feature cards, each with a small decorative preview drawing, an
   eyebrow naming the tool and a description: the design system (linking to
   `/storybook/`) and the API reference (linking to `/api/`).
4. Three compact cards with an icon: Emails (`/emails/`), Architecture
   (`/architecture/`) and Changelog (`/changelog/`). The Emails card SHALL
   state how many email kinds and languages the gallery holds, read from the
   gallery's manifest.
5. A release strip, linking to `/changelog/`, naming the latest version tag,
   the date of its tagged commit, and the number of non-merge commits after it
   — read from git when the portal is built. Without a version tag the strip
   SHALL NOT render.
6. A note that the site is rebuilt from `develop` and may be ahead of
   production.

The portal's sidebar configuration SHALL list the design system and the API
reference, so every portal page that shows a sidebar offers them. Both
references SHALL open in a new tab, as `portal-outbound-links` requires. The
portal SHALL be in English only, and the home page SHALL show no figure that
is not read at build time.

#### Scenario: Reaching Storybook from the home page
- **WHEN** a reader opens the portal home and follows the design system card
- **THEN** `/storybook/` opens in a new tab and the portal stays open in the first

#### Scenario: Reaching the API reference from the home page
- **WHEN** a reader opens the portal home and follows the API reference card
- **THEN** `/api/` opens in a new tab and the portal stays open in the first

#### Scenario: Searching from the hero
- **WHEN** a reader activates the hero's search field
- **THEN** the portal's search dialog opens with its input focused

#### Scenario: The release strip follows the tags
- **WHEN** the portal is built on a checkout 8 non-merge commits after `v0.5.0`, tagged on a commit dated 2026-10-01
- **THEN** the strip reads `v0.5.0`, `2026-10-01` and `8` changes waiting in develop

#### Scenario: The sidebar offers both references
- **WHEN** the portal's sidebar configuration is read
- **THEN** it links "Design system" to `/storybook/` and "API reference" to `/api/`, both opening in a new tab

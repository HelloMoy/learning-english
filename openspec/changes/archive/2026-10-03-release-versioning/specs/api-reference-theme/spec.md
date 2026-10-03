## MODIFIED Requirements

### Requirement: Home page starts from the hexagon

The reference's `index.html` SHALL be a home page generated from the project
model, containing, in order:

1. A marquee with a gold eyebrow naming the project, a headline, a one-line
   lede, and badges for the release version and the number of documented
   modules.
2. One poster per hexagonal layer — use cases (`domain/use-cases`), ports
   (`domain/ports`), entities (`domain/entities`), adapters (`adapters`),
   hooks (`hooks`) and components (`components`) — each showing its folder
   path, the number of documented modules under that folder, a title and a
   one-line description, and linking to that folder's group in the index.
3. An index of every documented module, grouped by folder (the first path
   segment, or the first two under `domain/`). Groups for the six layers come
   first in the order above; the remaining groups follow alphabetically. Each
   row SHALL link to the module page and show the module path with a repeated
   final segment collapsed, the short summary of its most representative
   documented export when one exists, and the distinct kinds of symbol it
   exports. The representative export is the first documented function or
   class, then the first documented variable or enum, and only then the first
   other documented export (type alias, interface, …), so a module is
   summarised by what it does rather than by a helper type it declares first.

The counts SHALL be computed at generation time, never written by hand.

The release version SHALL be what `git describe --tags` reports for the
documented checkout — the latest version tag, followed by the number of
commits since it and the commit when the checkout is ahead of it — and SHALL
fall back to the `package.json` version when no tag can be read.

#### Scenario: Layer counts follow the code
- **WHEN** the project documents 13 modules under `domain/use-cases/`
- **THEN** the use-cases poster shows `13`, and adding a documented use case changes it to `14` on the next `pnpm run docs`

#### Scenario: A poster jumps to its group
- **WHEN** the reader activates the hooks poster
- **THEN** the page scrolls to the `hooks` group of the module index

#### Scenario: Repeated leaf collapsed
- **WHEN** the module `lib/format-duration/format-duration` is listed
- **THEN** its row reads `lib/format-duration` and links to that module's page

#### Scenario: Row summary and kinds
- **WHEN** a module exports a documented function and a type alias
- **THEN** its row shows the function's short summary and the kinds `Function` and `Type Alias`

#### Scenario: A helper type declared first does not summarise the module
- **WHEN** a hook module declares a documented props type before its documented hook function
- **THEN** its row shows the hook's short summary, not the props type's

#### Scenario: A module of types is summarised by a type
- **WHEN** a port module exports only a documented interface
- **THEN** its row shows the interface's short summary

#### Scenario: Group order
- **WHEN** the index is rendered
- **THEN** the `domain/use-cases`, `domain/ports`, `domain/entities`, `adapters`, `hooks` and `components` groups appear before every other group, in that order

#### Scenario: The badge names the release
- **WHEN** the reference is generated on a checkout 12 commits after `v0.5.0`
- **THEN** the version badge reads `v0.5.0-12-g<short hash>`, not the `package.json` version

#### Scenario: No tags to read
- **WHEN** the reference is generated where git has no version tag
- **THEN** the badge shows `v` followed by the `package.json` version

## Commit message rules (Conventional Commits + gitmoji codes)

REQUIRED output format (must match exactly):
<type>(scope): <gitmoji> <description>

General rules:

- Do NOT use emoji characters. Use gitmoji codes only, e.g. :sparkles:
- The <type> and the <gitmoji> are chosen independently:
  - <type> = the Conventional Commit type (what kind of change it is)
  - <gitmoji> = the gitmoji meaning (what it represents), based on its official description
- Scope must be lowercase kebab-case only, e.g. feat(user-profile): ...
- Keep first line <= 72 chars.
- Description: imperative mood, lower-case start, no trailing period.
- Return only the commit message text, no code fences, no extra commentary.

Allowed types (pick the best one):

- feat: a new feature for the user/product
- fix: a bug fix
- docs: documentation only
- refactor: refactor changes
- perf: performance improvement
- test: tests changes
- style: formatting only (no logic change)
- build: build system / dependencies / packages
- ci: CI configuration/scripts
- chore: maintenance tasks (config, tooling, housekeeping)

Dependency-related commits (add/remove/upgrade/downgrade a package) MUST use `build`,
never `chore`.

Required gitmojis (pick ONE that best matches the main intent of the change):

- :mute: Remove logs.
- :wheelchair: Improve accessibility.
- :truck: Move or rename resources (e.g.: files, paths, routes).
- :recycle: Refactor code.
- :heavy_minus_sign: Remove a dependency.
- :wrench: Add or update configuration files.
- :heavy_plus_sign: Add a dependency.
- :arrow_up: Upgrade dependencies.
- :arrow_down: Downgrade dependencies.
- :rotating_light: Fix compiler / linter warnings.
- :lipstick: Add or update the UI and style files.
- :white_check_mark: Add, update, or pass tests.
- :memo: Add or update documentation.
- :sparkles: Introduce new features.
- :art: Improve structure / format of the code.
- :bug: Fix a bug.
- :fire: Remove code or files.

Breaking changes:

- If breaking, add "!" after type/scope and/or add a footer:
  BREAKING CHANGE: <explanation>

Examples:

- feat(user-profile): :sparkles: add avatar upload
- fix(auth-token): :bug: handle expired refresh tokens
- docs(readme): :memo: document local setup
- refactor(parser): :recycle: simplify tokenization
- build(deps): :arrow_up: bump axios to 1.7.x
- chore(vscode-settings): :wrench: align workspace config

  BREAKING CHANGE: authentication flow changed; update clients accordingly.

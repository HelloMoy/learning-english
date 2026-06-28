# Commit Conventions

This project uses **Conventional Commits** with **gitmoji** codes. Adherence is required
because release notes are automatically generated from these messages.

Each commit message consists of a **header**, an optional **body**, and an optional
**footer**.

```
<header>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

The `header` is mandatory and must conform to the [Commit Header](#commit-header) format.

The `body` is optional. When present, it must conform to the [Commit Body](#commit-body)
format.

The `footer` is optional. The [Commit Footer](#commit-footer) format describes what the
footer is used for and the structure it must have.

## Commit Header

```
<type>(<scope>): <gitmoji> <short summary>
  │       │       │       │
  │       │       │       └─⫸ Summary in present tense. Not capitalized. No period.
  │       │       │
  │       │       └─⫸ Gitmoji code (e.g. :sparkles:), NOT an emoji character.
  │       │
  │       └─⫸ Scope: lowercase kebab-case.
  │
  └─⫸ Commit Type: feat|fix|docs|refactor|perf|test|style|build|ci|chore
```

The `<type>`, `<scope>`, `<gitmoji>`, and `<summary>` fields are mandatory. Keep the
entire header ≤ 72 chars.

### Type

Must be one of the following:

| Type         | Description                                                                        |
| ------------ | ---------------------------------------------------------------------------------- |
| **feat**     | A new feature for the user/product                                                 |
| **fix**      | A bug fix                                                                          |
| **chore**    | Maintenance tasks (config, tooling, housekeeping) — **NOT for dependency changes** |
| **test**     | Adding, updating, or correcting tests                                              |
| **docs**     | Documentation only changes                                                         |
| **refactor** | A code change that neither fixes a bug nor adds a feature                          |
| **style**    | Formatting only (no logic change)                                                  |
| **build**    | Build system, dependencies, or packages                                            |
| **ci**       | CI configuration files and scripts                                                 |
| **perf**     | A code change that improves performance                                            |

**Special type rules** (override the defaults above):

- **Dependency changes** (add / remove / upgrade / downgrade a package) MUST use `build`,
  never `chore`.
- **Documentation** (markdown files, JSDoc, inline comments — regardless of which file
  they live in) MUST use `docs`.
- **Test files** (unit, integration, E2E) MUST use `test`. Test config files
  (`vitest.config.ts`, `playwright.config.ts`, etc.) are NOT test files — use `chore`
  with `:wrench:` instead.

### Scope

The scope names the area of the codebase affected. **Always required.**

Rules:

- Lowercase kebab-case only, e.g. `feat(user-profile): ...`, `fix(auth-token): ...`
- Use the closest package, feature, or module name
- Do NOT use `package.json` field names (`deps`, `devDeps`) — use the domain instead (e.g. `deps`, `dev-deps`)

### Gitmoji

Pick **one** gitmoji code that best matches the main intent of the change. The `<type>`
and the `<gitmoji>` are chosen **independently**:

- `<type>` = the Conventional Commit type (what kind of change it is)
- `<gitmoji>` = the gitmoji meaning (what it represents), based on its official
  description

Use **gitmoji codes only** (`:sparkles:`), never emoji characters (`✨`).

#### Allowed gitmojis

| Code                 | Meaning                                    |
| -------------------- | ------------------------------------------ |
| `:sparkles:`         | Introduce new features                     |
| `:bug:`              | Fix a bug                                  |
| `:wrench:`           | Add or update configuration files          |
| `:memo:`             | Add or update documentation                |
| `:white_check_mark:` | Add, update, or pass tests                 |
| `:fire:`             | Remove code or files                       |
| `:art:`              | Improve structure / format of the code     |
| `:lipstick:`         | Add or update the UI and style files       |
| `:recycle:`          | Refactor code                              |
| `:truck:`            | Move or rename resources (files, paths, …) |
| `:heavy_plus_sign:`  | Add a dependency                           |
| `:heavy_minus_sign:` | Remove a dependency                        |
| `:arrow_up:`         | Upgrade dependencies                       |
| `:arrow_down:`       | Downgrade dependencies                     |
| `:rotating_light:`   | Fix compiler / linter warnings             |
| `:wheelchair:`       | Improve accessibility                      |
| `:mute:`             | Remove logs                                |

#### Special gitmoji rules

- **Documentation commits** MUST pair `docs` with `:memo:`.
- **Test commits** MUST pair `test` with `:white_check_mark:`.
- **Dependency commits** MUST pair `build` with `:heavy_plus_sign:` (add),
  `:heavy_minus_sign:` (remove), `:arrow_up:` (upgrade), or `:arrow_down:` (downgrade).

### Summary

Use the summary field to provide a succinct description of the change:

- Use the imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize the first letter
- No dot (.) at the end
- No code fences, no extra commentary — return only the commit message text

## Commit Body

Just as in the summary, use the imperative, present tense: "fix" not "fixed" nor
"fixes".

Explain the **motivation** for the change. You can include a comparison of the previous
behavior with the new behavior to illustrate the impact of the change.

## Commit Footer

The footer can contain information about breaking changes, deprecations, and references to
GitHub issues or PRs.

### Breaking Changes

If breaking, add `!` after `<type>/<scope>` and/or add a footer:

```
BREAKING CHANGE: <brief summary>
<BLANK LINE>
<detailed description + migration instructions>
```

Example:

```
chore(auth): :wrench: switch to JWT-based sessions

BREAKING CHANGE: authentication flow changed; update clients accordingly.
```

### References

Reference GitHub issues and PRs that this commit closes or is related to:

```
Fixes #<issue number>
Closes #<pr number>
Refs #<issue number>
```

## Revert Commits

If the commit reverts a previous commit, prefix the header with `revert: ` followed by
the header of the reverted commit. The body must include:

```
This reverts commit <SHA>.
```

Followed by a clear description of the reason for reverting.

## Examples

```
feat(user-profile): :sparkles: add avatar upload
fix(auth-token): :bug: handle expired refresh tokens
docs(readme): :memo: document local setup
refactor(parser): :recycle: simplify tokenization
test(utils): :white_check_mark: add cn coverage
build(deps): :arrow_up: bump axios to 1.7.x
chore(vscode-settings): :wrench: align workspace config
```

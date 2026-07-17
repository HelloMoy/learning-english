# Capability: architecture-boundaries

## Purpose

Define the architectural rules that ensure the domain is unconcerned with its actors (the Cockburn hexagon invariant). These rules are enforced mechanically: ESLint rejects any deliverable-mechanism dependency from inside `src/domain/**` and rejects direct access to time, identity, and randomness globals — the only collaborators the domain is allowed to have must come in through declared ports. Code outside the domain is free to use any delivery library it needs; the boundary exists to protect the hexagon, not to constrain the rest of the codebase.

## Requirements

### Requirement: Domain imports MUST come from a closed set

ESLint SHALL be configured for files under `src/domain/**` such that **only** the following packages are permitted as imports:

- `zod`
- `neverthrow`

Plus intra-domain imports (`from "@/domain/..."` or relative imports within `src/domain/**`).

All other imports SHALL be hard errors pointing at this spec.

The implementation MAY use an allowlist (the closed set is enumerated and any other import is rejected) or a denylist (the disallowed packages are enumerated and everything else is implicitly rejected). The **closed set** is the contract; the mechanism is the implementation's choice. The current implementation uses a denylist because ESLint v9's `no-restricted-imports` has no native allowlist mode. `no-restricted-imports`'s `patterns` option is required to catch sub-path imports (e.g. `next/navigation`, `@/adapters/...`); using `paths` alone only catches bare specifiers.

If a new package needs to enter the closed set, both `eslint.config.mjs` AND this spec SHALL be updated in the same change.

#### Scenario: A legitimate allowlisted import passes the rule

- **WHEN** a file under `src/domain/**` imports `zod` or `neverthrow`
- **THEN** ESLint reports no violation

#### Scenario: An import outside the closed set fails the rule

- **WHEN** a file under `src/domain/**` imports from `next`, `next-intl`, `next-safe-action`, `next-themes`, `zustand`, `nuqs`, `@/i18n/**`, `@/adapters/**`, `@/components/**`, `@/app/**`, or any package not in the closed set
- **THEN** ESLint reports a violation pointing to this spec

#### Scenario: Extending the closed set requires a spec update

- **WHEN** a developer adds a new package to the closed set in `eslint.config.mjs`
- **THEN** this spec SHALL be updated in the same change to list the new package and the reason

### Requirement: Time, identity, and randomness MUST go through ports, not globals

ESLint SHALL be configured with `no-restricted-syntax` scoped to `src/domain/**` such that the following constructs produce a hard error:

- Any `new Date(...)` construction (zero-arg and any-arg variants)
- `Date.now()` calls
- `Date.UTC()` calls (intentionally covered to prevent subtle leak)
- `Math.random()` calls
- Any `crypto.*` static-method call (`crypto.randomUUID`, `crypto.getRandomValues`, etc.)
- `globalThis.crypto.*` calls (caught via a MemberExpression selector — bare `crypto.*` only matches the identifier form)

The error message SHALL tell the developer to introduce or receive the corresponding port (`Clock`, `IdGenerator`, `MathRNG`, etc.).

#### Scenario: A `Date.now()` call in the domain is reported

- **WHEN** a file under `src/domain/**` contains `Date.now()`
- **THEN** ESLint reports a violation referencing this spec

#### Scenario: A use case that needs time obtains it via the `Clock` port

- **WHEN** code under `src/domain/**` requires the current time or a random value
- **THEN** it does so by calling a port passed in via the use case's `deps` argument; no global is read directly

#### Scenario: Tests of the domain can run without real time or random

- **WHEN** a unit test imports a domain use case and passes a stub `Clock`
- **THEN** the test runs without any monkey-patching of `Date` or `Math`

### Requirement: Boundary rules apply only inside the domain

Boundary enforcement SHALL be scoped to `src/domain/**` only. Files outside that scope SHALL retain their existing import behavior. The boundary exists to protect the hexágono's "unconcerned with the actors" invariant; code outside the hexágono MUST be free to use whatever delivery-layer dependencies it needs.

#### Scenario: A component under `src/components/**` is unaffected

- **WHEN** a file under `src/components/**` imports from `next-themes` or other delivery libraries
- **THEN** ESLint reports no boundary violation

### Requirement: The `next-themes` warning is acknowledged in the codebase

The application uses `next-themes` for theme management. `next-themes@0.4.6`
emits a React 19 console warning of the form
`"Encountered a script tag while rendering React component"` because its
`<ThemeProvider>` injects a FOUC-prevention `<script>` via
`React.createElement("script", { dangerouslySetInnerHTML })`. The codebase
SHALL acknowledge this warning in the source code (a JSDoc note on the
theme consumer) and SHALL NOT replace the provider with a custom
re-implementation. The warning is non-blocking and is tracked upstream
in the `next-themes` repository for the post-0.4 series.

#### Scenario: The theme consumer's source file documents the warning
- **WHEN** a developer reads `src/components/theme-toggle/theme-toggle.tsx`
- **THEN** the file's JSDoc explains that `next-themes@0.4.6` emits a React 19 warning, and references the rationale in `openspec/changes/polish-lesson-view-ux/design.md` §D6

#### Scenario: All routes remain functional despite the warning
- **WHEN** a user visits any route in the application
- **THEN** navigation, theme toggling, and lesson-page flows work as specified; the warning does not prevent interaction or render any region incorrectly

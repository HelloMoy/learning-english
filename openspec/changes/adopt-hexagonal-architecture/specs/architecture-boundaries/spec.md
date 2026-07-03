## ADDED Requirements

### Requirement: Domain imports MUST come from a closed set

ESLint SHALL be configured for files under `src/domain/**` such that **only** the following packages are permitted as imports:

- `zod`
- `neverthrow`
- `ts-pattern` (optional; only if a future change adds it and documents why)

Plus intra-domain imports (`from "@/domain/..."` or relative imports within `src/domain/**`).

All other imports SHALL be hard errors pointing at this spec.

The implementation MAY use an allowlist (the closed set is enumerated and any other import is rejected) or a denylist (the disallowed packages are enumerated and everything else is implicitly rejected). The **closed set** is the contract; the mechanism is the implementation's choice. The current implementation uses a denylist because ESLint v9's `no-restricted-imports` has no native allowlist mode; `eslint-plugin-boundaries` is installed but not currently driving the rule.

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

- `new Date()` constructions
- `Date.now()` calls
- `Date.UTC()` calls (intentionally covered to prevent subtle leak)
- `Math.random()` calls
- Any `crypto.*` static-method call (`crypto.randomUUID`, `crypto.getRandomValues`, etc.)

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

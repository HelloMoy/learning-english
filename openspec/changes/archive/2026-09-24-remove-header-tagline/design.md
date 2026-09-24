## Context

`SiteHeader` renders `{t("tagline")} · {section}` inside the eyebrow span. `tagline` is a `SiteHeader.*` message in the three locale files; nothing else reads it. The component test asserts on the section key only, and two e2e tests in `e2e/cinema-theme.spec.ts` match `/immersion cinema · home/i` and `/immersion cinema · lesson/i`.

## Goals / Non-Goals

**Goals:**
- Eyebrow shows the section alone.
- No orphaned message key.

**Non-Goals:**
- Any layout, spacing or shedding-order change.

## Decisions

- **Delete the key rather than blank it.** An empty `tagline` would leave a dangling ` · ` and a dead key in three files. Removing the key and the interpolation is the smaller, honest change.
- **Keep the eyebrow span and its classes.** The `hidden sm:inline` shedding rule and the tracking still apply to the section label.

## Risks / Trade-offs

- [Missing-key runtime warning if a stale build still asks for `tagline`] → the interpolation is removed in the same commit as the key.

## Testing strategy

- **Vitest component + RTL** (`site-header.test.tsx`, existing pattern with mocked `useTranslations` returning the key): add a test that the eyebrow's text content is exactly the section key, with no `·` and no `tagline` key. Red first: it fails today because the span reads `tagline · sectionHome`.
- **Playwright e2e** (`e2e/cinema-theme.spec.ts`): update the two eyebrow assertions to `/^home$/i`-style matches on the eyebrow, so the tagline's absence is checked in a real browser with real messages.
- No unit layer involved; `sectionKey` is unchanged.

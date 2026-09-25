## Why

The header eyebrow reads `IMMERSION CINEMA · <SECTION>` next to the `ENGLISH·COURSE` wordmark. The tagline restates the brand the wordmark already carries, in a second phrase that pushes the only useful part, the section, further right. It adds nothing a learner acts on, so it goes.

## What Changes

- The section eyebrow renders the section alone (`HOME`, `PROFILE`, …) with no leading tagline and no interpunct.
- The `SiteHeader.tagline` message key is removed from every locale file.
- The `cinema-home` header requirement and its e2e assertions are reworded to match.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cinema-home`: the "Global header shows brand and section chrome" requirement drops the `IMMERSION CINEMA ·` prefix from the eyebrow; the eyebrow is the section name alone.

## Impact

- **Modified**: `src/components/site-header/site-header.tsx`, `src/components/site-header/site-header.test.tsx`, `src/messages/{en,es,pt}.json`, `e2e/cinema-theme.spec.ts`, `openspec/specs/cinema-home/spec.md` (via delta).
- No domain, adapter or dependency change.

## Non-goals

- **Changing the wordmark, the section list or the header's shedding order.** The eyebrow is still the first thing dropped below `sm`.
- **Touching other "Immersion Cinema" mentions.** The phrase stays in design-token names, spec purposes, JSDoc and metadata; only the header string is removed.
- **Restyling the eyebrow.** Same size, tracking and colour.

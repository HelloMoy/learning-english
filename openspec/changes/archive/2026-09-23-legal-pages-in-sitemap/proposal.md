## Why

The privacy policy and the terms shipped from `main` in the `legal-pages` change, which deliberately left `src/app/sitemap.ts` untouched: that file was the one whose implementation differed structurally between the branches, and Google needed nothing from it. That change's own task list closes with the follow-up this proposal is.

`develop` states the rule the entries break: "the sitemap lists the home in every supported locale, **and only the home**". That was true when the home was the only page an anonymous visitor could read. The legal routes are now the second and third, so the requirement has to admit them or the sitemap under-reports what the site serves.

This change also carries the merge of `main` into `develop`, which is what brings the two routes, the footer and the `legal-pages` capability spec onto this branch in the first place.

## What Changes

- `src/app/sitemap.ts` lists `/privacy` and `/terms` alongside the home, in every locale, each entry declaring its locale alternates.
- The `search-discoverability` requirement that says "only the home" is rewritten to name the three public paths.
- No change to the rule keeping personal routes out: course, module, lesson, onboarding, My learning, Achievements, Profile and the account pages stay unlisted.

## Capabilities

### New Capabilities

None. The routes and the footer already have their own capability, `legal-pages`, which arrives on this branch with the merge.

### Modified Capabilities

- `search-discoverability`: the sitemap requirement changes from "the home, and only the home" to the home plus the two legal routes.

## Impact

- **Modified**: `src/app/sitemap.ts`, `src/app/sitemap.test.ts`.
- **Merged in, not authored here**: the two routes, `SiteFooter`, `LegalDocument`, `src/lib/legal-sections/`, the `Legal` message namespace and `openspec/specs/legal-pages/spec.md`, all from `main`.
- No database, domain or adapter change.

## Non-goals

- **Revisiting the legal copy.** It is published; editing it is its own change.
- **Listing anything else.** Personal routes stay out, and this does not become the change that reconsiders which routes are public.
- **Fixing the red CI.** The `provider destroyed` teardown rejection and the e2e job's 45-minute timeout are real and unrelated; they get their own change.
- **Fixing soft 404s.** Unknown routes answering 200 in production is a pre-existing defect observed on `main`; `develop` already has e2e covering it, and it is not this change's business.

## Context

`develop`'s `src/app/sitemap.ts` maps over `routing.locales` for a single hardcoded `HOME_PATH`, and `sitemap.test.ts` asserts it lists "exactly the home of every locale". That was correct while the home was the only page an anonymous visitor could read: every other route requires a session and answers a crawler with sign-in.

`main` shipped two routes that break the premise — `/privacy` and `/terms` are public, session-free and deliberately indexable, because Google's OAuth console has to fetch the privacy URL. The `legal-pages` change left the sitemap alone on purpose: `main` and `develop` had structurally different implementations of that file (`main` walked the catalog and emitted an entry per lesson; `develop` emits the home alone), so editing it there would have guaranteed a merge conflict for something Google did not need.

This branch is where that deferral comes due. It carries the merge of `main` into `develop` and then makes the sitemap tell the truth.

## Goals / Non-Goals

**Goals:**

- Three public paths per locale in the sitemap, each with its locale alternates.
- A requirement that states the rule rather than a count, so the next public page is a one-line change.
- The personal-routes rule untouched and still tested.

**Non-Goals:**

- Revisiting which routes are public.
- Touching the legal copy, the footer or the routes themselves — they arrive from `main` already specified.
- Fixing the red CI or the pre-existing soft 404s.

## Decisions

### The merge is resolved by keeping both sides

Four conflicts, all of the "both branches appended here" kind:

- `src/app/[locale]/layout.tsx` — `develop` added the `LearnerStateSeed` import where `main` added `SiteFooter`. Both stay. The JSX mount point did **not** conflict, because `<div className="flex-1">{children}</div>` is byte-identical on both branches, which is why `legal-pages` chose that insertion point.
- `src/messages/{en,es,pt}.json` — `develop` appended its auth-era namespaces where `main` appended `Legal`. Both stay.

No semantic reconciliation is needed: neither side edited what the other wrote.

### The sitemap iterates a path tuple rather than special-casing the home

`sitemap.ts` becomes a map over the cross-product of `routing.locales` and a `PUBLIC_PATHS` tuple holding `/`, `/privacy` and `/terms`. The existing `absolute()` helper already handles the home's missing trailing segment, so the change is additive.

The alternative — appending two more hardcoded blocks — repeats the alternates construction three times and makes the fourth public page a copy-paste. Personal routes stay out by simply not being in the tuple, which is also what makes the omission legible to a reader.

### The requirement names the paths, and one scenario counts them

Naming `/privacy` and `/terms` keeps the spec checkable against the code. The added "exactly three entries per supported locale" scenario is the one that fails if someone later adds a personal route to the tuple by mistake — a count is the cheapest guard against the specific error this file invites, which is listing something that needs a session.

## Risks / Trade-offs

- **A future public page is added to the app but not to the tuple** → The sitemap silently under-reports. Accepted: the alternative, deriving the list from the route tree, would also pick up personal routes and is the harder problem. The tuple is one line and sits next to the requirement that explains it.
- **The count scenario is brittle if a fourth public page ships** → Intended. Adding a page should force a deliberate edit to the spec, not slip through.
- **The merge brings a footer into every page on `develop`** → `develop` has far more component and e2e tests than `main`, and some may assume the page's structure. Running the full suite before opening the PR is part of the task list, and discovering it here is precisely why the merge is happening now rather than during the release.

## Migration Plan

No data or schema change. The sitemap is regenerated per request, so the new entries appear with the deploy and nothing has to be invalidated. Rolling back is an ordinary revert; a sitemap that lists three paths instead of five harms nothing while it is stale.

## Testing strategy

Red before green, per AGENTS.md.

| Behavior | Layer | Mirrors |
| --- | --- | --- |
| The sitemap lists `/privacy` and `/terms` once per locale | Vitest unit | extend `src/app/sitemap.test.ts`, which already has the home, course and personal-route cases |
| Legal entries carry their three locale alternates | Vitest unit | same file, mirroring the existing English-home alternates test |
| Exactly three entries per locale, nothing more | Vitest unit | same file |
| No course or personal route sneaks in | Vitest unit | the two existing tests, unchanged — they must keep passing |
| The merged footer breaks nothing on `develop` | Vitest + Playwright | the full `pnpm verify` and the e2e suites the footer could touch |

No new e2e: the sitemap is a pure function of `routing.locales` and a tuple, and `e2e/search-discoverability.spec.ts` already fetches the real `/sitemap.xml`. If that spec asserts a count, it needs updating — checked as the first task.

## Open Questions

- **Does `e2e/search-discoverability.spec.ts` assert the sitemap's contents or only its shape?** Decides whether the e2e suite needs a change too. Resolve by reading it before touching the unit test.

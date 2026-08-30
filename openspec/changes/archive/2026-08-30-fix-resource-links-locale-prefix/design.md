## Context

The right rail of the Lesson Page renders two cards through the same component path:

```
LessonView
  └─ ResourceList (resources)                    → "Resources"
  └─ ResourceList ([notesResource], override)    → "Lesson notes (source)"
       └─ ResourceItem  ← the defect lives here
```

`ResourceItem` builds its link with `Link` from `@/i18n/navigation`, the next-intl wrapper created by `createNavigation(routing)`. `routing` declares `localePrefix: "always"`, so that `Link` rewrites any site-relative `href` to `/<locale><href>`.

A `Resource.url` is validated by `urlOrRelativePath()` and admits two shapes: an absolute URL, or a site-relative path beginning with `/`. In the seeded content every resource is the second shape and points into `public/`:

```
/local-filesystem-lesson/advanced-intermediate-course/2-advanced-vowel-pronunciation-in-american-english/2-fast-i/fast-i-vowel-pronunciation-practice-see-sound.pdf
```

Next.js serves `public/` from the origin root. It does not mount a locale-scoped copy, and `src/proxy.ts` deliberately excludes dotted paths from the next-intl middleware (`/((?!api|trpc|_next|_vercel|.*\..*).*)`), so a locale-prefixed asset path is not rewritten back — it simply falls through to the App Router, matches no route, and 404s.

Measured on the running dev server:

```
GET /local-filesystem-lesson/.../fast-i-....pdf      → 200
GET /en/local-filesystem-lesson/.../fast-i-....pdf   → 404
```

and the server-rendered lesson page emits the `/en/`-prefixed form. Both right-rail cards are therefore dead for every locale.

Why the suite is green: `resource-item.test.tsx` builds its fixture with `faker.internet.url()`. next-intl leaves absolute URLs alone, so the test asserts `href === resource.url` and passes — while the site-relative shape, the only one production actually uses, is never rendered in a test.

## Goals / Non-Goals

**Goals:**

- A resource link's `href` equals its `Resource.url` verbatim, for both shapes `urlOrRelativePath()` admits.
- Both right-rail cards are fixed by one change, since both flow through `ResourceItem`.
- The regression is pinned by a test that fails against today's code.
- Presentation is untouched: icon, title, hidden kind label, `target`, `rel`, and the gold underline/focus styling all survive byte-for-byte.

**Non-Goals:**

- Changing seed generation or `Resource.url` values — they are already correct.
- Reworking `urlOrRelativePath()` or the `Resource` schema.
- Migrating the other `@/i18n/navigation` `Link` call sites; they address in-app routes and are correct as they stand.
- Any visual, layout, or copy change.

## Decisions

### D1 — Render a plain `<a>` instead of the locale-aware `Link`

`ResourceItem` swaps `import { Link } from "@/i18n/navigation"` for a bare `<a>` element.

The distinction that matters is **route vs. content**. Locale-aware `Link` exists to keep the active locale in the URL when navigating between pages of the app. A `Resource.url` is not a page of the app — it is a file. Both shapes it can take are content addresses: an absolute URL belongs to another origin entirely, and a site-relative path belongs to `public/`, which has no locale dimension. Neither wants a locale segment, so the correct component is the one that applies none.

*Alternatives considered:*

- **`Link` from `next/link`.** Would also produce the correct `href` — `next/link` does no locale rewriting. Rejected because it buys nothing here: `<Link>`'s value is client-side prefetch and soft navigation between App Router routes, and a `target="_blank"` link to a PDF gets neither. It would also leave a `Link` import in the file, inviting the next reader to "fix" it back to the i18n one.
- **Keep `Link`, strip the prefix at the call site** (e.g. `href={resource.url}` with a manual `localePrefix: "never"` option, or `unoptimized`-style escape hatch). Rejected: it encodes the bug's shape into the fix, and depends on next-intl internals that can shift between versions.
- **Serve a locale-scoped copy of `public/`, or rewrite `/:locale/local-filesystem-lesson/*` in `proxy.ts`.** Rejected as backwards: it makes the infrastructure absorb a mislabeled link rather than labeling the link correctly, and it would duplicate ~15 GB of content addresses under three locales for no benefit.
- **Discriminate on the URL shape** — plain `<a>` for absolute URLs, `Link` for relative ones. Rejected: it is exactly inverted. The relative shape is the one that must *not* be prefixed.

### D2 — Pin the regression in Playwright, not in RTL

**Revised during implementation.** The first attempt added the regression test at the component layer, on the assumption that RTL would render the locale-prefixed `href`. It does not. Probed directly under jsdom:

```tsx
render(<Link href="/local-filesystem-lesson/x.pdf">probe</Link>);
// href === "/local-filesystem-lesson/x.pdf"   ← no prefix
```

and the same holds when the render is wrapped in `<NextIntlClientProvider locale="en">`. next-intl's client `Link` resolves the prefix from the request pathname, which jsdom does not supply; the prefix is applied by the **server** render. The defect is therefore structurally invisible to jsdom: a component test for it passes identically before and after the fix.

A guard that cannot go red is worse than no guard — it converts an open bug into a documented "covered" one. So the behavioral guard moves to the layer where the defect actually exists: a Playwright case in `e2e/lesson-page.spec.ts`, which boots the real Next.js server with `USE_COURSE_CONTENT_SEED=1` and exercises a real locale route. It asserts the rendered `href` equals the seed `Resource.url` verbatim **and** that fetching that href returns `200` — the second assertion is the one the user actually cares about, and no unit layer can make it.

The component test file still gains the site-relative case, but relabelled for what it honestly asserts: that `ResourceItem` passes a site-relative `url` through to `href` unmodified, covering the branch of `urlOrRelativePath()` the existing `faker.internet.url()` fixture never reaches. A comment records that jsdom cannot see the locale prefix and names the e2e test as the real guard, so a future reader does not mistake it for one.

*Alternatives considered:*

- **White-box RTL**: `vi.mock("@/i18n/navigation")` with a `Link` that throws, asserting `ResourceItem` never reaches for it. Genuinely red-before/green-after and fast. Rejected as the primary guard because it pins the *implementation* ("does not import this module") rather than the *behavior* ("the link resolves"), so it would keep passing if the same `/en/` prefix arrived by another route. The e2e assertion is indifferent to how the href is built.
- **Assert on the server-rendered HTML** via a Next.js render harness or a raw `fetch` in Vitest. Rejected: that is an e2e test wearing a unit test's clothes, and Playwright already has the server, the seed wiring, and the fixture derivation in place.

### D2a — Keep the existing absolute-URL test

It still guards the other branch of `urlOrRelativePath()`, and keeping both shapes side by side in the file makes the distinction explicit at the point where it matters.

### D3 — Do not widen the change to `ResourceList` or `LessonView`

`ResourceList` passes the `Resource` through untouched and `LessonView` only partitions the array; neither participates in URL construction. The fix belongs in the single component that builds the anchor, and stops there.

## Testing strategy

| Layer | File | Covers |
| --- | --- | --- |
| Playwright e2e | `e2e/lesson-page.spec.ts` | **The regression guard.** On a real `/en/…` lesson route, the Resources link's `href` equals the seed `Resource.url` verbatim (no locale segment), and `page.request.get(href)` returns `200`. Derives its fixture from `seedContentResources` the way the file's existing cases do, so regenerating the seed keeps it honest. This is the only layer that can go red on the defect. |
| Vitest component + RTL | `src/components/lesson-view/resource-item/resource-item.test.tsx` | Branch coverage, **not** the regression guard (see D2). New case: a site-relative `public/` path reaches `href` unmodified — the branch of `urlOrRelativePath()` the existing `faker.internet.url()` fixture never exercises. Existing case: an absolute URL still passes through. Both reuse the file's `fixtureResource()` helper and its `vi.mock("next-intl")` identity-translation setup, following the Arrange/Act/Assert + `WHEN … THEN` naming already in the file. |
| Vitest component + RTL | `src/components/lesson-view/resource-list/resource-list.test.tsx` | Unchanged — already asserts the list renders one row per resource; the href contract is `ResourceItem`'s to hold. |
| Manual verification | dev server | `curl -o /dev/null -w '%{http_code}'` the rendered `href` and confirm `200`; confirm the page markup no longer contains `href="/en/local-filesystem-lesson/`. The same check that diagnosed the bug, re-run as the exit criterion. |

TDD order per `AGENTS.md`: write the failing **e2e** case first, watch it fail on the `/en/`-prefixed `href`, then swap the element. The RTL case is added alongside as coverage, with its inability to go red stated in a comment rather than left for a reader to discover.

## Risks / Trade-offs

- **A future contributor "restores" the i18n `Link` for consistency** (every sibling component in `lesson-view/` imports it) → Mitigated by an explanatory comment at the anchor stating that resource URLs address content, not routes, plus the regression test that turns the mistake red, plus the spec requirement that makes it a documented contract rather than a style choice.
- **The plain `<a>` loses `<Link>` prefetch and soft navigation** → Not a real loss. These links carry `target="_blank"` and point at PDFs and Markdown files, which the browser opens or downloads in a new tab; there is no client-side transition to optimize.
- **An absolute-URL resource is unaffected, so a reviewer may read the change as a no-op** → The `curl` evidence and the failing-first e2e case make the site-relative path the explicit subject.
- **The component test looks like a regression guard but cannot go red** → Mitigated by naming it for what it asserts (pass-through, not locale behavior) and by an in-file comment pointing at the e2e case. The underlying hazard is general: any next-intl `Link` defect that lives in the server render is invisible to this project's RTL layer, so RTL must not be trusted to catch one.
- **Other locale-aware links could hide the same defect** → Surveyed: `resource-item.tsx` is the only `@/i18n/navigation` `Link` fed a non-route URL. The remaining call sites (`up-next-card`, `lesson-breadcrumb`, `lesson-list`, `course-navigator`, `poster-card`, `brand`, `featured-course`, `cinema-hero`, `module-overview`, `course-overview`, `lesson-page-error`) all address in-app routes and correctly keep the prefix.

## Migration Plan

None required. The change is a pure component fix with no data, schema, config, or dependency movement. Rollback is reverting one commit; no state is written and nothing is cached that would outlive the revert.

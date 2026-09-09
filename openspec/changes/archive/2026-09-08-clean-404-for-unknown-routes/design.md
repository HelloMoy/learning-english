## Context

The `[locale]` segment accepts one path segment of **anything**. Three things decide
whether that segment is a real locale, and they run in this order:

1. `src/proxy.ts` — the next-intl middleware (Next 16 renamed `middleware.ts` to
   `proxy.ts`). Its matcher is `/((?!api|trpc|_next|_vercel|.*\..*).*)`, so **any path
   containing a dot is excluded**. That exclusion is deliberate and load-bearing:
   without it `favicon.ico` would be redirected to `/en/favicon.ico`.
2. `generateMetadata` in the matched route — runs *before* the layout body.
3. `LocaleLayout`'s `hasLocale` guard — calls `notFound()`.

A path such as `/manifest.json` skips (1) entirely, matches
`src/app/[locale]/page.tsx`, and reaches (2) with `locale = "manifest.json"`. The home
route's `generateMetadata` calls `shareMetadata`, which throws for an unsupported
locale. Only then does (3) run and produce the 404 the client actually sees.

Measured against the current build:

| Request | Status | Server log |
| --- | --- | --- |
| `/manifest.json` | 404 | `⨯ Error: shareMetadata received an unsupported locale` |
| `/cualquier.cosa` | 404 | same |
| `/sin-punto` | 307 → `/en/sin-punto` | clean (the proxy matched it) |
| `/manifest.webmanifest` | 200 | clean (a real generated route) |

Note that `src/i18n/request.ts` already falls back to the default locale for an
unrecognized one, which is why the *layout's* `generateMetadata` survives — it only
calls `getTranslations`. `shareMetadata` is stricter on purpose: it builds canonical
URLs and `hreflang` alternates, and a silent fallback there would publish a wrong
canonical rather than fail.

The second defect is structural rather than ordered. Both "unsupported locale" and
"unknown path" funnel through `notFound()` into the same boundary,
`src/app/[locale]/not-found.tsx`, whose copy is only about locales. `/es/error`
therefore tells a Spanish reader that Spanish is unsupported.

## Goals / Non-Goals

**Goals:**

- A dotted path that is not a static file resolves to a clean 404 with nothing in the
  error log.
- One shared guard, so a route added later cannot forget to validate its locale.
- An unknown path under a supported locale says the *page* is missing, never that the
  learner's language is unsupported.
- The link out keeps the learner in their own locale.

**Non-Goals:**

- Changing the proxy matcher (see D1).
- Softening `shareMetadata`'s contract (see D2).
- Redesigning the not-found page's visual treatment.
- Introducing error monitoring, or stopping external clients from requesting
  `/manifest.json`.

## Decisions

### D1 — The proxy matcher stays exactly as it is

The tempting fix is to narrow `.*\..*` so it excludes only *real* static files. It
cannot be done: a matcher is a static regex evaluated before the filesystem is
consulted, so it cannot know that `/favicon.ico` exists and `/manifest.json` does not.
Widening it the other way — letting dotted paths through to next-intl — would redirect
`/favicon.ico` to `/en/favicon.ico` and break every static asset served from the app
origin.

The exclusion is correct. What is missing is validation *after* it, which is what the
rest of this design adds.

### D2 — `shareMetadata` keeps throwing; the guard stops it being reached

`shareMetadata` builds canonical URLs and `hreflang` alternates from the locale. For a
real route, an unsupported locale there is a programming error, and throwing is the
right response: the alternative is publishing `<link rel="canonical" href="/manifest.json/">`
to a crawler, silently.

So the throw stays and the callers stop reaching it with garbage.

**Alternative considered:** have `shareMetadata` fall back to the default locale.
Rejected — it turns a loud failure at a real route into a wrong canonical URL that
nobody notices, and `site-metadata`'s existing requirements depend on the canonical
being right.

### D3 — One shared guard: `requireSupportedLocale(locale)`

A small function in `src/i18n/` that narrows `string` to the locale union and calls
`notFound()` otherwise:

```ts
export function requireSupportedLocale(locale: string): Locale {
  if (!hasLocale(routing.locales, locale)) notFound();
  return locale;
}
```

Called as the first statement of every `generateMetadata` under `[locale]` — the
layout's and the four page routes'. `notFound()` works in `generateMetadata`: it throws
the same digest Next already handles, and the request resolves to the not-found
boundary without the metadata builder running.

It lives in `src/i18n/` rather than beside `shareMetadata` because it is about the
*routing* configuration, and because the layout calls it too while building no share
metadata at all. The layout's existing `hasLocale` check in the body stays: it guards
direct SSG builds, which never call `generateMetadata`.

**Why a guard rather than making `[locale]` reject non-locales structurally:** Next has
no way to constrain a dynamic segment's values. `generateStaticParams` only affects
prerendering, not which paths the router accepts at runtime.

### D4 — There is one not-found page, and it is about the *page*

The original plan here was two boundaries: keep "Locale not supported" for the layout's
guard and add a nested "Page not found" for the catch-all. Verifying that split against
a running server (task 3.1) showed the premise was wrong, so the design changed.

**What the proxy actually does with an unknown first segment:**

```
GET /xx            → 307 → /en/xx           → catch-all → not found
GET /de/courses    → 307 → /en/de/courses   → catch-all → not found
GET /manifest.json → (excluded from the matcher) → locale guard → framework 404
```

next-intl normalizes any non-locale first segment into a path under the **default**
locale. A request therefore never reaches the application carrying an unsupported
locale. What reaches it is a supported locale and an unknown path — which is why the
existing "Locale not supported" copy was showing for `/es/error`, and why it would have
kept showing for `/xx` under either design.

So there is one state to render, not two, and `src/app/[locale]/not-found.tsx` — the
boundary that already exists — carries it. No nested boundary, no header plumbing, and
no page whose copy nothing can legitimately reach.

The catch-all keeps calling `notFound()` rather than rendering its body directly,
because that is what produces the 404 status — a page that renders normally returns
200, and a 200 on a missing page is worse than the wrong copy.

**What happens to a path that bypasses the proxy:** `/manifest.json` is turned away by
the locale guard (D3) before any locale context exists, and resolves to the framework's
own not-found page above the `[locale]` boundary. That is the right outcome: there is
no locale to localize a message into, and the requester is a machine.

**Alternative considered:** keep the locale page as a defensive boundary for direct SSG
builds with an unknown locale. Rejected — a build-time failure is not a page a learner
reads, and keeping unreachable UI means keeping copy in three locales that no one can
ever see or check.

### D5 — The link targets the active locale

The page keeps `Link` from `@/i18n/navigation`, which preserves the active locale
because every request that reaches this page carries a valid one (D4). A learner on
`/pt/typo` therefore lands on the Portuguese home rather than the English one — the
request already told us their language, and discarding it would be a second small
failure on top of the first.

### D6 — `LocaleNotFound` is replaced by `PageNotFound`

The namespace is renamed rather than added beside the old one: with one page left there
is one message set, and leaving `LocaleNotFound` in the catalogues would leave three
locales' worth of copy that nothing renders and no reviewer can check.

`PageNotFound.{heading,description,goHome}` in `en`, `es` and `pt`. It is a page
namespace, not `Components.*`, the way `HomePage.*` already is.

## Risks / Trade-offs

- **`notFound()` inside `generateMetadata` is less travelled than in a page body.**
  → It is documented and throws the same control-flow signal; task 2.1 asserts it, and
  task 4.2 confirms the real 404 against a production build rather than trusting jsdom.
- **The nearest-boundary resolution (D4) is an assumption about Next's routing.**
  → Verified in the browser before the copy is written, with a stated fallback.
- **Five call sites must each add the guard, and a sixth route added later could forget.**
  → The guard is one import and one line, named so its absence reads as an omission;
  task 2.3 asserts every `generateMetadata` under `[locale]` calls it, so a new route
  without it fails a test rather than only a review.
- **A learner who mistypes a *locale* still gets the locale page even when they meant a
  path** (`/ea/courses` reads as an unsupported locale, not a missing page). → Correct
  as specified: the first segment is the locale, and `ea` is not one.

## Migration Plan

None. No stored shape, no route path and no public URL changes. `/manifest.json` and
`/es/error` keep returning 404; only the log line and the rendered copy change.
Rollback is reverting the code.

## Testing strategy

Red first, per task.

**Vitest unit**

- `src/i18n/require-supported-locale/require-supported-locale.test.ts` — returns the
  locale for each configured one; calls `notFound()` for `"manifest.json"`, `"xx"`, `""`
  and an arbitrary string from faker. `notFound` is mocked from `next/navigation`, as
  `src/app/[locale]/not-found.test.tsx` and the existing route tests already do.

**Vitest component + RTL**

- `src/app/[locale]/not-found.test.tsx` — rewritten for the page-not-found copy:
  heading, description and a home link, asserting the link is present and the copy
  names the page rather than the language.
- `src/app/[locale]/generate-metadata-locale-guard.test.ts` — **new**, and structural:
  it walks `src/app/[locale]/**` for every `page.tsx` and `layout.tsx` declaring
  `generateMetadata`, imports each, and asserts an unsupported locale is turned away
  while a supported one is not. The routes have no per-file tests today, and listing
  them by hand would leave the next route uncovered — the omission this guard is most
  likely to suffer.

**Playwright e2e**

- `e2e/not-found-routes.spec.ts` — the assertions only a real server can make:
  `/manifest.json` → 404 **and no `⨯` in the server's stderr**, `/es/error` → 404 with
  the page-not-found copy in Spanish, `/xx` → 404 with the locale copy, and
  `/manifest.webmanifest` → 200. The log assertion is the point: the whole first defect
  is invisible to a status-code check, which is why the current bug survived.

**Production build**

`pnpm build` then `pnpm start`, and the four probes above run against it by hand. The
defect only appears in a server log, and `next dev` and `next start` differ in what they
log — the bug was reported against `next start`, so that is where it is confirmed fixed.

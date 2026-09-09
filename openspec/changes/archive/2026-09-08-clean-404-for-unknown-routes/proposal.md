## Why

Two defects share one root: the application decides *too late* whether the `[locale]`
segment holds a real locale, and once it has decided, it cannot tell the two ways of
being "not found" apart.

**A request for any dotted path that is not a real static file logs a server error.**
`src/proxy.ts` excludes paths containing a dot from the next-intl matcher, so
`favicon.ico` and friends are not locale-prefixed. The cost is that `/manifest.json`
never reaches next-intl either, and Next then matches it against
`src/app/[locale]/page.tsx` — `[locale]` accepts one segment of anything. That route's
`generateMetadata` calls `shareMetadata({ locale: "manifest.json" })`, which **throws**:

```
⨯ Error: shareMetadata received an unsupported locale: "manifest.json"
```

The learner still gets a 404, because the layout's `hasLocale` guard runs afterwards and
calls `notFound()`. But the throw is logged on every such request, which makes the
server log lie about the health of a running deployment — measured against the current
build, `/manifest.json` and `/cualquier.cosa` both produce it.

**A mistyped path tells the learner their language does not exist.**
`[locale]/[...notFound]/page.tsx` calls `notFound()`, which renders
`[locale]/not-found.tsx` — and that page's copy is only about unsupported locales. So
`/es/error` renders "Idioma no soportado · Todavía no enviamos traducciones para este
idioma", when `es` is fully supported and it is the *page* that is missing. The learner
is told to fix something that is not broken.

## What Changes

- Every `generateMetadata` under `[locale]` SHALL reject an unsupported locale through
  one shared guard, calling `notFound()` before any metadata is built. The 404 stays;
  the logged error goes away.
- `shareMetadata` keeps throwing on an unsupported locale. That throw is a correct
  invariant for a real route — the fix is to never reach it with a garbage locale, not
  to soften the contract.
- The locale-segment not-found page stops blaming the language and says the **page** is
  missing, with a link back to the *active* locale's home rather than the default
  locale's. It keeps returning 404 and stays localized in `en`, `es` and `pt`.
- The "Locale not supported" copy is retired. Verified against a running server: the
  proxy answers `/xx` with a 307 to `/en/xx` and `/de/courses` with a 307 to
  `/en/de/courses`, so a request never reaches the application carrying an unsupported
  locale — every case that reaches this page is a supported locale with an unknown
  path. The old copy was reachable only by describing the wrong cause, which is exactly
  the defect above.

## Capabilities

### New Capabilities

_None._ Both changes tighten behaviour that existing capabilities already own.

### Modified Capabilities

- `lesson-view-polish`: the "Locale Not Found page is localized" requirement is removed
  — the proxy makes the state it describes unreachable — and replaced by one for an
  unknown path under a supported locale: localized, still 404, linking to the active
  locale's home.
- `site-metadata`: a requirement is added that metadata generation never throws for a
  locale the routing configuration does not declare; such a route resolves to a 404
  instead, with nothing written to the server log.

## Impact

- `src/app/[locale]/**` — the five routes that declare `generateMetadata`, plus the
  catch-all segment and its not-found boundary.
- `src/i18n/**` — the shared locale guard the metadata functions call.
- `src/messages/{en,es,pt}.json` — a new namespace for the page-not-found copy.
- No change to `src/proxy.ts`. Its dotted-path exclusion is correct and load-bearing:
  narrowing it to "real static files" is not expressible in a matcher, and widening it
  would send `favicon.ico` through the locale redirect.
- No change to `shareMetadata`'s contract, to the routing configuration, or to any
  domain code.

## Non-goals

- **No change to which paths the proxy matches.** The bug is what happens *after* an
  unmatched path reaches the router, not which paths it matches.
- **No custom 404 for the dotted paths themselves.** `/manifest.json` continues to
  resolve to the same 404 page as any other unknown route; only the logged error goes.
- **No global `error.tsx` or error-reporting change.** This removes one spurious error;
  it does not introduce error monitoring.
- **No redesign of the not-found page.** It keeps its existing structure and tokens;
  only the copy and the link target change.
- **No attempt to stop external clients requesting `/manifest.json`.** The application
  already advertises `/manifest.webmanifest` correctly; what a browser extension or a
  stale service worker asks for is outside its control.

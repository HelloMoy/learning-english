## Context

Three entry points start Sentry — `src/instrumentation-client.ts` (browser), `src/sentry.server.config.ts` and `src/sentry.edge.config.ts` — and all three take their options from one tested function, `sentryInitOptions(dsn)`, in `src/lib/sentry-init-options/sentry-init-options.ts`. It returns `{ dsn, sendDefaultPii: false, environment }` or `null`.

The event to drop, as Sentry stored it:

```
exception.values[0].type   = "UnhandledRejection"
exception.values[0].value  = "Non-Error promise rejection captured with value: provider destroyed"
mechanism                  = auto.browser.global_handlers.onunhandledrejection
```

It has no stack trace, because the rejection value is a string, not an `Error`. There is nothing to match on but the message.

`@sentry/core` 10.75.0 decides `ignoreErrors` in `getPossibleEventMessages`: it tests each pattern against the event message, the last exception's `value`, and `"<type>: <value>"`. A string pattern is a substring match; a `RegExp` is tested as written.

## Goals / Non-Goals

**Goals:**

- `ENGLISH-COURSE-2` stops receiving events.
- No other event is dropped, including any that resembles this one.
- The entry explains itself and names what would make it removable.

**Non-Goals:**

- Fixing the leak in Vidstack.
- Filtering any other issue.

## Decisions

### 1. `ignoreErrors` with an anchored regular expression

```ts
/^Non-Error promise rejection captured with value: provider destroyed$/
```

Anchored at both ends against the exception `value`, so `"provider destroyed"` appearing inside a longer, real message does not match. The prefix is Sentry's own wording for a non-Error rejection, which keeps a thrown `new Error("provider destroyed")` — a different event, with a stack — reportable.

**Alternative — the string `"provider destroyed"`.** Shorter, and a substring match: it would drop any error that mentions those words. Rejected.

**Alternative — `beforeSend`.** Can inspect the mechanism as well as the message, but for an event with no frames it adds nothing the anchored pattern does not already pin, and it is a function in a module whose contract is plain data.

**Alternative — an inbound filter in Sentry's project settings.** Lives outside the repository, is invisible in review, and still spends quota on ingestion.

### 2. The pattern lives in the shared options, not only in the browser entry point

`sentryInitOptions` gains `ignoreErrors`, and all three runtimes receive it.

The rejection can only happen in a browser, so scoping the entry to `instrumentation-client.ts` would be the narrower statement. But that file is an entry point with no test, and the shared function is where every other option is decided and asserted. On the server the pattern can never match: no server code produces a non-Error rejection with this value. One tested place is worth more than a narrower untested one.

The patterns are a named, exported constant with JSDoc that states the library, the version it was observed in, and the removal condition.

### 3. Test against Sentry's own filter, not only against the regular expression

A test that calls `pattern.test(message)` proves the expression, not that the SDK applies it to this event. The decisive test builds an event with the shape Sentry stored and passes it through the SDK's `eventFiltersIntegration` configured with the options' `ignoreErrors`, asserting it is dropped — and that a look-alike is kept.

## Risks / Trade-offs

- [Sentry rewords "Non-Error promise rejection captured with value:" in a future SDK] → the pattern stops matching and the issue reappears. That fails open: noise returns, nothing real is hidden. The SDK-level test fails at the upgrade if the matching rule changes shape.
- [Vidstack starts rejecting with the same string for a failure that matters] → not possible to distinguish by message alone. Accepted: the string is only ever produced by `destroy()`.
- [The filter outlives its reason] → the JSDoc names the removal condition; the Vidstack upgrade is the moment to check it.

## Testing strategy

| Behaviour | Layer | Where |
| --- | --- | --- |
| The options carry the teardown pattern whenever Sentry starts | Vitest unit | `src/lib/sentry-init-options/sentry-init-options.test.ts`, beside the existing "reports errors only" test |
| An event shaped like the stored one is dropped by the SDK's filter | Vitest unit | same file, through `eventFiltersIntegration` |
| A message that only contains the words is kept | Vitest unit | same file |
| A real `Error("provider destroyed")` event is kept | Vitest unit | same file |

The message under test is hardcoded rather than generated: the behaviour is tied to its exact form. No component or e2e layer — reproducing the leak would need a real YouTube iframe, and the thing being verified is what Sentry is told to drop, not that Vidstack leaks.

## Migration Plan

Ships with a normal deploy. Events already stored are unaffected; the issue is resolved in Sentry once the release is live, and it reopens by itself if the filter does not hold.

## Open Questions

None.

## Why

The header's add-to-home-screen control exists only for Safari on an iPhone, because iOS
exposes no install API and the only thing the app can do there is teach the flow. Every other
learner — Android Chrome, and Chrome or Edge on a desktop — gets nothing, even though on those
browsers the install is a single call the page is allowed to make.

Two things have to change together for that to be true in practice. Chrome only fires
`beforeinstallprompt` for a site whose service worker has a `fetch` handler, and this app has
no service worker at all. And a learner who has never installed a web page does not know what
"install" buys them, so firing Chrome's own dialog straight off the header chip would ask for
a yes to a question the learner has not been asked.

## What Changes

- A new **install prompt**: a compact modal — the app's identity, one sentence on what the
  learner gains, and two controls, *Add to home screen* / *Not now* — that confirms intent and
  then hands off to Chrome's native install dialog.
- The header control becomes **platform-aware**. On iPhone Safari it opens the existing guide,
  unchanged. Where `beforeinstallprompt` has fired it opens the new prompt. Where neither
  holds — Firefox, desktop Safari, an already-installed app — it still renders nothing.
- The prompt's **primary control is named for its platform**: *Add to home screen* on Android,
  *Install* on desktop, matching the vocabulary the learner's own browser uses. This is the
  same rule the iOS guide already follows when it says «···» rather than "share".
- A **pass-through service worker** is registered, with a `fetch` handler that does nothing but
  forward the request. It caches nothing, so it adds no invalidation layer — it exists only
  because Chrome's installability check requires the handler to be present.
- The dismissal is **not remembered**. Like the guide, the prompt is reachable from the header
  whenever the learner wants it, so *Not now* closes the modal and nothing else.

## Capabilities

### New Capabilities

- `install-prompt`: the direct-confirmation modal for browsers that expose an install API —
  capturing `beforeinstallprompt`, the modal's content and controls, the platform-specific
  wording, the hand-off to the native dialog, and the pass-through service worker that makes
  the event fire at all.

### Modified Capabilities

- `add-to-home-screen-guide`: the requirement *The control exists only where the flow is
  possible and useful* currently renders the header control for iPhone Safari alone. It changes
  to render wherever **any** install path exists, and to route to the guide or to the prompt
  according to which one the browser supports. The guide's own requirements — its steps, its
  autoplay, its refusal to claim it can install — are untouched.

## Non-goals

- **No install nag.** Nothing appears on its own, on any schedule, after any number of lessons.
  The prompt is reached from the header chip the learner chooses to press, exactly as the guide
  is. Dismissal state is therefore not stored either.
- **No offline support.** The service worker forwards every request and caches nothing. The app
  streams video from a content store a service worker cannot usefully cache, and the decision
  recorded in `manifest.ts` against a caching worker stands.
- **No guide for browsers without the API.** Firefox and desktop Safari can install a page
  through their own menus, but teaching those menus is a second guide with its own screens and
  its own translations. They keep rendering no control, as they do today.
- **No change to the iOS guide.** Its steps, animation, gesture and copy stay exactly as they
  are.
- **No install tracking or analytics.** Whether the learner accepted is not recorded anywhere.

## Impact

- **New**: `src/components/modals/install-prompt-modal/`, `src/hooks/use-install-prompt/`,
  and a `public/sw.js` with its registration.
- **Modified**: `src/components/install-app-button/install-app-button.tsx` (chooses which
  modal to open), `src/hooks/use-can-install-to-home-screen/` (widens beyond iPhone Safari, or
  is joined by a sibling hook), `src/components/site-header/site-header.tsx` (unchanged
  condition, new meaning), and `src/messages/{en,es,pt}.json` under a new
  `Components.InstallPrompt` namespace.
- **Browser API**: `beforeinstallprompt` and `appinstalled` are non-standard and Chromium-only.
  They are read behind a hook, so the rest of the app never touches them.
- **No domain impact.** Nothing here reaches `src/domain/**`; it is entirely a delivery-side
  concern.

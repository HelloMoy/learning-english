## Why

The install prompt asks a learner to add the course to their device and shows them the app icon
at 48px. The guides that teach the same act on Safari end by **showing the icon already in
place** — that frame exists because a guide which stops at the confirmation asks for effort and
never shows the payoff. The prompt makes the same omission in one screen instead of five.

There is a second, blocking reason. **The prompt never opens on Android.** Measured on the
emulator with Chrome 149 and Play Services: the manifest parses with no errors, all three icons
return 200, the service worker is registered and the origin is secure — and
`beforeinstallprompt` still does not reach the app. A listener attached **before** page scripts
sees it; ours subscribes from a `useEffect`, after hydration, by which time Chrome has already
fired it and will not fire it again. Choosing artwork for a dialog that cannot open would be
decorating a door that does not.

## What Changes

- The event is **captured before hydration**, by a small inline script in the document head that
  stashes it on `window`. `useInstallPrompt` reads that stash on mount as well as subscribing,
  so an event that arrived early is not lost.
- The prompt gains a **picture of what the taps buy**, chosen per platform:
  - **handheld** — the icon sitting on the home screen among the learner's other apps;
  - **desktop** — the course in the application switcher, among the learner's other
    applications.
- The **identity row is removed** from the prompt. The picture already shows the icon, and two
  copies of it in a 300px dialog is one too many.
- The desktop body copy changes to match its picture: it now speaks of **switching to it like
  any other application** rather than of the tabs it loses. Presence among apps is a claim the
  learner can check; the absence of tabs is not visible until afterwards.

## Capabilities

### Modified Capabilities

- `install-prompt`: *The install prompt exists only where the browser can perform the install*
  changes — the offer must survive arriving before hydration. *The prompt confirms intent and
  then hands off* changes — it now shows where the app will come to rest, and the platform's own
  picture is part of the platform's own wording.

## Non-goals

- **No change to the Safari guides.** They already end on their result frame.
- **No screenshots of a real operating system.** The pictures are drawn, like the guides'
  depictions, so they carry no OS that may not be the learner's.
- **No new decision.** The prompt stays one screen with two controls.
- **No artwork on the iOS/iPad/Mac guides' prompts** — they have none; they are guides.

## Impact

- **New**: `src/components/install-prompt-art/` and an inline capture script rendered from the
  locale layout.
- **Modified**: `src/hooks/use-install-prompt/use-install-prompt.ts` (reads the pre-hydration
  stash), `src/components/modals/install-prompt-modal/install-prompt-modal.tsx` (draws the art,
  drops the identity row), and `src/messages/{en,es,pt}.json` (`desktop.body`).
- **Risk**: an inline script in the head is a script that runs on every page. It is a listener
  and an assignment, nothing else.

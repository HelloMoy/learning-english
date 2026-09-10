## Why

`manifest.ts` already declares `display: "standalone"`, so a learner who adds the course to
their home screen gets it as an app: one tap from the home screen, no hunting for the tab.
Nothing in the product told them that was possible, and iOS gives a page no way to install
itself — Safari fires no `beforeinstallprompt` and exposes no API a button could call. The
only thing the app can ship is a guide.

A screen recording of the real flow on the target device corrected two assumptions this
change was originally built on:

- **The flow is four taps, not two.** iOS 26 Safari's bottom bar has no share glyph. It
  starts at the **«···»** circle, then Share, then Add to Home Screen, then a confirmation
  screen with an **Add** button and an "Open as Web App" toggle.
- **The payoff is access, not chrome.** The earlier framing sold this as a way to escape
  Safari's toolbar in the enlarged Player. That is a side effect. iOS's own confirmation
  screen states the real reason: *"so you can quickly access this website."*

A Remotion prototype proved the animation reads well and settled the pacing. It is also why
the guide is not a video: Safari renders its own menus in the device's language, and a
rendered MP4 cannot follow it. The same animation built from React components can, through
`next-intl`.

## What Changes

- **BREAKING (unreleased):** the flat `AddToHomeScreenGuide` component from the first pass
  of this change is removed. It taught three steps, started at the wrong control, and sold
  the toolbar. Nothing rendered it, so nothing downstream breaks.
- A mock iPhone screen, `GuidePhoneScreen`, that draws the iOS surface for a given step
  with that step's target highlighted, and animates the way iOS does — sheets rising, the
  menu opening out of its corner, a repeating tap on the target.
- `GuideAutoplay`, the guide itself: the four taps and then the result, on a loop.
  A self-paced stepper was built alongside it and compared in Storybook; the automatic one
  was chosen and the stepper deleted.
- The iOS labels themselves are localized. A learner whose phone is in Spanish is told to
  look for «Compartir», not "Share".
- The guide ends on the home screen with the course's icon among the learner's other apps —
  the thing the four taps buy, and deliberately not counted as a fifth step.
- `InstallAppButton` in the site header opens the guide in a modal, and
  `useCanInstallToHomeScreen` decides whether that control exists at all.
- Rows the learner does not need are drawn as muted placeholders at their true position and
  size: removing them outright would put the target at a height it does not occupy on the
  real device.

## Capabilities

### New Capabilities

- `add-to-home-screen-guide`: how the app teaches an iPhone Safari learner to install it —
  the four steps, how each one is localized down to the iOS label, how the guide is paced,
  where it is reached from, and what it deliberately does not attempt.

### Modified Capabilities

<!-- None. `lesson-page` owns the enlarge mode and the swipe-up hint and is untouched:
     this guide no longer claims any relationship to the toolbar. -->

## Impact

- **Removed**: the first pass's `add-to-home-screen-guide.{tsx,test.tsx,stories.tsx}`, and
  the `guide-stepper` variant once the comparison was decided.
- **New**: `install-steps`, `guide-phone-screen`, `guide-autoplay` under
  `src/components/add-to-home-screen-guide/`; `src/components/install-app-button/`;
  `src/components/modals/add-to-home-screen-modal/`;
  `src/hooks/use-can-install-to-home-screen/`; `src/hooks/use-fit-scale/`.
- **Modified**: `src/messages/{en,es,pt}.json` (the namespace is rewritten, not extended),
  `src/components/site-header/site-header.tsx`, and `src/app/globals.css` for the guide's
  keyframes.
- **Dependencies**: none. Remotion stays out of the repo; it was a prototyping tool and its
  output is a reference artifact, not a shipped asset.
- **Adjacent finding, not fixed here**: the root layout declares no `appleWebApp` metadata,
  so the name under the installed icon and the status-bar style are Safari's defaults. That
  is `site-metadata`'s spec and its own change, and it should be checked on a device.

## Non-goals

- **Installing the app from a button.** iOS exposes no API for it.
- **Remembering dismissal across visits.** The guide notifies its caller and holds no such
  state; nothing yet persists it.
- **Android's `beforeinstallprompt` flow**, which is a different mechanism with a different
  UI.
- **Shipping the Remotion MP4** or adding Remotion to the project.
- **Verifying the Spanish and Portuguese iOS labels on a device.** Only the English ones are
  confirmed, from the recording; the others are translations and remain unchecked.

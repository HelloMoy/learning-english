## Why

Two groups of Safari learners are offered nothing at all.

**iPad.** `useCanInstallToHomeScreen` matches `/iPhone|iPod/`, and iPadOS 13+ sends a Macintosh
user agent — verified on iPadOS 26.5, where Safari reports
`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) … Version/26.5 Safari/605.1.15` with
`navigator.platform` reading `MacIntel`. Nothing in that string says iPad, so the guide never
renders. Safari fires no `beforeinstallprompt` either, so the install prompt never renders. The
iPad falls through both paths.

**Safari on macOS.** Since macOS Sonoma it adds a web app to the Dock, in its own window, with
its own icon — the same payoff the iPhone guide sells. The app offers no way to find out.

Neither is a browser that cannot do this. Both flows were captured tap by tap — the iPad from
the iPadOS 26.5 simulator and confirmed against a recording of a real device, macOS from Safari
26.6.2 on macOS 26.6.2 and confirmed against a recording — rather than written from memory, the
standard the iPhone guide already set. Doing that caught two things memory would have got wrong:

- **The iPad's share popover opens collapsed, and "Add to Home Screen" is not on it.** Only
  "View More" puts it there — the same trap the iPhone sets, and the same one everyone forgets.
- **macOS has no such step.** Its popover opens with the whole list, "Add to Dock" fifth.
  Copying the iPad's flow onto the Mac would invent a tap that does not exist.

## What Changes

- The header control is offered to **Safari on an iPad** and to **Safari on macOS**, joining the
  iPhone guide and the install prompt as third and fourth routes.
- A new **iPad guide**: four taps — **Share** in the top toolbar, **View More**,
  **Add to Home Screen**, **Add** — on the four surfaces iPadOS actually shows.
- A new **macOS guide**: three clicks — **Share** in the toolbar, **Add to Dock**, **Add** — on
  the three surfaces Safari actually shows.
- Both are built from **one depiction engine**: a browser window, a popover anchored to the
  share control, and a confirmation. It is a second engine alongside the iPhone's, not a third,
  because the two Safari-on-a-big-screen flows share their shape.
- The **playback rules are extracted and shared**: the timer, the wrap, the position report, the
  reduced-motion rule and the horizontal gesture are lifted out of the iPhone guide into one
  place all three read from. The iPhone guide's behaviour, copy and tests do not change; only
  where the rules live does.
- The iPad is told apart from the Mac by `navigator.maxTouchPoints`, the only signal that
  separates them.

## Capabilities

### New Capabilities

- `safari-install-guides`: the iPad's four taps and macOS's three, the surfaces they happen on,
  how iPad and Mac are told apart, and the depiction rules that differ from the iPhone's.

### Modified Capabilities

- `add-to-home-screen-guide`: two requirements change. *The control exists only where the flow
  is possible and useful* gains the iPad and the Mac as further routes. *The depiction moves the
  way the surface it depicts moves* is scoped to the iPhone's surfaces, because its
  rising-sheet rule describes a motion neither Safari makes. Every other requirement — the five
  iPhone taps, the autoplay, the gesture, the refusal to claim it can install — is untouched and
  stays about the iPhone.

## Non-goals

- **No guide for Firefox or Chrome, on any platform.** On iPadOS they are WebKit but carry no
  Add to Home Screen flow; on a desktop they either install with one click (already covered by
  the install prompt) or cannot install at all.
- **No shared depiction with the iPhone.** Its surfaces rise from the bottom of a phone; these
  hang off a toolbar control on a wide window. One component drawing both would be wrong on one
  of them, which is the failure the guides exist to avoid.
- **No change to the iPhone guide's steps, copy, animation or rendered behaviour.**
- **No install prompt for Safari.** It fires no event on any Apple platform.
- **No verification of Spanish and Portuguese OS labels.** Both recordings were in English. The
  translated control names are written from the existing catalogue where it already has them,
  and translated fresh where it does not; a learner on a Spanish Mac has not been observed.

## Impact

- **New**: `src/components/safari-install-guide/` (its own steps module, depiction and
  autoplay), `src/components/modals/safari-install-guide-modal/`, and
  `src/hooks/use-safari-install-surface/`.
- **Modified**: `src/hooks/use-install-path/use-install-path.ts` gains `"ipad-guide"` and
  `"mac-guide"`, `src/components/install-app-button/install-app-button.tsx` routes to them, and
  `src/messages/{en,es,pt}.json` gains the step sentences plus `macAddToDock`.
- **Refactored, behaviour unchanged**: the iPhone guide's playback logic moves into
  `src/hooks/use-guide-playback/`, which its existing tests keep honest.
- **Reused**: the iOS control labels already in `Components.AddToHomeScreenGuide` —
  `iosShare`, `iosViewMore`, `iosAddToHomeScreen`, `iosAdd`, `iosOpenAsWebApp` — name the same
  controls on an iPad, so the iPad guide reads them rather than duplicating them.
- **Untouched**: `use-can-install-to-home-screen`, whose iPhone-only regex is correct.
- **No domain impact.**

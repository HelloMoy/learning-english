## Context

One guide exists. `GuideAutoplay` walks `INSTALL_STEPS`, `GuidePhoneScreen` draws a fixed-size
iPhone with five iOS surfaces on it, `AddToHomeScreenModal` puts the pair in a dialog, and
`useCanInstallToHomeScreen` decides who sees the header chip. The recently added install prompt
sits beside it, and `useInstallPath` already routes between the two.

Two flows were captured rather than recalled. The iPad's came from the iPadOS 26.5 simulator,
driven tap by tap, and was then confirmed against a screen recording of a real iPad. The Mac's
came from Safari 26.6.2 — its toolbar Share button read out of the accessibility tree, its
popover and confirmation captured — and was confirmed against a recording. What they showed:

| | iPhone (existing) | iPad | macOS |
| --- | --- | --- | --- |
| Starts at | «···», bottom bar | Share, top toolbar | Share, toolbar |
| Share surface | sheet rising from the bottom | popover anchored to the control | popover anchored to the control |
| Collapsed first? | yes → **View More** | yes → **View More** | **no** — whole list at once |
| Target row | Add to Home Screen | Add to Home Screen | **Add to Dock**, 5th in the list |
| Page behind share surface | dimmed | **undimmed** | **undimmed** |
| Confirmation | full screen | **light card**, centred, **Add top-right**, *Open as Web App* switch | **sheet on the window**, **Cancel/Add bottom-right**, no switch |
| Taps | 5 | 4 | 3 |

The iPad and the Mac share a shape. The iPhone does not share it with either.

## Goals / Non-Goals

**Goals:**

- iPad and macOS Safari learners reach a guide that names controls actually on their screen.
- One depiction engine for the two Safari-on-a-big-screen flows, not two.
- One definition of playback behaviour for all three guides.
- The iPhone guide's rendered behaviour unchanged, proven by its existing tests.

**Non-Goals:**

- Sharing a depiction with the iPhone.
- Guides for Firefox, or for Chrome on an iPad.
- Verifying Spanish and Portuguese OS labels against a device in those languages.

## Decisions

### Two depiction engines, not one and not three

`GuidePhoneScreen` stays exactly as it is. A new `SafariWindowScreen` draws a browser window —
toolbar, page, popover anchored under the share control, confirmation — and takes a `platform`
of `"ipad" | "mac"` that decides the frame's proportions, whether the popover carries a
round-action row and a collapsed state, and which confirmation is drawn.

**Why not one component for all three:** the iPhone's surfaces are a different shape, in a
different place, moving a different way. A component with a phone branch and a window branch
would be two components sharing a file.

**Why not two separate window components:** the iPad and the Mac differ in three enumerable
details on an otherwise identical frame. Two components would duplicate the toolbar, the
anchoring, the dimming rule and the target-highlight machinery so that a fix to any of them has
to be made twice.

### Playback rules move into `useGuidePlayback`

The timer, the wrap, the per-frame reset, the reduced-motion check and the swipe wiring come out
of `GuideAutoplay` into `src/hooks/use-guide-playback/`. It takes a frame count and returns
`{ frameIndex, swipeHandlers }`. `GuideAutoplay` and the new `SafariGuideAutoplay` both call it.

**Why extract rather than duplicate:** the spec says all three guides play the same way. Two
copies of "one timer per frame, reset on manual move, silent under reduced-motion" is two places
for that to stop being true. The iPhone guide's tests already cover every one of those rules, so
they are the safety net for the move.

**Why the iPhone guide is still "untouched":** its rendered output, its copy and its tests do
not change. Only where the rules live does.

### Surface detection: one hook, one shape

`useSafariInstallSurface` returns `"iphone" | "ipad" | "mac" | "none"`, replacing nothing —
`useCanInstallToHomeScreen` keeps its iPhone job and this hook reads it for the iPhone answer.

The Mac-family test is a Safari user agent that carries none of the tokens of the browsers that
impersonate it (`Chrome`, `Chromium`, `Edg`, `OPR`, `Firefox`), none of the iOS vendor tokens
the iPhone check already lists, and `Macintosh`. Then `navigator.maxTouchPoints > 1` splits iPad
from Mac.

**Why `maxTouchPoints` and not a touch-events feature test:** `ontouchstart` is present on
plenty of desktop Chromium builds and absent on some touch Macs; `maxTouchPoints` is the signal
Apple's own guidance points at and the one that actually reads 0 on a Mac and 5 on an iPad,
verified on both here.

**Why not `navigator.userAgentData`:** Safari does not implement it.

### `useInstallPath` grows two routes, keeps its shape

`InstallPath` becomes `"none" | "guide" | "ipad-guide" | "mac-guide" | "prompt"`. The prompt
still wins. `InstallAppButton` maps each to a modal and an accessible name.

**Why not one guide route with a platform payload:** the button opens a different modal per
platform, and a discriminated union that already carries the decision is cheaper to read at the
call site than a route plus a field the caller has to switch on anyway.

### One modal, parameterised

`SafariInstallGuideModal` takes `platform` and renders `SafariGuideAutoplay` for it. Mirrors
`AddToHomeScreenModal` — transparent content, no close button, the guide draws its own dismiss.

### Copy

`Components.SafariInstallGuide` holds the step sentences for both platforms plus `macAddToDock`.
The iPad reads its control labels from `Components.AddToHomeScreenGuide`, which already has
`iosShare`, `iosViewMore`, `iosAddToHomeScreen`, `iosAdd` and `iosOpenAsWebApp` in all three
locales and names the same controls on an iPad.

**Known gap, recorded deliberately:** both recordings were in English. `macAddToDock` and every
step sentence are translated here, not observed on a Spanish or Portuguese system. The iPad's
control labels are the existing, already-shipped strings, so they carry whatever confidence they
already had.

## Risks / Trade-offs

- **Apple changes the popover between releases.** → The same standing risk as the iPhone guide.
  The steps live in one module per platform, so a change is an edit to a list, and the surfaces
  are named by the step rather than hardcoded in the depiction.
- **`maxTouchPoints` misfires on a touch-capable Mac.** No such Mac ships, but if one did, its
  owner would be shown the iPad guide. → The iPad guide's first step names the Share control in
  the toolbar, which a Mac also has, so the failure degrades to a guide with one wrong later
  step rather than to nonsense. Accepted.
- **Extracting playback could change iPhone behaviour silently.** → The extraction is done with
  the iPhone guide's existing suite green before and after, and that suite already asserts the
  timer, the wrap, the gesture, the per-frame reset and the reduced-motion rule.
- **Three guides is a lot of depiction to keep true.** → The iPad and Mac share one component,
  and every surface is driven by the step list rather than by a switch inside the drawing code.

## Migration Plan

Additive. An iPad or Mac Safari learner who previously saw no chip now sees one. Rollback is
returning `"none"` for the two new surfaces; nothing else depends on them.

## Testing strategy

Red before green on every task.

| Behaviour | Layer | Mirrors |
| --- | --- | --- |
| `useGuidePlayback` advances, wraps, resets per frame, is silent under reduced motion, answers a gesture | **Vitest unit** (`renderHook`) | the assertions currently in `guide-autoplay.test.tsx`, moved down a level |
| `GuideAutoplay` still behaves exactly as before the extraction | **Vitest component + RTL** | its existing suite, unchanged and kept green |
| `useSafariInstallSurface` splits iPhone / iPad / Mac / none, excludes impostor user agents, withholds until hydration | **Vitest unit** (`renderHook`) | `use-can-install-to-home-screen.test.ts` — same `vi.stubGlobal` shape, with `maxTouchPoints` added to the stub |
| `useInstallPath` resolves the five routes and still prefers the prompt | **Vitest unit** | its existing suite, extended |
| `SAFARI_INSTALL_STEPS` holds four iPad steps and three Mac steps, in order, with no `View More` on the Mac | **Vitest unit** | `install-steps.test.ts` |
| `SafariWindowScreen` draws the right surface per step, dims only the confirmation, and names the target in the active locale | **Vitest component + RTL** | `guide-phone-screen.test.tsx` |
| `SafariGuideAutoplay` reports position, shows the result frame unnumbered, dismisses once | **Vitest component + RTL** | `guide-autoplay.test.tsx` |
| The header chip opens the right modal per surface and names itself accordingly | **Vitest component + RTL** | `install-app-button.test.tsx` |
| Every locale writes every step of both platforms; no macOS string says "home screen" | **Vitest unit** | `messages.test.ts`, which already walks the catalogues this way |

**Not Playwright.** Every behaviour is component-level, and the one thing Playwright could add —
a real iPad — it cannot provide. `AGENTS.md` sends cases Vitest and RTL can cover to Vitest.

**Storybook.** `safari-guide-autoplay.stories.tsx` and `safari-window-screen.stories.tsx`, each
with an iPad story and a macOS story, plus a Spanish story, per the four-rule checklist.

**Visual check.** Both guides reviewed in the browser with Playwright MCP against the captured
frames before the change is called done.

## Open Questions

None blocking. One to revisit: whether the macOS guide should also mention `File → Add to Dock…`
as an alternative path in a single line of text. It is verified to exist; it is left out for now
because a guide that offers two ways to do one thing asks the learner to choose before they
have understood either.

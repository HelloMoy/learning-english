## Context

A screen recording of the real flow on the target iPhone replaced guesswork with evidence,
and invalidated the first implementation of this change: iOS 26 Safari's bottom bar is a
floating row of a back circle, an address pill and a **«···»** circle, with no share glyph.
The flow is «···» → Share → Add to Home Screen → Add, and the confirmation screen carries an
"Open as Web App" toggle that is what actually makes the icon launch standalone.

A Remotion prototype of the same instructions was built and reviewed. It is why this change
exists in its current form, and it is also why the guide is not a video: Remotion renders
React to an MP4, and the MP4 is the one form of that animation that cannot be translated.
Safari localizes its own menus; a recorded "Share" is wrong for a phone showing «Compartir».
Rebuilding the same components inside the app keeps the animation and adds `next-intl`.

## Goals / Non-Goals

**Goals:**

- Correct for the device: four steps, right entry point, right labels per locale.
- The animation the prototype earned, in components rather than a rendered file.
- Reachable whenever the learner wants it, and absent where the flow does not exist.
- Accessible: the depiction decorative, every step followable from text alone.

**Non-Goals:**

- Persisting dismissal, Android's install prompt, adding Remotion to the project.

## Decisions

### One step definition, and a separate result

`install-steps` exports the four taps as data — message key, target key, which iOS surface
the step acts on — and `INSTALL_RESULT` separately. The result is not an `InstallStep`: the
learner taps nothing on it and it carries no target, so numbering it would tell them the flow
costs five taps when it costs four. `GuideAutoplay` cycles `[...INSTALL_STEPS, INSTALL_RESULT]`
while the numbering keeps counting only `INSTALL_STEPS`.

### Automatic pacing, chosen by comparison

Both a self-paced stepper and this looping variant were built and reviewed side by side in
Storybook. The stepper's case was that Safari's own menu covers the screen mid-flow, so a
guide that moves on has to be rewound; the loop's case is that the learner does nothing. The
loop was chosen, and the stepper deleted rather than left to rot. What survives from the
stepper's argument is the step counter: a loop with no position gives the learner no way to
know whether they have seen the whole thing.

### The iOS labels live in the message catalogue

`iosMore`, `iosShare`, `iosAddToHomeScreen`, `iosAdd` are message keys, and both the
instruction text and the mock screen read the same key. This is the whole reason for building
in-app rather than shipping the render, so it is not an implementation detail to be shortcut.

Rows the learner does not need carry no text at all — they are muted bars at their true
position and size. This keeps the translation surface to the four labels that matter.

### The mock is drawn in fixed pixels, then measured to fit

The depiction is 274x586 with everything inside it in fixed pixels, because it is a
reconstruction of someone else's UI and its proportions are the point. Fitting it to a modal
is therefore a scaling problem, and it is solved by measuring: `useFitScale` reads the
container with a `ResizeObserver` and returns a factor.

Two earlier attempts are worth recording because both looked right and were not:

- `@media (max-height: …)` steps are guesses about device heights, and were wrong on the
  first real phone they met.
- `max-h-full` on the guide bounded nothing: a percentage max-height resolved against a
  parent whose own height is auto computes to `none`. The bound has to be in viewport units.

The scaled box is `w-fit` inside a `justify-center` flex parent. A full-width box would put
the fixed-width depiction at its left edge, and scaling about the box's centre would then drag
it off centre — which is exactly what happened before the `w-fit`.

### Motion in CSS, not JavaScript

The keyframes live in `globals.css` so that the project's existing `prefers-reduced-motion`
block neutralises all of them for free. The one motion that is not CSS is the loop's own
advance, which is a timer and so reads the preference directly.

### The depiction is a picture of iOS, not part of this design system

It uses Apple's colours and inline styles rather than the project's theme tokens, and does not
follow the app's light/dark mode. The learner's Safari looks the way it looks either way.

### The header control is presentational; the header decides

`InstallAppButton` renders unconditionally and `SiteHeader` gates it on
`useCanInstallToHomeScreen`. The first version put the hook inside the button, which made it
unrenderable in Storybook on a desktop browser and mixed "what this looks like" with "whether
this should exist". The split matches `ThemeToggle` and `LocaleSwitcher` beside it.

Detection is user-agent sniffing because there is nothing to feature-detect: iOS exposes no
install API, which is the entire reason a guide exists. It reports `false` until hydration,
so the control appears a moment after load rather than desynchronising the server render.

## Testing strategy

| Behavior                                                          | Layer                                 | Mirrors                        |
| ----------------------------------------------------------------- | ------------------------------------- | ------------------------------ |
| The four taps in iOS's order; the result is not one of them        | Vitest unit on `install-steps`        | new — pure data, no DOM        |
| Copy read from `Components.AddToHomeScreenGuide`                   | Vitest + RTL, `useTranslations` spy   | `swipe-up-hint.test.tsx`       |
| Mock screen is decorative; step text names the control unaided     | Vitest + RTL, accessible-name queries | `swipe-up-hint.test.tsx`       |
| Mock screen labels its target in the active locale, all 4 surfaces | Vitest + RTL                          | new                            |
| Pointer and tap indication present; sheets and menu carry entries  | Vitest + RTL, class assertions        | new                            |
| Advances on its interval, loops, shows the result, holds on reduced motion | Vitest + RTL, fake timers, `matchMedia` stub | new           |
| Dismiss notifies the caller once; no control claims to install     | Vitest + RTL + `user-event`           | `swipe-up-hint.test.tsx`       |
| The depiction is centred, shrinks and clips rather than scrolling  | Vitest + RTL, class assertions        | new                            |
| `useFitScale` math and resize response                             | Vitest + RTL, `ResizeObserver` stub   | new                            |
| `useCanInstallToHomeScreen` across browsers and standalone         | Vitest, `navigator` stubs             | new                            |
| The modal names itself and holds exactly one close control         | Vitest + RTL with `NiceModal.Provider`| new                            |
| The header shows the control only when installable, and leads with it | Vitest + RTL                       | `site-header.test.tsx`         |
| Renders correctly in `en` / `es` / `pt`                            | Storybook, reviewed in the browser    | `swipe-up-hint.stories.tsx`    |
| Fits and centres on a real device                                  | iOS Simulator, Safari                 | new                            |

Following `swipe-up-hint.test.tsx`, unit tests mock `next-intl` with **Spanish** messages, so
a component rendering raw keys or English fallbacks fails in CI rather than in a lesson.

jsdom ships neither `matchMedia` nor `ResizeObserver`, and measures every element as zero.
Both are stubbed per test file rather than globally, because only these components need them.

No Playwright: the guide is a component behind a header control, and Vitest + RTL covers it.
The layout questions that Playwright might have caught are the ones jsdom cannot answer at
all, and those were checked on the simulator instead.

## Risks / Trade-offs

- **The mock will drift as iOS changes.** → It is a reconstruction of one recording of one iOS
  version. The step text names each control, so a drifted mock degrades to a stale picture
  beside correct instructions rather than to a wrong instruction. Re-checking it belongs with
  any future iOS bump.
- **Layout bugs do not fail the test suite.** → Three of them shipped past green tests during
  this change. jsdom measures everything as zero, so geometry is unfalsifiable there; the
  simulator is the only judge and should be used whenever this component's layout changes.
- **The Spanish and Portuguese iOS labels are not verified on a device** — only the English
  ones are, from the recording. → Worth a check on a phone set to each language.
- **The control appears after hydration and nudges the chips after it one step right.** →
  Accepted: a single shift at load, in exchange for the control leading the row as asked.
- **User-agent sniffing is inherently brittle.** → There is no alternative; iOS exposes no
  capability to detect. The failure mode is a control that does not appear, not a broken page.

## Open Questions

- Whether dismissal should ever persist, and whether anything besides the header should open
  the guide. Both are additive and neither blocks this change.

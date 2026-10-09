## Why

Sentry issue `ENGLISH-COURSE-2` is the noisiest in the project: ten events between 2026-09-23 and 2026-10-07, on Chrome for macOS and Safari for iOS, each one

```
UnhandledRejection: Non-Error promise rejection captured with value: provider destroyed
```

raised as a learner leaves a lesson. It survived the fix archived as `2026-09-23-ci-unhandled-player-rejection`, which guarded the application's own `play()` and `pause()` calls.

The remaining source is inside `@vidstack/react` and is not reachable from application code. The YouTube provider's `#remote()` creates and stores a deferred promise for **every** command it posts to the iframe — `mute`, `unMute`, `seekTo`, `setVolume`, `setPlaybackRate` — but only `playVideo` and `pauseVideo` are ever resolved. The setters that issue the other commands (`setMuted`, `setCurrentTime`, `setVolume`, `setPlaybackRate`) discard the promise. When the provider is destroyed it rejects everything still stored with the string `"provider destroyed"`, and nobody is listening.

The provider issues several of those commands by itself while it sets up, so no interaction is needed. Reproduced locally on 2026-10-09 against `develop`, in Chromium, signed in as a throwaway learner, with a listener on `unhandledrejection`:

| Steps | `provider destroyed` rejections |
| --- | --- |
| Open a lesson, wait for the player to be ready | 0 |
| …then navigate to another lesson without touching the player | 7 |
| …or seek once (time slider, or the arrow key) and then navigate | 11 |

So **every** exit from a lesson emits it, several times over; Sentry's de-duplication is what keeps the count at one event per exit. The leak is present in 1.15.6, which the project pins, and unchanged in 1.15.7, the latest release.

Nothing breaks for the learner. What breaks is the issue list: a tracker whose top issue is known noise trains its reader to stop looking.

## What Changes

- The Sentry configuration drops this one rejection before it is sent, matched on its complete message.
- The reason and the upstream location are recorded next to the pattern, so the entry can be deleted when Vidstack stops leaking the promises.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `production-deployment`: adds a requirement that known third-party teardown noise is not reported, and that everything else still is.

## Impact

- **Modified**: `src/lib/sentry-init-options/sentry-init-options.ts` and its test.
- **Spec**: `openspec/specs/production-deployment/spec.md`.
- No dependency, environment variable or UI change.

## Non-goals

- **Patching Vidstack with `pnpm patch`.** It would fix the leak at its source, but the code lives in a production chunk with a hashed file name (`vidstack-BmcqUMKx.js`) and has a development twin; the patch would silently stop applying on the next upgrade. It also changes `package.json` and the lockfile, which needs its own approval.
- **Swallowing the rejection in the browser** with an application-level `unhandledrejection` listener. That hides it from the console as well as from Sentry, for no learner-visible gain.
- **`ENGLISH-COURSE-3`** (`TypeError: e is not a function`, one event, iOS Safari). Also a Vidstack teardown race, reproduced on the iOS 26.5 simulator on 2026-10-09 with the same stack as the stored event. `SliderPreview.#updatePlacement` is throttled to an animation frame and scheduled by a `ResizeObserver` on the time slider's preview; its callback calls the slider's `disabled()`, which is `TimeSlider.#isDisabled`, which reads `this.$props.disabled`. Destroying a component replaces its props with an empty object and disconnects the observer, but does not cancel a frame already requested — so a preview that resized just before the player was torn down runs one frame late against a slider whose `disabled` is `undefined`. It fired in 2 of 12 lesson exits on the simulator (one with the preview forced to resize every frame, one without). Nothing a learner can see breaks: the callback belongs to a component that is already gone. It cannot be filtered safely — in production the function name is minified, so the message is the generic `e is not a function`, and the browser does not know which chunk is Vidstack. It is archived in Sentry; the real fix is upstream, or a `pnpm patch`, which is its own decision.
- **`ENGLISH-COURSE-5`** (`Cannot read properties of undefined (reading 'toLowerCase')`, one event). The stack frames are `<obscura:bootstrap>` and `ext:core/01_core.js`: a headless scraper with an incomplete DOM presenting a Chrome user agent, not a browser a learner uses. Archived in Sentry.
- **Reporting the leak upstream.** Worth doing, and not part of this change.

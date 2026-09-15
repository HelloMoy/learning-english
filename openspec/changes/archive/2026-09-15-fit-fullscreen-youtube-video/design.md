## Context

Vidstack's base stylesheet gives the provider `width: 100%; height: 100%` inside the
player. In the browser's own fullscreen the player element becomes the screen, so the
provider takes the screen's shape. A YouTube-sourced lesson's `iframe.vds-youtube` is
`height: 1000%` (its own chrome pushed out of the visible band) and is centred on the
provider by `lesson-video-player.css`. YouTube fits the video to the iframe's width, so
its height is `providerWidth × 9/16`. On a 20:9 landscape phone (e.g. 915×412) that is
515px against a 412px band: ~50px lost at the top and at the bottom. Controls are a
sibling layout over the whole player, which is why they look right.

The enlarged fallback (iPhone) solved the same problem by making the **player** the
largest 16:9 box (`max-width: calc(100dvh * 16 / 9)`). In native fullscreen the browser
owns the player's box — it is always the screen — so the bound has to move one level
down, to the provider.

## Goals / Non-Goals

**Goals:**
- No top/bottom crop of the video in native fullscreen on any aspect ratio.
- Controls, gestures and overlays keep the full-screen geometry.

**Non-Goals:**
- Touching the enlarged fallback, the in-page box, or portrait fullscreen behaviour.
- Any JS / component change; this is layout only.

## Decisions

**Bound the provider, not the iframe.** One rule:

```css
[data-media-player][data-fullscreen] [data-media-provider] {
  max-width: calc(100dvh * 16 / 9);
  margin-inline: auto;
}
```

The player is an `inline-flex` row, so the provider is a flex item; `max-width` clips its
width to the 16:9 of the screen's height and `margin-inline: auto` centres it. Height
stays 100%, so the provider is exactly 16:9 on wide screens and unchanged on narrower
ones (portrait: `100dvh × 16/9` exceeds the width and the bound is inert). The existing
iframe centring is expressed in percentages of the provider, so it follows automatically.

- *Alternative — resize the iframe:* would duplicate Vidstack's `1000%` arithmetic and the
  WebKit-safe offsets for a second geometry. Rejected.
- *Alternative — scope to `iframe.vds-youtube` providers only:* the self-hosted `<video>`
  already uses `object-fit: contain`, so bounding its provider paints the same pixels.
  One unscoped rule is simpler and also covers Vimeo, which has the same mechanism.
- *Alternative — `100vh`:* in fullscreen the viewport is the screen, and `dvh` matches the
  enlarged-mode rule already in the file. Kept `dvh` for consistency.

**`data-fullscreen` as the hook.** Vidstack sets it on the player whenever the element is
in the Fullscreen API's fullscreen (and on iOS native video fullscreen, where the rule is
harmless). The enlarged fallback never sets it, so the two modes cannot interact.

## Risks / Trade-offs

- [Poster and blocker are sized from the provider] → both are inside the provider and
  shrink with it, which is correct: they must cover the video, not the pillarbox.
- [Seek zones are 20% of the player, not the video] → unchanged by design; a tap on the
  pillarbox edge still seeks, which is the larger, friendlier target.
- [An engine that reports a `dvh` different from the fullscreen screen height] → the
  worst case is a small crop or a thin letterbox, never worse than today.

## Testing strategy

- **Playwright e2e** (`e2e/lesson-video-player.spec.ts`, block "GIVEN a browser that can
  take the player fullscreen") is the only layer that can prove it: jsdom does not lay the
  player out and never builds the embed frame (see the file's header). The new tests
  mirror the existing geometry guards ("its centre sits on the visible band's centre"):
  set a 915×412 viewport, enter fullscreen through the library's own button, wait for
  `data-fullscreen`, then assert on bounding boxes — provider width ≤ height × 16/9 + 1,
  provider centred horizontally, frame centre on provider centre, and `.vds-video-layout`
  as wide as the viewport.
- No Vitest change: the rule is CSS only and component tests cannot observe it.
- Manual visual check with Playwright MCP under Android landscape emulation.

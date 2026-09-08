import type { MediaPlayerInstance } from "@vidstack/react";

/**
 * Test helpers for driving a Vidstack player under jsdom.
 *
 * @remarks
 * Two facts about the player make these necessary, and both were measured
 * rather than assumed:
 *
 * 1. Its React callbacks (`onPlay`, `onPause`, `onTimeUpdate`, …) fire only
 *    for events dispatched through the **instance's** `dispatchEvent`. The
 *    same event sent to `player.el` — the very same DOM node — reaches raw
 *    `addEventListener` subscribers and never the React props.
 * 2. The events carry a trigger chain. Vidstack's own controls read
 *    `event.triggers.hasType(...)` on every `play`, and the `DOMEvent` class
 *    that supplies it is not part of the package's public exports, so a
 *    synthetic event must stand in for it or the player's internal listener
 *    throws before the component's own handler is reached.
 *
 * None of this simulates playback. jsdom loads no media provider, so
 * `currentTime` stays `0` however the player is driven — these helpers deliver
 * *events*, and what a component does in response is what they let a test
 * observe. Actual playback is Playwright's job.
 */

/**
 * Finds the `MediaPlayerInstance` that owns a rendered player element.
 *
 * @remarks
 * Uses Vidstack's own `find-media-player` event, which the player answers by
 * invoking the callback passed as the event detail. This is the supported way
 * to reach a player a test did not render itself — a `LessonView` test, say,
 * which is three components away from the `ref`.
 *
 * @param element - Any element inside the player, or the player element itself
 * @returns The owning player, or `null` when the element is not inside one
 *
 * @example
 * ```ts
 * const player = findPlayerIn(screen.getByRole("region"));
 * emitPlayerEvent(player, "play");
 * ```
 */
export function findPlayerIn(element: Element): MediaPlayerInstance | null {
  let player: MediaPlayerInstance | null = null;

  element.dispatchEvent(
    new CustomEvent("find-media-player", {
      detail: (found: MediaPlayerInstance) => {
        player = found;
      },
      bubbles: true,
      composed: true,
    }),
  );

  return player;
}

/**
 * Dispatches a media event the way the player's own provider would.
 *
 * @param player - The player to drive; a `null` player is a no-op, so a test
 *                 that has not found one fails on its assertion rather than
 *                 on a type error
 * @param type - The media event name, e.g. `play`, `pause`, `time-update`
 * @param detail - The event detail, when the handler under test reads one
 */
export function emitPlayerEvent(
  player: MediaPlayerInstance | null,
  type: string,
  detail: unknown = null,
): void {
  const event = new CustomEvent(type, { detail });
  Object.defineProperty(event, "triggers", {
    value: { hasType: () => false, add: () => {} },
  });

  player?.dispatchEvent(event);
}

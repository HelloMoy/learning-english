import type { Locator } from "@playwright/test";

/** The slice of Vidstack's `MediaPlayerInstance.state` the suite reads. */
type ReportedState = {
  currentTime: number;
  playbackRate: number;
  paused: boolean;
};

/**
 * A value the player reports about itself, read from the
 * `MediaPlayerInstance` that owns the element.
 *
 * @remarks
 * Vidstack answers a `find-media-player` event by calling the function in its
 * detail, which is the supported way to reach the instance from outside React
 * — and the only way to see what a YouTube-sourced video is really doing,
 * since the embed's own readouts are behind a cross-origin frame. Every lesson
 * is YouTube-sourced, so there is no `<video>` element to read instead.
 *
 * @param player - The `[data-media-player]` element, or any element inside it
 * @param key - Which state value to read
 * @returns The value the player currently holds for `key`
 */
async function playerReports<Key extends keyof ReportedState>(
  player: Locator,
  key: Key,
): Promise<ReportedState[Key]> {
  const value = await player.evaluate((element, stateKey) => {
    let reported: unknown;
    element.dispatchEvent(
      new CustomEvent("find-media-player", {
        detail: (found: { state: Record<string, unknown> }) => {
          reported = found.state[stateKey];
        },
        bubbles: true,
        composed: true,
      }),
    );
    return reported;
  }, key);
  return value as ReportedState[Key];
}

/**
 * The shortcut the library last handled itself, by the name of its action.
 *
 * @remarks
 * This is the state the layout's keyboard display paints from, and it is read
 * here rather than off that display because the display is on screen for half
 * a second — a poll can miss it, and a miss reads as "never shown". The state
 * stays set. It is unwrapped inside the page: the value also carries the DOM
 * event, which does not survive the trip back.
 *
 * @param player - The `[data-media-player]` element, or any element inside it
 * @returns The action's name, or `null` while the library has handled no key
 */
export async function lastLibraryShortcutOf(player: Locator): Promise<string | null> {
  return player.evaluate((element) => {
    let action: string | null = null;
    element.dispatchEvent(
      new CustomEvent("find-media-player", {
        detail: (found: { state: { lastKeyboardAction: { action: string } | null } }) => {
          action = found.state.lastKeyboardAction?.action ?? null;
        },
        bubbles: true,
        composed: true,
      }),
    );
    return action;
  });
}

/** Where the video really is, in seconds. */
export const currentTimeOf = (player: Locator) => playerReports(player, "currentTime");

/** The rate it is really running at. */
export const playbackRateOf = (player: Locator) => playerReports(player, "playbackRate");

/** Whether the player is paused — true before the first play, too. */
export const isPausedOf = (player: Locator) => playerReports(player, "paused");

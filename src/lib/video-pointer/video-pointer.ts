/**
 * Whether a pointer event is a primary-button press or release that landed on
 * the video itself.
 *
 * @remarks
 * The player's own listeners live on the player element, where every pointer
 * event on the chrome bubbles to as well. This is the filter that Vidstack's
 * gestures get for free by listening on the provider: an element drawn over
 * the video that takes the pointer — the control bar, the in-player resume
 * overlay, the scroll hint's dismiss control — keeps its own behaviour, and a
 * secondary button is never a gesture.
 *
 * @param event - A pointer event heard on the player element
 * @returns `true` when the gesture listeners should act on it
 *
 * @category Utilities
 */
export function isPrimaryPointerOnTheVideo(event: PointerEvent): boolean {
  return (
    event.button === 0 &&
    event.target instanceof Element &&
    event.target.closest("[data-media-provider]") !== null
  );
}

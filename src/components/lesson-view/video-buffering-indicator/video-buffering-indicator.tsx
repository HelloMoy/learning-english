"use client";

import { Spinner } from "@vidstack/react";

/**
 * The class that marks the opaque core at the centre of the indicator.
 *
 * @remarks
 * `lesson-video-player.css` sizes and paints the core by this class, and a
 * test finds it the same way, so neither has to know the element's tag or
 * position in the tree. Exported for the same reason `SEEK_ZONE_CLASS` is.
 *
 * @category Components
 */
export const BUFFERING_CORE_CLASS = "lesson-video-player__buffering-core";

/**
 * The buffering indicator the lesson player draws at the centre of the frame:
 * the Default Layout's own ring, with an opaque core.
 *
 * @remarks
 * It fills the layout's `bufferingIndicator` slot in every chrome — the load
 * layout, the compact one and the full one — and reproduces the layout's own
 * markup exactly (`vds-buffering-indicator`, `vds-buffering-spinner`,
 * `vds-buffering-track`, `vds-buffering-track-fill`), so every token and
 * transition the theme already applies to the ring keeps applying to this
 * one. The single addition is the **core**: a disc drawn inside the ring.
 *
 * The core exists because a YouTube-sourced lesson's embed paints its own
 * 36px spinner on the very same spot, in the very same moments — the player's
 * `waiting` state is derived from the embed's own Buffering state — and the
 * ring is hollow, so a learner saw two spinners, one inside the other. The
 * embed's cannot be reached from outside its frame; an opaque 44px disc
 * behind the ring hides it. The geometry and the visibility rule live in
 * `lesson-video-player.css`, where the core follows the ring: seen only while
 * the player carries `data-buffering`, gone the moment frames roll.
 *
 * The indicator is decorative. The player's announcer already reports
 * buffering to assistive technology, exactly as it does for the layout's own
 * indicator, which is also unlabelled.
 *
 * @category Components
 */
export function VideoBufferingIndicator() {
  return (
    <div
      className="vds-buffering-indicator"
      aria-hidden="true"
    >
      <span className={BUFFERING_CORE_CLASS} />
      <Spinner.Root className="vds-buffering-spinner">
        <Spinner.Track className="vds-buffering-track" />
        <Spinner.TrackFill className="vds-buffering-track-fill" />
      </Spinner.Root>
    </div>
  );
}

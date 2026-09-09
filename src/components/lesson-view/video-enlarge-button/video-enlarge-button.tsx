"use client";

import { useMediaState } from "@vidstack/react";
import { defaultLayoutIcons } from "@vidstack/react/player/layouts/default";
import { useTranslations } from "next-intl";

/**
 * The fallback control that fills the viewport with the video, seated beside
 * Vidstack's own fullscreen button.
 *
 * @remarks
 * It sits *after* that button rather than replacing it, so a browser that can
 * take the player fullscreen keeps doing exactly that. Vidstack's button asks
 * the browser whether fullscreen is supported and hides itself when the answer
 * is no — which is every iPhone, where no element Fullscreen API exists and a
 * YouTube-sourced lesson has no `<video>` for the platform's own entry point.
 * This one is the mirror image: it renders nothing while `canFullscreen` is
 * true, so exactly one of the two is ever in the control bar.
 *
 * The gate is the **capability the player reports**, not the operating system.
 * Sniffing iOS would be wrong in both directions — a self-hosted `<video>`
 * lesson on an iPhone can use `webkitEnterFullscreen` and should keep it, and
 * an engine that drops element fullscreen later is served without a release.
 * Reading it needs no ref: the control is a layout slot, so it is inside
 * `<MediaPlayer>` by construction and the media context is already in scope.
 *
 * It renders Vidstack's own enter/exit glyphs rather than a `lucide-react`
 * icon: it sits inside the player's control bar, among buttons drawn from that
 * set, and a second icon vocabulary would read as a foreign control.
 *
 * The copy is borrowed from `Components.VideoPlayer` — the same
 * `enter-fullscreen` / `exit-fullscreen` words the layout already uses for
 * every other surface — so the action keeps one name across the app and every
 * locale already has it.
 *
 * The state is `aria-pressed` rather than a second button, so the control keeps
 * one identity and assistive technology hears the toggle rather than a
 * disappearing and reappearing pair.
 *
 * It holds no state of its own: `useEnlargedVideo` owns the mode and this
 * renders the answer.
 *
 * @param isEnlarged - Whether the video currently fills the viewport
 * @param onToggle - Enter the mode, or leave it
 * @category Components
 */
export function VideoEnlargeButton({
  isEnlarged,
  onToggle,
}: {
  isEnlarged: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("Components.VideoPlayer");
  const canFullscreen = useMediaState("canFullscreen");
  const { Enter, Exit } = defaultLayoutIcons.FullscreenButton;
  const Icon = isEnlarged ? Exit : Enter;

  if (canFullscreen) return null;

  return (
    <button
      type="button"
      className="vds-button"
      aria-label={t(isEnlarged ? "exit-fullscreen" : "enter-fullscreen")}
      aria-pressed={isEnlarged}
      onClick={onToggle}
    >
      <Icon className="vds-icon" />
    </button>
  );
}

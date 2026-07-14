/**
 * The v1 video player. A single HTML5 `<video controls>` element — no
 * custom chrome, no custom JavaScript wrapper. The native control exposes
 * play/pause, scrubber, time, playback rate, mute, volume, fullscreen, and
 * a caption track slot.
 *
 * Captions ship in a future change (see GLOSSARY.md § Deferred to a future
 * change); the `poster` attribute is set when the lesson has one.
 */
export function NativeVideoPlayer({
  source,
  poster,
  title,
  ariaLabel,
}: {
  source: string;
  poster?: string;
  title: string;
  ariaLabel?: string;
}) {
  return (
    <video
      controls
      preload="metadata"
      title={title}
      aria-label={ariaLabel}
      poster={poster}
      className="aspect-video w-full rounded bg-slate-900"
    >
      <source
        src={source}
        type="video/mp4"
      />
    </video>
  );
}

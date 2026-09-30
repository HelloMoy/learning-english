import Image from "next/image";

const PLACEHOLDER_GLOW =
  "radial-gradient(90% 90% at 70% 10%, color-mix(in oklab, var(--glow) 24%, var(--background)), var(--background) 70%)";

/** Props for {@link CinemaHeroArtwork}. */
export type CinemaHeroArtworkProps = {
  /** The video poster to draw, or `undefined` for the placeholder glow. */
  poster: string | undefined;
};

/**
 * The backdrop of a cinema hero frame: a video poster fading into the page
 * background from the left and from the bottom, so copy laid over it reads in
 * both themes.
 *
 * @remarks
 * Fills its nearest positioned ancestor behind the content (`-z-10`), so the
 * frame needs `relative isolate`. Without a poster it draws a soft glow in the
 * theme's accent. Purely decorative: hidden from assistive technology.
 *
 * @example
 * ```tsx
 * <article className="relative isolate overflow-hidden">
 *   <CinemaHeroArtwork poster={firstVideo?.lesson.poster} />
 *   …
 * </article>
 * ```
 */
export function CinemaHeroArtwork({ poster }: CinemaHeroArtworkProps) {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 -z-10"
    >
      {poster ? (
        <Image
          src={poster}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 1100px, 100vw"
          className="object-cover object-[center_30%]"
        />
      ) : (
        <span
          className="absolute inset-0"
          style={{ background: PLACEHOLDER_GLOW }}
        />
      )}
      <span className="absolute inset-0 bg-linear-to-r from-background/80 via-background/25 to-transparent" />
      <span className="absolute inset-0 bg-linear-to-t from-background from-5% via-background/45 via-35% to-transparent" />
    </span>
  );
}

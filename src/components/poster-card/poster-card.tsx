import { PlayButton } from "@/components/play-button/play-button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/utils";

import Image from "next/image";

const ARTWORK_GLOW =
  "radial-gradient(120% 120% at 30% 12%, color-mix(in oklab, var(--glow) 26%, var(--background)), var(--background) 72%)";
const FOCAL_GLOW =
  "radial-gradient(60% 55% at 70% 30%, color-mix(in oklab, var(--glow) 26%, transparent), transparent 70%)";
const IMAGE_SCRIM =
  "linear-gradient(180deg, color-mix(in oklab, var(--background) 25%, transparent), color-mix(in oklab, var(--background) 78%, transparent))";

const NUMBER_SIZE = { sm: "text-3xl", md: "text-4xl", lg: "text-5xl" } as const;

/**
 * The reusable Immersion Cinema "poster". Composes an artwork box (warm
 * radial glow, optional cover image behind a scrim, an oversized sequence
 * number, an optional eyebrow/headline, and a decorative play circle) with
 * an optional meta row (title + badge) beneath it.
 *
 * When `href` is set the whole card is a locale-aware Link whose accessible
 * name is the title — that link IS the control, so the inner play circle is
 * purely decorative and never nests a button inside a link.
 *
 * Set `priority` on the one card that is above the fold (the home page's
 * featured poster). It preloads the artwork instead of lazy-loading it,
 * which is what Next.js asks for when that image is the Largest Contentful
 * Paint. Leave it off for cards in a grid — preloading them all would
 * compete for bandwidth and defeat the purpose.
 */
export function PosterCard({
  title,
  href,
  number,
  numberPosition = "left",
  eyebrow,
  headline,
  posterUrl,
  posterAlt,
  priority = false,
  badge,
  showPlay = true,
  showMeta = true,
  framed = true,
  aspect = "video",
  size = "md",
  className,
}: {
  title: string;
  href?: string;
  number?: string;
  numberPosition?: "left" | "right";
  eyebrow?: string;
  headline?: string;
  posterUrl?: string | null;
  posterAlt?: string;
  /** Preload the artwork — set only on the above-the-fold card. */
  priority?: boolean;
  badge?: React.ReactNode;
  showPlay?: boolean;
  showMeta?: boolean;
  framed?: boolean;
  aspect?: "video" | "wide";
  size?: keyof typeof NUMBER_SIZE;
  className?: string;
}) {
  const artwork = (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl border border-border",
        aspect === "video" ? "aspect-video" : "aspect-[16/7]",
      )}
      style={{ background: ARTWORK_GLOW }}
    >
      {posterUrl ? (
        <>
          <Image
            src={posterUrl}
            alt={posterAlt ?? ""}
            fill
            sizes="(max-width: 640px) 100vw, 400px"
            priority={priority}
            className="object-cover opacity-60"
          />
          <div
            className="absolute inset-0"
            style={{ background: IMAGE_SCRIM }}
            aria-hidden="true"
          />
        </>
      ) : null}
      <div
        className="absolute inset-0"
        style={{ background: FOCAL_GLOW }}
        aria-hidden="true"
      />
      {eyebrow ? (
        <span className="absolute top-5 left-5 text-xs font-bold tracking-[0.4em] text-gold uppercase">
          {eyebrow}
        </span>
      ) : null}
      {number ? (
        <span
          className={cn(
            "absolute top-3 font-sans font-extrabold text-gold tabular-nums",
            NUMBER_SIZE[size],
            numberPosition === "right" ? "right-5" : "left-5",
          )}
          style={{ textShadow: "0 2px 24px color-mix(in oklab, var(--glow) 45%, transparent)" }}
        >
          {number}
        </span>
      ) : null}
      {headline ? (
        <span
          className="absolute bottom-12 left-5 font-sans text-4xl font-extrabold text-amber"
          style={{ textShadow: "0 3px 30px color-mix(in oklab, var(--glow) 40%, transparent)" }}
        >
          {headline}
        </span>
      ) : null}
      {showPlay ? (
        <span className="absolute right-4 bottom-4">
          <PlayButton
            size={size === "lg" ? "lg" : "md"}
            decorative
          />
        </span>
      ) : null}
    </div>
  );

  const meta =
    showMeta && (title || badge) ? (
      <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
        {title ? (
          <span className="text-sm leading-snug font-semibold text-foreground">{title}</span>
        ) : null}
        {badge ? <span>{badge}</span> : null}
      </div>
    ) : null;

  const body = (
    <>
      {artwork}
      {meta}
    </>
  );

  const containerClass = cn(
    "flex flex-col overflow-hidden rounded-2xl transition-colors",
    framed && "border border-border bg-[linear-gradient(180deg,var(--panel-2),var(--card))]",
    className,
  );

  if (href) {
    return (
      <Link
        href={href as never}
        data-testid="poster-card"
        className={cn(
          containerClass,
          "hover:border-gold/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        )}
      >
        {body}
      </Link>
    );
  }

  return (
    <article
      data-testid="poster-card"
      className={containerClass}
    >
      {body}
    </article>
  );
}

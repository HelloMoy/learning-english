import { Eyebrow } from "@/components/eyebrow/eyebrow";
import { Link } from "@/i18n/navigation";

import { Play } from "lucide-react";

/**
 * The Immersion Cinema home hero: eyebrow kicker, oversized display title,
 * a short subtitle, and the primary "Open course" call to action plus a
 * secondary "My List" placeholder. Presentational — copy and the target
 * href are passed in by the page.
 */
export function CinemaHero({
  eyebrow,
  title,
  subtitle,
  openLabel,
  openHref,
  myListLabel,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  openLabel: string;
  openHref?: string;
  myListLabel: string;
}) {
  return (
    <div className="flex max-w-xl flex-col gap-5">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="font-sans text-6xl leading-[0.98] font-extrabold tracking-tight text-foreground sm:text-7xl">
        {title}
      </h1>
      <p className="max-w-md text-lg leading-relaxed text-muted-foreground">{subtitle}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {openHref ? (
          <Link
            href={openHref as never}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold tracking-wide text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            data-testid="home-open-course"
          >
            <Play
              className="size-4"
              fill="currentColor"
            />
            {openLabel}
          </Link>
        ) : null}
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-lg border border-border bg-foreground/5 px-5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {myListLabel}
        </button>
      </div>
    </div>
  );
}

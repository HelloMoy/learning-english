import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/utils";

/**
 * The Immersion Cinema wordmark: `LEARN·ENGLISH`, letter-spaced, with the
 * middle dot in the gold accent. Links home (locale-aware). The visible
 * text carries the accessible name, so no extra `aria-label` is needed.
 *
 * @remarks
 * The type scale steps down below `sm`. `LEARN·ENGLISH` contains no spaces, so
 * it cannot wrap: at the full `17px`/`0.28em` it measures 203px and leaves too
 * little of a 320px viewport for the header's locale and theme controls. At
 * `13px`/`0.18em` it measures 139px, which fits the budget in the
 * `mobile-viewport-fit` change's design (D2) with room to spare.
 */
export function Brand({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href as never}
      className={cn(
        "inline-flex items-center rounded-sm font-sans text-[13px] leading-none font-extrabold tracking-[0.18em] text-foreground uppercase focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:text-[17px] sm:tracking-[0.28em]",
        className,
      )}
    >
      LEARN<span className="px-[0.15em] text-gold">·</span>ENGLISH
    </Link>
  );
}

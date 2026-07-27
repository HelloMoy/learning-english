import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/utils";

/**
 * The Immersion Cinema wordmark: `LEARN·ENGLISH`, letter-spaced, with the
 * middle dot in the gold accent. Links home (locale-aware). The visible
 * text carries the accessible name, so no extra `aria-label` is needed.
 */
export function Brand({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href as never}
      className={cn(
        "inline-flex items-center rounded-sm font-sans text-[17px] leading-none font-extrabold tracking-[0.28em] text-foreground uppercase focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
    >
      LEARN<span className="px-[0.15em] text-gold">·</span>ENGLISH
    </Link>
  );
}

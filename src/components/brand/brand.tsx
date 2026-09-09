import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/utils";

/**
 * The Immersion Cinema wordmark: `ENGLISH·COURSE`, letter-spaced, with the
 * middle dot in the gold accent. Links home (locale-aware). The visible
 * text carries the accessible name, so no extra `aria-label` is needed.
 *
 * The mark is not localized. It names the product the site publishes to the
 * outside world, so it reads the same in every locale and matches what the
 * metadata announces as `og:site_name`.
 *
 * @remarks
 * The type scale steps down below `sm`. `ENGLISH·COURSE` contains no spaces,
 * so it cannot wrap: at the full `17px`/`0.28em` it measures 223px and leaves
 * too little of a 320px viewport for the header's locale and theme controls.
 * At `13px`/`0.18em` it measures 153px, ending 169px into a 320px viewport and
 * leaving the remaining 151px to the locale and theme chips — measured in
 * Chromium in all three locales, which render it identically because the mark
 * is locale-invariant.
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
      ENGLISH<span className="px-[0.15em] text-gold">·</span>COURSE
    </Link>
  );
}

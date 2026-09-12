import { cn } from "@/lib/utils/utils";

/**
 * A pulsing block that stands in for content that has not arrived yet.
 *
 * @remarks
 * The one shape every loading placeholder in the app is composed from. It draws
 * a rounded rectangle in the theme's muted fill and pulses; it has no size of
 * its own, so callers give it one through `className` and build a shell by
 * arranging several of them in the real layout's containers.
 *
 * **It is deliberately silent.** No role, no accessible name, no text. A lesson
 * shell holds a dozen of these and must announce "loading" once, not twelve
 * times — that single announcement belongs to the shell's own live region, not
 * to the shapes. Never add an `aria-label` here.
 *
 * A placeholder is only useful if it traces the shape of what replaces it. Size
 * these against the real component's own classes — same aspect ratio, same
 * max-width, same breakpoints — so the arriving content fills positions that are
 * already correct instead of re-laying the page out.
 *
 * @example
 * ```tsx
 * // A title line, then a 16:9 frame.
 * <Skeleton className="h-8 w-2/3" />
 * <Skeleton className="aspect-video w-full" />
 * ```
 *
 * @param className - Sizing and positioning classes, merged with the primitive's own
 * @returns A decorative pulsing block
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };

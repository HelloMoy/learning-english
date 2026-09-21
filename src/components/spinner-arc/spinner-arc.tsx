import { cn } from "@/lib/utils/utils";

/**
 * Props for {@link SpinnerArc}.
 */
export type SpinnerArcProps = {
  /** Extra classes, for size and spacing. Colour is inherited from the caller. */
  className?: string;
};

/**
 * The gold arc that turns while a request is in flight.
 *
 * @remarks
 * Purely decorative, and hidden from assistive technology: it repeats what a
 * visible label already says in words. Never render it on its own — pair it
 * with a label that names what is being waited on, or the wait is silent for
 * anyone who is not looking at it.
 *
 * The arc takes its colour from `currentColor`, so it reads correctly on a
 * filled button and on a plain surface without being told which it is on. The
 * rotation lives in `globals.css` under `.spinner-arc`, where the global
 * `prefers-reduced-motion` block can still it.
 *
 * @example
 * ```tsx
 * <Button disabled>
 *   <SpinnerArc /> Signing in…
 * </Button>
 * ```
 *
 * @category Components
 */
export function SpinnerArc({ className }: SpinnerArcProps) {
  return (
    <span
      aria-hidden="true"
      data-testid="spinner-arc"
      className={cn(
        "spinner-arc inline-block size-3.5 shrink-0 rounded-full border-2 border-current/30 border-t-current",
        className,
      )}
    />
  );
}

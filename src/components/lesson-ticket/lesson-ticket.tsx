import { cn } from "@/lib/utils/utils";

/** Ticket dimensions and type size per size step. */
const SIZE_CLASSES = {
  sm: "h-[22px] w-9 text-xs",
  md: "h-8 w-[52px] text-lg",
} as const;

/**
 * One lesson's ticket: a notched strip of cream arcade paper carrying the
 * lesson's sound.
 *
 * @remarks
 * Tickets are cream so they never read as gold, which belongs to prizes. The
 * notches are cut by the `lesson-ticket` mask in `globals.css`, so they show
 * the surface behind whatever that surface is.
 *
 * The ticket is decorative: the sentence beside it — "+1 ticket", "12 of 17
 * tickets" — says what it means, so it is hidden from assistive technology.
 *
 * @example
 * ```tsx
 * <LessonTicket symbol="ɪ" />
 * ```
 *
 * @param symbol - The lesson's sound, from `ticketSymbol`
 * @param size - `md` for notifications, `sm` for inline examples
 * @param className - Extra classes, e.g. an entrance animation
 */
export function LessonTicket({
  symbol,
  size = "md",
  className,
}: {
  symbol: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-ticket-size={size}
      className={cn(
        "lesson-ticket inline-flex shrink-0 items-center justify-center bg-ticket font-extrabold text-ticket-ink",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {symbol}
    </span>
  );
}

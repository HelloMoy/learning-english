import { cn } from "@/lib/utils/utils";

/**
 * A non-interactive summary of a course's modules rendered as a row of
 * numeric marks separated by a connector. The number of marks equals the
 * module count of the course and is used on the locale-home card and the
 * course overview. Accessibility is provided through the `aria-label` and
 * a visually hidden text description — the marks themselves are not
 * interactive on the home card.
 */
export function PracticeTrackSummary({
  moduleCount,
  label,
  className,
}: {
  moduleCount: number;
  label: string;
  className?: string;
}) {
  if (moduleCount <= 0) {
    return null;
  }
  return (
    <div
      className={cn("flex items-center gap-2", className)}
      aria-label={label}
      role="img"
    >
      <span className="sr-only">{label}</span>
      <ol
        className="flex flex-1 items-center gap-1.5"
        aria-hidden="true"
      >
        {Array.from({ length: moduleCount }, (_, index) => (
          <li
            key={index}
            className="flex flex-1 items-center gap-1.5"
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-signal-yellow text-xs font-semibold text-ink tabular-nums"
              data-testid="practice-track-mark"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            {index < moduleCount - 1 ? <span className="h-px flex-1 bg-practice-blue/30" /> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

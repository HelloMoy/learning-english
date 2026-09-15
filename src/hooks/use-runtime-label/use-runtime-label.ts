import { formatDuration } from "@/lib/format-duration/format-duration";

import { useTranslations } from "next-intl";

/**
 * Turns a runtime in seconds into the course overview's localized label.
 *
 * @remarks
 * The hero's course total, a shelf's module total and a video card's own
 * runtime all read the same way — "8 min", "2 h", "2 h 39 min" — so the
 * choice between the three messages lives here once instead of in each of
 * them. `formatDuration` does the arithmetic; the message catalogue owns the
 * wording and word order per locale.
 *
 * Works in Server Components as well as Client Components: it only calls
 * `useTranslations`.
 *
 * @example
 * ```tsx
 * const runtimeLabel = useRuntimeLabel();
 * runtimeLabel(9540); // "2 h 39 min"
 * ```
 *
 * @returns A function that labels a runtime given in seconds
 */
export function useRuntimeLabel(): (seconds: number) => string {
  const t = useTranslations("CourseCatalog.courseOverview");

  return (seconds) => {
    const { hours, minutes } = formatDuration(seconds);
    if (hours === 0) return t("durationMinutes", { minutes });
    if (minutes === 0) return t("durationHours", { hours });
    return t("durationHoursMinutes", { hours, minutes });
  };
}

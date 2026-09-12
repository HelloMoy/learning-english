"use client";

import { useTranslations } from "next-intl";

/**
 * The one thing a loading shell says out loud.
 *
 * @remarks
 * A route shell is a wall of `Skeleton` shapes, every one of them silent
 * by design. This carries the single live region that tells a screen reader
 * something is on its way — one announcement per navigation, not one per shape.
 * Exactly one of these belongs in each shell, and nothing else in a shell may
 * claim a role.
 *
 * **A client component on purpose.** `loading.tsx` receives no route params, so
 * it cannot call `setRequestLocale`, which this project requires before
 * `useTranslations` in a Server Component. A client component sidesteps that
 * entirely: it reads its copy from the `NextIntlClientProvider` already mounted
 * in `[locale]/layout.tsx`, with no locale plumbing and no dependency on
 * resolving the locale from request headers.
 *
 * The text is the accessible name rather than visible copy. A shell that also
 * printed the word "Loading" would be saying twice what its shapes already say
 * once, and the shapes are the part that survives a glance.
 *
 * @example
 * ```tsx
 * export default function Loading() {
 *   return (
 *     <main>
 *       <LoadingStatus />
 *       <div aria-hidden="true">
 *         <Skeleton className="h-8 w-2/3" />
 *       </div>
 *     </main>
 *   );
 * }
 * ```
 *
 * @returns A visually hidden `role="status"` live region
 */
export function LoadingStatus() {
  const t = useTranslations("Components.LoadingStatus");

  return (
    <span
      role="status"
      className="sr-only"
    >
      {t("label")}
    </span>
  );
}

"use client";

import { usePathname } from "@/i18n/navigation";

import { useLocale, useTranslations } from "next-intl";

/**
 * The line on the Page Not Found state that names the address the learner
 * asked for, so a mistyped path is something they can see rather than guess.
 *
 * @remarks
 * A Client Component because the requested path is only readable through
 * `usePathname`; the page around it stays on the server. It lives beside
 * `not-found.tsx`, its only caller, rather than under `src/components/`.
 *
 * The path is shown as it was requested, percent-encoding intact. Decoding it
 * would let anyone craft a link that prints a readable sentence of their
 * choosing on this page; encoded, the same link reads as `%20`-studded noise.
 *
 * An unbroken path has no spaces to wrap at and no upper bound on its length,
 * so it breaks anywhere and is clamped to two lines — it can neither push the
 * page sideways nor bury the actions below it.
 *
 * Spec: lesson-view-polish § "The Page Not Found state names the path that was
 * requested".
 */
export function MissingPath() {
  const t = useTranslations("PageNotFound");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <p className="line-clamp-2 font-mono text-[0.8125rem] break-all text-muted-foreground">
      {t.rich("missingPath", {
        path: `/${locale}${pathname}`,
        requested: (path) => <span className="text-foreground">{path}</span>,
      })}
    </p>
  );
}

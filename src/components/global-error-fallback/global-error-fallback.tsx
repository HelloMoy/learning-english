"use client";

import { routing } from "@/i18n/routing";
import type en from "@/messages/en.json";

import * as Sentry from "@sentry/nextjs";
import { hasLocale } from "next-intl";
import { useEffect, useState } from "react";

type GlobalErrorCopy = (typeof en)["GlobalError"];

/**
 * Props for {@link GlobalErrorFallback}.
 */
export type GlobalErrorFallbackProps = {
  /** What broke the root layout. */
  error: Error & { digest?: string };
  /** Renders the failed segment again. */
  retry: () => void;
};

/**
 * What a learner sees when the root layout itself fails: one line, one
 * retry button, and a report to Sentry.
 *
 * @remarks
 * It replaces the layout that mounts `NextIntlClientProvider`, so it cannot
 * use `useTranslations`. It reads the locale from the URL's first segment
 * instead and loads that catalogue itself. The import is dynamic so the
 * catalogues are only downloaded when an error actually happens, not with
 * every page.
 *
 * @example
 * ```tsx
 * <GlobalErrorFallback error={error} retry={unstable_retry} />
 * ```
 */
export function GlobalErrorFallback({ error, retry }: GlobalErrorFallbackProps) {
  const locale = localeOfCurrentPath();
  const copy = useGlobalErrorCopy(locale);

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      {copy ? (
        <FallbackMessage
          copy={copy}
          retry={retry}
        />
      ) : null}
    </main>
  );
}

function FallbackMessage({ copy, retry }: { copy: GlobalErrorCopy; retry: () => void }) {
  return (
    <>
      <h1 className="text-2xl font-extrabold text-foreground">{copy.title}</h1>
      <p className="text-sm text-muted-foreground">{copy.body}</p>
      <button
        type="button"
        onClick={retry}
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {copy.retry}
      </button>
    </>
  );
}

function useGlobalErrorCopy(locale: (typeof routing.locales)[number]) {
  const [copy, setCopy] = useState<GlobalErrorCopy>();
  useEffect(() => {
    void import(`@/messages/${locale}.json`).then((catalogue: { default: typeof en }) =>
      setCopy(catalogue.default.GlobalError),
    );
  }, [locale]);
  return copy;
}

function localeOfCurrentPath() {
  const firstSegment =
    typeof window === "undefined" ? undefined : window.location.pathname.split("/")[1];
  return hasLocale(routing.locales, firstSegment) ? firstSegment : routing.defaultLocale;
}

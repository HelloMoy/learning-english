import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";

import "../globals.css";

import { CinemaBackground } from "@/components/cinema-background/cinema-background";
import { GlobalProviders } from "@/components/global-providers";
import { SiteHeader } from "@/components/site-header/site-header";
import { SkipLink } from "@/components/skip-link/skip-link";
import { routing } from "@/i18n/routing";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Dynamic per-locale metadata. Reads the localized `HomePage.title` so the
 * document `<title>` reflects the current locale. The description follows.
 *
 * Spec: lesson-view-polish § Requirement: "The Lesson Page sets a per-page
 * <title>".
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "HomePage" });
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate the incoming locale — middleware should already have done this,
  // but this guards against direct SSG builds with unknown locales.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering for all Server Components below this layout.
  setRequestLocale(locale);

  return (
    // `suppressHydrationWarning` is required on <html> when using next-themes:
    // the provider injects a script that sets `class="dark"` on <html> before
    // React hydrates, which would otherwise trigger a hydration mismatch warning.
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <NextIntlClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SkipLink />
            <CinemaBackground />
            <SiteHeader />
            <GlobalProviders>
              <div className="flex-1">{children}</div>
            </GlobalProviders>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

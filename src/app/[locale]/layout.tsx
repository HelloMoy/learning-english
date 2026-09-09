import { StructuredData } from "@/components/structured-data/structured-data";
import { websiteSchema } from "@/lib/course-schema/course-schema";
import { siteUrl } from "@/lib/site-url/site-url";

import type { Metadata, Viewport } from "next";
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
 * Site-wide theme colour, one entry per theme.
 *
 * @remarks
 * `themeColor` left `metadata` in Next 14 and is silently ignored there now.
 * Two entries rather than one because the app defaults to dark and treats light
 * as an opt-in, so the browser chrome has to be told about both.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e6" },
    { media: "(prefers-color-scheme: dark)", color: "#08080b" },
  ],
};

/**
 * Per-locale defaults every route inherits: the origin its relative URLs are
 * absolutized against, and the title template that appends the brand.
 *
 * @remarks
 * `metadataBase` is what turns a relative `og:url` or `og:image` into the
 * absolute URL crawlers require. Without it Next emits the relative path, the
 * page renders fine, and every share preview silently loses its image.
 *
 * `title.default` covers routes that set no title of their own; a route that
 * does set one gets `%s · English Course` from the template.
 *
 * Spec: site-metadata § "resolves one absolute site URL", lesson-view-polish
 * § "The Lesson Page sets a per-page <title>".
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const home = await getTranslations({ locale, namespace: "HomePage" });
  const metadata = await getTranslations({ locale, namespace: "Metadata" });
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: home("title"),
      template: `%s · ${metadata("siteName")}`,
    },
    description: home("subtitle"),
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
          {/* `enableSystem={false}` is what actually stops the OS deciding:
              with it on, `next-themes` keeps `system` in its theme list and a
              `prefers-color-scheme` listener alive, so changing only the
              default would still leave a stored `system` driven by the OS.
              `themes` is named explicitly rather than left to the library's
              default so the app's two themes are stated where they are
              configured. */}
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            themes={["dark", "light"]}
            disableTransitionOnChange
          >
            <StructuredData data={websiteSchema({ siteUrl: siteUrl(), locale })} />
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

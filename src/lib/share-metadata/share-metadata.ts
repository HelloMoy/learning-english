import { routing } from "@/i18n/routing";

import type { Metadata } from "next";
import { hasLocale } from "next-intl";

/** A locale the application serves. */
type Locale = (typeof routing.locales)[number];

/**
 * Prefixes a route with a locale, the way the routing configuration says to.
 *
 * @remarks
 * `getPathname` from `@/i18n/navigation` is the obvious tool here and is not
 * used, deliberately: `next-intl/navigation` resolves to its react-client build
 * outside a Next request, where `getPathname` degrades to returning `"/"` for
 * every input. That makes the one function every canonical and every hreflang
 * depends on impossible to unit-test — and head tags are invisible, so an
 * untested builder is an unverified one.
 *
 * The rule below is only correct while `localePrefix` is `"always"`, which
 * `share-metadata.test.ts` asserts, so a change to that setting fails a test
 * rather than silently emitting wrong canonicals.
 */
function localePath(locale: Locale, href: string): string {
  return `/${locale}${href === "/" ? "" : href}`;
}

/**
 * The Open Graph locale each supported locale advertises.
 *
 * @remarks
 * `og:locale` wants a territory, not a bare language: `es`, not `es_ES`, is
 * ignored by most consumers. Portuguese resolves to `pt_BR` rather than
 * `pt_PT` — the course content is written for a Latin American audience.
 */
const OPEN_GRAPH_LOCALES: Record<Locale, string> = {
  en: "en_US",
  es: "es_ES",
  pt: "pt_BR",
};

/**
 * Everything a route knows about itself that its metadata needs.
 *
 * @remarks
 * `href` is the route's path **without** a locale prefix (`/courses/basic-course`);
 * the locale set and the default locale come from the routing configuration, so
 * adding or removing a locale needs no per-page edit.
 *
 * There is no `siteUrl` field: the URLs here stay relative and Next absolutizes
 * them against the layout's `metadataBase`. Passing the origin down to every
 * route would give two places for it to be wrong.
 *
 * @category Metadata
 */
export type ShareMetadataInput = {
  /**
   * The locale this render is being served in, as the route params carry it.
   * Narrowed here rather than at four call sites, each of which would otherwise
   * need the same cast from `string`.
   */
  locale: string;
  /** Unprefixed path of the route, e.g. `/courses/basic-course`. */
  href: string;
  /** What this route is called — not what the site is called. */
  title: string;
  /** What this route is about — not what the site is about. */
  description: string;
  /** The brand, identical in every locale. */
  siteName: string;
  /** Localized alt text for this route's generated sharing image. */
  imageAlt: string;
  /** Present only for a video lesson; drives `og:type` and `og:video:duration`. */
  videoDurationSeconds?: number;
};

/**
 * Composes the metadata a single route publishes about itself.
 *
 * @remarks
 * One builder rather than four copies inside each `generateMetadata`. Head tags
 * render invisibly, so a page that quietly lost its `og:locale:alternate` would
 * go unnoticed for as long as nobody inspected it — centralising the shape means
 * there is exactly one implementation to test.
 *
 * `twitter:site` and `twitter:creator` are deliberately absent: there is no
 * account, and an empty handle carries no information.
 *
 * The image URL is the route's own `opengraph-image` convention path, declared
 * relative so `metadataBase` absolutizes it.
 *
 * @example
 * ```ts
 * return shareMetadata({
 *   locale,
 *   href: `/courses/${course.slug}`,
 *   title: course.title,
 *   description: t("courseDescription", { … }),
 *   siteName: t("siteName"),
 *   imageAlt: t("imageAlt", { title: course.title }),
 * });
 * ```
 *
 * @param input - The route's own copy, path and locale
 * @returns A Next `Metadata` object with canonical, alternates, Open Graph and Twitter composed
 * @throws If `locale` is not one of the application's supported locales
 * @category Metadata
 */
export function shareMetadata(input: ShareMetadataInput): Metadata {
  const { href, title, description, siteName, imageAlt, videoDurationSeconds } = input;

  // Middleware and the locale layout both reject unknown locales before a page
  // renders, so this is unreachable in practice — and throwing beats silently
  // publishing another locale's canonical if that ever stops being true.
  if (!hasLocale(routing.locales, input.locale)) {
    throw new Error(`shareMetadata received an unsupported locale: "${input.locale}"`);
  }
  const locale = input.locale;

  const pathFor = (target: Locale) => localePath(target, href);

  const languages = Object.fromEntries(
    routing.locales.map((supported) => [supported, pathFor(supported)]),
  );

  // Next accepts `duration` on its OpenGraph type but drops it from the
  // rendered head for `video.other` — verified in the browser. `other` is the
  // documented escape hatch for tags Next does not serialize itself.
  const isVideo = videoDurationSeconds !== undefined;
  const openGraphType = isVideo ? ("video.other" as const) : ("website" as const);
  const videoTags = isVideo ? { other: { "og:video:duration": String(videoDurationSeconds) } } : {};

  // Relative, so `metadataBase` in the locale layout absolutizes it and the
  // origin keeps one home. The path is the route's own `opengraph-image` file
  // convention, which sits directly under the route it illustrates.
  const images = [
    { url: `${pathFor(locale)}/opengraph-image`, width: 1200, height: 630, alt: imageAlt },
  ];

  return {
    title,
    description,
    alternates: {
      canonical: pathFor(locale),
      languages: { ...languages, "x-default": pathFor(routing.defaultLocale) },
    },
    openGraph: {
      title,
      description,
      siteName,
      url: pathFor(locale),
      locale: OPEN_GRAPH_LOCALES[locale],
      alternateLocale: routing.locales
        .filter((supported) => supported !== locale)
        .map((supported) => OPEN_GRAPH_LOCALES[supported]),
      type: openGraphType,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
    ...videoTags,
  };
}

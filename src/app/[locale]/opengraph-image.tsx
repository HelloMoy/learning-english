import { getCoursePlatformDeps } from "@/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies";
import { SHARE_CARD_SIZE, ShareCard } from "@/components/share-card/share-card";
import { shareCardFonts } from "@/lib/share-card-fonts/share-card-fonts";

import { getTranslations } from "next-intl/server";
import { ImageResponse } from "next/og";

export const alt = "English Course";
export const size = SHARE_CARD_SIZE;
export const contentType = "image/png";

/**
 * The home's sharing card: the catalog's own promise, over its real totals.
 *
 * @remarks
 * Resolves through the same use case the home page uses, so a course withheld
 * from the served catalog is absent from these totals too.
 */
export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const home = await getTranslations({ locale, namespace: "HomePage" });
  const catalog = await getCoursePlatformDeps().useCases.findCourseCatalog();
  const entries = catalog.isOk() ? catalog.value.entries : [];

  const lessonCount = entries.reduce((total, entry) => total + entry.course.lessonCount, 0);
  const moduleCount = entries.reduce((total, entry) => total + entry.course.moduleCount, 0);

  return new ImageResponse(
    <ShareCard
      kicker={home("eyebrow")}
      headline={home("heading")}
      supporting={t("homeDescription")}
      facts={[
        home("coursesCount", { count: entries.length }),
        t("moduleFact", { count: moduleCount }),
        t("lessonFact", { count: lessonCount }),
      ]}
    />,
    { ...size, fonts: await shareCardFonts() },
  );
}

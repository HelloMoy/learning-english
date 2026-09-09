import { getCoursePlatformDeps } from "@/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies";
import { SHARE_CARD_SIZE, ShareCard } from "@/components/share-card/share-card";
import { Slug } from "@/domain/entities/slug/slug";
import { shareCardFonts } from "@/lib/share-card-fonts/share-card-fonts";
import { shareHeadline } from "@/lib/share-headline/share-headline";

import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";

export const alt = "English Course";
export const size = SHARE_CARD_SIZE;
export const contentType = "image/png";

type Props = { params: Promise<{ locale: string; courseSlug: string }> };

/**
 * A course's sharing card.
 *
 * @remarks
 * The headline is the course's promise, not its catalog name — see
 * {@link shareHeadline}. `Basic Course` names a row; `American pronunciation
 * from the ground up` tells a reader what they would learn, and on X the card
 * is image-only, so that line is the whole message.
 *
 * Resolving through `findCourseForView` rather than reading the manifest is
 * what keeps a withheld course withheld here too: the use case already refuses
 * a draft course in production, and this route 404s with it instead of
 * rendering its title into an image.
 */
export default async function Image({ params }: Props) {
  const { locale, courseSlug } = await params;
  const slug = Slug.safeParse(courseSlug);
  if (!slug.success) notFound();

  const result = await getCoursePlatformDeps().useCases.findCourseForView({
    courseSlug: slug.data,
  });
  if (result.isErr()) notFound();

  const { course, modules } = result.value;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return new ImageResponse(
    <ShareCard
      kicker={t("levelFact", { level: course.sequence })}
      headline={shareHeadline(course.description)}
      supporting={course.title}
      facts={[
        t("moduleFact", { count: modules.length }),
        t("lessonFact", { count: course.lessonCount }),
      ]}
    />,
    { ...size, fonts: await shareCardFonts() },
  );
}

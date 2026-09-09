import { getCoursePlatformDeps } from "@/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies";
import { SHARE_CARD_SIZE, ShareCard } from "@/components/share-card/share-card";
import { Slug } from "@/domain/entities/slug/slug";
import { shareCardFonts } from "@/lib/share-card-fonts/share-card-fonts";

import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";

export const alt = "English Course";
export const size = SHARE_CARD_SIZE;
export const contentType = "image/png";

type Props = { params: Promise<{ locale: string; courseSlug: string; moduleSlug: string }> };

/**
 * A module's sharing card: the module's own title, over its place in the course.
 *
 * @remarks
 * Unlike a course, a module's title *is* the useful headline — `Contractions
 * and reductions` names what it teaches. The kicker carries the course it
 * belongs to, so a shared module never arrives context-free.
 */
export default async function Image({ params }: Props) {
  const { locale, courseSlug, moduleSlug } = await params;
  const course = Slug.safeParse(courseSlug);
  const courseModule = Slug.safeParse(moduleSlug);
  if (!course.success || !courseModule.success) notFound();

  const result = await getCoursePlatformDeps().useCases.findModuleForView({
    courseSlug: course.data,
    moduleSlug: courseModule.data,
  });
  if (result.isErr()) notFound();

  const view = result.value;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return new ImageResponse(
    <ShareCard
      kicker={view.course.title}
      headline={view.module.title}
      facts={[
        `${view.module.sequence} / ${view.course.moduleCount}`,
        t("lessonFact", { count: view.lessons.length }),
      ]}
    />,
    { ...size, fonts: await shareCardFonts() },
  );
}

import { getCoursePlatformDeps } from "@/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies";
import { SHARE_CARD_SIZE, ShareCard } from "@/components/share-card/share-card";
import { LessonId } from "@/domain/entities/ids/ids";
import { Slug } from "@/domain/entities/slug/slug";
import { formatMinutesSeconds } from "@/lib/format-minutes-seconds/format-minutes-seconds";
import { shareCardFonts } from "@/lib/share-card-fonts/share-card-fonts";

import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";

export const alt = "English Course";
export const size = SHARE_CARD_SIZE;
export const contentType = "image/png";

type Props = {
  params: Promise<{ locale: string; courseSlug: string; moduleSlug: string; lessonId: string }>;
};

/**
 * A lesson's sharing card: the lesson title, its place in the catalog, and —
 * for a Lecture — its runtime.
 *
 * @remarks
 * The runtime is the fact that decides whether someone presses play now or
 * later, so it earns the badge position. A reading lesson has none and simply
 * shows nothing there rather than a zero.
 */
export default async function Image({ params }: Props) {
  const { locale, courseSlug, moduleSlug, lessonId } = await params;
  const course = Slug.safeParse(courseSlug);
  const courseModule = Slug.safeParse(moduleSlug);
  const lesson = LessonId.safeParse(lessonId);
  if (!course.success || !courseModule.success || !lesson.success) notFound();

  const result = await getCoursePlatformDeps().useCases.findLessonForView({
    courseSlug: course.data,
    moduleSlug: courseModule.data,
    lessonId: lesson.data,
  });
  if (result.isErr()) notFound();

  const view = result.value;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return new ImageResponse(
    <ShareCard
      kicker={`${view.course.title} · ${view.module.title}`}
      headline={view.lesson.title}
      badge={t("lessonBadge", { sequence: view.lesson.sequence })}
      facts={
        view.lesson.kind === "video" ? [formatMinutesSeconds(view.lesson.durationSeconds)] : []
      }
    />,
    { ...size, fonts: await shareCardFonts() },
  );
}

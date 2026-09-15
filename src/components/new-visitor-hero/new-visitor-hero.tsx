import { Eyebrow } from "@/components/eyebrow/eyebrow";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

/**
 * The landing's hero: who the course is for, what it promises, and one way in.
 *
 * @remarks
 * The primary action arrives as a slot so the hero stays presentational; the
 * home passes `StartCourseLink`, which decides whether the learner goes through
 * the onboarding or straight to My learning. The note beside it names the first
 * course and its size, so the action never reads as a commitment to nothing.
 *
 * `aside` is where the page places the vowel-length card: beside the copy on a
 * wide screen, and after the action on a phone, where the grid stacks.
 *
 * @param firstCourseTitle - The course a learner starts with
 * @param firstCourseVideoCount - How many videos that course holds
 * @param action - The hero's one primary action
 * @param aside - Content placed in the hero's second column
 */
export function NewVisitorHero({
  firstCourseTitle,
  firstCourseVideoCount,
  action,
  aside,
}: {
  firstCourseTitle: string;
  firstCourseVideoCount: number;
  action: ReactNode;
  aside: ReactNode;
}) {
  const t = useTranslations("HomePage.newVisitor");

  return (
    <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="flex flex-col gap-6 lg:col-span-7">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="font-sans text-[2.625rem] leading-[1.02] font-extrabold tracking-tight text-balance text-foreground sm:text-6xl lg:text-7xl">
          {t("heading")}
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t("intro")}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          {action}
          <span className="text-center text-sm text-muted-foreground sm:text-left">
            {t("primaryActionNote", { videos: firstCourseVideoCount, course: firstCourseTitle })}
          </span>
        </div>
      </div>
      <div className="lg:col-span-5">{aside}</div>
    </section>
  );
}

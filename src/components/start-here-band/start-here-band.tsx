import { Eyebrow } from "@/components/eyebrow/eyebrow";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

/**
 * The landing's closing band: the offer restated once more, and the hero's
 * primary action repeated.
 *
 * @remarks
 * It repeats the action rather than adding a new one, so a visitor who has
 * scrolled past the questions and the levels still has one obvious next step.
 * The home passes the same `StartCourseLink` the hero carries, so both always
 * lead to the same place. The band inverts the page's surface in the light
 * theme and glows in the dark theme, so it separates from the ground in both.
 *
 * @param firstLessonMinutes - The first lesson's runtime in whole minutes, or `null` when it has none
 * @param action - The primary action, as in the hero
 */
export function StartHereBand({
  firstLessonMinutes,
  action,
}: {
  firstLessonMinutes: number | null;
  action: ReactNode;
}) {
  const t = useTranslations("HomePage.newVisitor");

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-foreground px-5 py-8 text-background sm:items-center sm:gap-6 sm:px-12 sm:py-20 sm:text-center dark:border dark:border-primary/55 dark:bg-[radial-gradient(70%_160%_at_50%_0%,color-mix(in_oklab,var(--glow)_22%,var(--card)),var(--card)_70%)] dark:text-foreground">
      <Eyebrow className="text-primary">{t("bandEyebrow")}</Eyebrow>
      <h2 className="max-w-3xl font-sans text-[1.75rem] leading-[1.08] font-extrabold tracking-tight text-balance sm:text-5xl">
        {firstLessonMinutes === null
          ? t("bandHeadingNoDuration")
          : t("bandHeading", { minutes: firstLessonMinutes })}
      </h2>
      {action}
    </section>
  );
}

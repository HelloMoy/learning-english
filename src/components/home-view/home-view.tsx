import { CinemaHero } from "@/components/cinema-hero/cinema-hero";
import { ContinueWatching } from "@/components/continue-watching/continue-watching";
import { CourseLadder, type CourseLevel } from "@/components/course-ladder/course-ladder";
import { Eyebrow } from "@/components/eyebrow/eyebrow";
import { GoldBadge } from "@/components/gold-badge/gold-badge";

import { useTranslations } from "next-intl";

/**
 * The locale home: a hero, what the learner was last watching, and the whole
 * catalog as an ordered ladder of levels.
 *
 * @remarks
 * The home this replaces rendered `entries[0]` as a hero beside a featured
 * rail and dropped every other catalog entry on the floor. That was invisible
 * while the catalog held one course and became a lie the moment it held two.
 * Every course now gets the same card, and the section says so in words.
 *
 * The hero carries no call to action on purpose. The page's one primary
 * action is `Resume` in the continue-watching panel, and each course card
 * carries its own; a third button competing from the hero would leave a
 * learner with no obvious next step.
 *
 * Presentational — the page resolves the catalog and passes the levels in.
 */
export function HomeView({ levels }: { levels: ReadonlyArray<CourseLevel> }) {
  const t = useTranslations("HomePage");

  return (
    <>
      <CinemaHero
        eyebrow={t("eyebrow")}
        title={t("heading")}
        subtitle={t("intro")}
      />

      <ContinueWatching />

      {levels.length > 0 ? (
        <section className="flex flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-3">
              <Eyebrow>{t("coursesEyebrow")}</Eyebrow>
              <h2 className="font-sans text-3xl font-extrabold tracking-tight text-foreground">
                {t("coursesHeading", { count: levels.length })}
              </h2>
            </div>
            <GoldBadge variant="neutral">{t("coursesCount", { count: levels.length })}</GoldBadge>
          </div>

          <CourseLadder levels={levels} />
        </section>
      ) : (
        <p
          className="text-sm text-muted-foreground"
          role="status"
        >
          {t("catalogEmpty")}
        </p>
      )}
    </>
  );
}

import { PrizeShelfItem } from "@/components/prize-shelf-item/prize-shelf-item";
import type { CourseAchievements } from "@/lib/learner-achievements/learner-achievements";

import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";

/**
 * The prize counter: one shelf per course holding every module's prize, like
 * the counter where arcade tickets are redeemed.
 *
 * @remarks
 * Each shelf is a labelled region named by its course, with a line saying how
 * many of its prizes the learner has claimed, and the prizes in module order.
 * Shelves rise one after another, starting at `motionOrderStart` so they follow
 * whatever rose before them on the page.
 *
 * @example
 * ```tsx
 * <PrizeCounter courses={achievements.courses} onClaim={claim} />
 * ```
 *
 * @param courses - Each course's module prizes, in catalog order
 * @param onClaim - Called with the module slug when a prize is claimed
 * @param calledModuleSlug - The module whose prize the learner came for, to point it out
 * @param motionOrderStart - The first shelf's place in the page's entrance sequence
 */
export function PrizeCounter({
  courses,
  onClaim,
  calledModuleSlug,
  motionOrderStart = 2,
}: {
  courses: ReadonlyArray<CourseAchievements>;
  onClaim?: (moduleSlug: string) => void;
  calledModuleSlug?: string;
  motionOrderStart?: number;
}) {
  const t = useTranslations("Components.PrizeCounter");

  return (
    <div className="flex flex-col gap-12">
      {courses.map(({ course, modules }, index) => (
        <section
          key={course.id}
          aria-labelledby={`prize-shelf-${course.id}`}
          style={{ "--motion-order": motionOrderStart + index } as CSSProperties}
          className="achievement-rise flex flex-col gap-2"
        >
          <div className="flex items-baseline justify-between gap-4">
            <h2
              id={`prize-shelf-${course.id}`}
              className="text-xl font-extrabold tracking-tight text-foreground"
            >
              {course.title}
            </h2>
            <p className="text-[13px] text-muted-foreground tabular-nums">
              {t("shelfNote", {
                redeemed: modules.filter((module) => module.prizeState === "claimed").length,
                count: modules.length,
              })}
            </p>
          </div>
          <div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-7 rounded-t-2xl border border-b-0 border-foreground/[0.07] bg-gradient-to-b from-foreground/[0.04] to-foreground/[0.01] px-4 pt-5 pb-5 sm:grid-cols-3 lg:grid-cols-5">
              {modules.map((moduleAchievements) => (
                <PrizeShelfItem
                  key={moduleAchievements.module.id}
                  prize={moduleAchievements.prize}
                  moduleTitle={moduleAchievements.module.title}
                  moduleSlug={moduleAchievements.module.slug}
                  state={moduleAchievements.prizeState}
                  ticketsEarned={moduleAchievements.ticketsEarned}
                  ticketCount={moduleAchievements.tickets.length}
                  onClaim={onClaim}
                  isCalled={moduleAchievements.module.slug === calledModuleSlug}
                />
              ))}
            </ul>
            <div
              aria-hidden="true"
              className="h-3.5 rounded-b-md bg-gradient-to-b from-[#3a2c16] to-[#1f170b] shadow-[0_16px_30px_-12px_rgba(0,0,0,0.9)]"
            />
          </div>
        </section>
      ))}
    </div>
  );
}

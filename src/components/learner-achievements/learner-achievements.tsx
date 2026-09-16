"use client";

import { PrizeCounter } from "@/components/prize-counter/prize-counter";
import { useCountUp } from "@/hooks/use-count-up/use-count-up";
import type { LearnerAchievements as LearnerAchievementsValue } from "@/lib/learner-achievements/learner-achievements";

import { useTranslations } from "next-intl";
import type { CSSProperties, ReactNode } from "react";

/** The blocks before the prize counter: the ticket count, then the prize count. */
const COUNT_BLOCKS = 2;

/**
 * The learner's collection: how many tickets and prizes they hold across the
 * catalog, then the prize counter with every module's prize.
 *
 * @remarks
 * The counts climb to their values and rise first; the counter's shelves follow
 * them in the same entrance sequence. The climbing digits are hidden from
 * assistive technology beside the final sentence, and every entrance ends on
 * the block's resting look.
 *
 * @example
 * ```tsx
 * <LearnerAchievements achievements={useLearnerAchievements(levels)} />
 * ```
 *
 * @param achievements - The derived achievements, from `useLearnerAchievements`
 * @param onClaim - Called with the module slug when a prize is claimed on a shelf
 * @param calledModuleSlug - The module whose prize the learner came for, to point it out
 */
export function LearnerAchievements({
  achievements,
  onClaim,
  calledModuleSlug,
}: {
  achievements: LearnerAchievementsValue;
  onClaim?: (moduleSlug: string) => void;
  calledModuleSlug?: string;
}) {
  return (
    <div className="flex flex-col gap-14">
      <div className="grid grid-cols-2 gap-4">
        <AchievementCount
          testId="achievements-ticket-count"
          message="ticketCount"
          earned={achievements.ticketsEarned}
          count={achievements.ticketCount}
          order={0}
        />
        <AchievementCount
          testId="achievements-prize-count"
          message="prizeCount"
          earned={achievements.prizesRedeemed}
          count={achievements.prizeCount}
          order={1}
        />
      </div>
      <PrizeCounter
        courses={achievements.courses}
        onClaim={onClaim}
        calledModuleSlug={calledModuleSlug}
        motionOrderStart={COUNT_BLOCKS}
      />
    </div>
  );
}

/** One count: climbing digits for the eye, the final sentence for assistive technology. */
function AchievementCount({
  testId,
  message,
  earned,
  count,
  order,
}: {
  testId: string;
  message: "ticketCount" | "prizeCount";
  earned: number;
  count: number;
  order: number;
}) {
  const t = useTranslations("Components.LearnerAchievements");
  const shown = useCountUp(earned);
  const bigNumber = (chunks: ReactNode) => (
    <span className="block text-[2.125rem] leading-none font-extrabold tracking-tight text-foreground tabular-nums">
      {chunks}
    </span>
  );

  return (
    <p
      data-testid={testId}
      style={{ "--motion-order": order } as CSSProperties}
      className="achievement-rise rounded-[0.875rem] border border-border bg-card px-5 py-[1.125rem] text-[13px] text-muted-foreground"
    >
      <span
        aria-hidden="true"
        className="flex flex-col gap-1"
      >
        {t.rich(message, { earned: shown, count, number: bigNumber })}
      </span>
      <span className="sr-only">
        {t.markup(message, { earned, count, number: (chunks) => chunks })}
      </span>
    </p>
  );
}

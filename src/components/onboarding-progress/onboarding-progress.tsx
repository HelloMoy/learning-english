import { cn } from "@/lib/utils/utils";

import { useTranslations } from "next-intl";

/** The onboarding's steps: the name, then the avatar. */
export type OnboardingStep = 1 | 2;

const STEPS: ReadonlyArray<OnboardingStep> = [1, 2];

/**
 * Where the learner is in the onboarding, in words and as a segmented bar.
 *
 * @remarks
 * The words carry the meaning; the segments repeat it visually and are hidden
 * from assistive technology so the position is announced once.
 *
 * @param step - The step being shown
 */
export function OnboardingProgress({ step }: { step: OnboardingStep }) {
  const t = useTranslations("Onboarding");

  return (
    <div className="flex items-center gap-2.5">
      <p className="text-xs text-muted-foreground">
        {t("stepLabel", { step, total: STEPS.length })}
      </p>
      <div
        aria-hidden="true"
        className="flex gap-1.5"
      >
        {STEPS.map((segment) => {
          const isReached = segment <= step;
          return (
            <span
              key={segment}
              data-testid="onboarding-segment"
              data-state={isReached ? "reached" : "ahead"}
              className={cn("h-1 w-7 rounded-full sm:w-12", isReached ? "bg-primary" : "bg-border")}
            />
          );
        })}
      </div>
    </div>
  );
}

import { Eyebrow } from "@/components/eyebrow/eyebrow";
import type { ModuleRouteReading } from "@/hooks/use-module-route/use-module-route";
import { splitRuntime, type ModuleRoute } from "@/lib/module-route/module-route";

import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";

const RING_SIZE = 84;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Props for {@link ModuleProgressPanel}. */
export type ModuleProgressPanelProps = {
  /** The learner's route through the module, or the fact it is not read yet. */
  reading: ModuleRouteReading;
  /** What the panel carries below its figures — the module's prize row. */
  children?: ReactNode;
};

/**
 * The module's progress at a glance: a ring with the percentage finished, the
 * count of finished videos, and the watch time left.
 *
 * @remarks
 * A finished module says so in words instead of leaving two equal numbers to
 * compare, and states no time left.
 *
 * Before progress is read the panel keeps its heading and an empty ring but
 * shows no figures: the first frame must not assert a progress that may be
 * false, and keeping the shape avoids a jump when figures arrive.
 *
 * The ring is decorative; the percentage is real text beside it.
 *
 * Below the figures the panel carries whatever it is handed — on the module
 * overview, the module's prize row.
 *
 * @example
 * ```tsx
 * <ModuleProgressPanel reading={useModuleRoute(lessons)} />
 * ```
 *
 * @param props - {@link ModuleProgressPanelProps}
 */
export function ModuleProgressPanel({ reading, children }: ModuleProgressPanelProps) {
  const t = useTranslations("CourseCatalog.moduleOverview");
  const fraction = reading.isRead ? finishedFraction(reading.route) : 0;

  return (
    <section
      aria-label={t("progressHeading")}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card/85 p-4 lg:gap-5 lg:p-6"
    >
      <div className="flex items-center gap-4">
        <div className="relative size-15 shrink-0 lg:size-21">
          <ProgressRing fraction={fraction} />
          {reading.isRead ? <PercentLabel fraction={fraction} /> : null}
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <Eyebrow
            as="h2"
            className="text-[10px] tracking-[0.28em]"
          >
            {t("progressHeading")}
          </Eyebrow>
          {reading.isRead ? <ProgressFigures route={reading.route} /> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function finishedFraction({ finishedCount, lessonCount }: ModuleRoute): number {
  return lessonCount > 0 ? finishedCount / lessonCount : 0;
}

function isModuleFinished({ finishedCount, lessonCount }: ModuleRoute): boolean {
  return lessonCount > 0 && finishedCount === lessonCount;
}

function ProgressRing({ fraction }: { fraction: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      className="size-full -rotate-90"
    >
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        strokeWidth={RING_STROKE}
        className="stroke-foreground/12"
      />
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        strokeWidth={RING_STROKE}
        strokeLinecap="round"
        strokeDasharray={`${fraction * RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
        className="stroke-gold transition-[stroke-dasharray] duration-500 motion-reduce:transition-none"
      />
    </svg>
  );
}

function PercentLabel({ fraction }: { fraction: number }) {
  const format = useFormatter();
  return (
    <span className="absolute inset-0 flex items-center justify-center font-mono text-[13px] font-semibold tabular-nums lg:text-base">
      {format.number(fraction, { style: "percent" })}
    </span>
  );
}

function ProgressFigures({ route }: { route: ModuleRoute }) {
  const t = useTranslations("CourseCatalog.moduleOverview");

  if (isModuleFinished(route)) {
    return (
      <p className="text-[17px] font-bold text-foreground lg:text-xl">{t("moduleCompleted")}</p>
    );
  }

  return (
    <>
      <p className="text-[17px] font-bold text-foreground lg:text-xl">
        {t("videosFinished", { finished: route.finishedCount, total: route.lessonCount })}
      </p>
      <p className="text-[13px] text-muted-foreground">
        {t("timeLeft", { runtime: t("runtime", splitRuntime(route.secondsLeft)) })}
      </p>
    </>
  );
}

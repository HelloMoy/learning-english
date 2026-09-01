import { Eyebrow } from "@/components/eyebrow/eyebrow";
import { GoldBadge } from "@/components/gold-badge/gold-badge";
import type { Course } from "@/domain/entities/course/course";
import type { Module } from "@/domain/entities/module/module";
import { courseOverviewPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/utils";

import { Play } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Whether the learner has started this course. Derived from the
 * continue-watching record rather than from aggregate progress: the record
 * names one lesson, and the course that lesson belongs to is the one in
 * progress.
 */
export type CourseLevelState = "in-progress" | "not-started";

/** The panel's own atmosphere, matching `ModuleShowcaseCard`'s glow. */
const IN_PROGRESS_GLOW =
  "radial-gradient(90% 160% at 4% 0%, color-mix(in oklab, var(--glow) 34%, var(--background)), var(--background) 68%)";

/**
 * One course on the home's ladder of levels.
 *
 * @remarks
 * Every course gets the same card, whatever its size — that equality is the
 * point. The home this replaces gave `entries[0]` a whole column and rendered
 * nothing for the rest, which stated something false as soon as a second
 * course existed.
 *
 * The card previews the course's leading modules as text with their ordinals,
 * and states how many it leaves out. Listing three of ten without the
 * remainder would quietly claim the course is three lessons long, and
 * ordinals rendered outside the title survive its truncation
 * (`course-vocabulary` § "Content ordering is stated, not implied").
 *
 * Like `ModuleShowcaseCard`, the card is a plain container with two links to
 * the same destination — the heading and the call to action — rather than one
 * wrapping link, so its accessible name stays the course title instead of
 * swallowing the description, the module list and every badge.
 */
export function CourseLevelCard({
  course,
  leadingModules,
  state,
}: {
  course: Course;
  leadingModules: ReadonlyArray<Module>;
  state: CourseLevelState;
}) {
  const t = useTranslations("Components.CourseLevelCard");
  const tCounts = useTranslations("CourseCatalog.card");
  const href = courseOverviewPath(course);
  const inProgress = state === "in-progress";
  const remainingModules = course.moduleCount - leadingModules.length;

  return (
    <div
      data-testid="course-level-card"
      data-state={state}
      className={cn(
        "flex h-full flex-col gap-5 rounded-2xl border p-7",
        inProgress
          ? "border-gold/55"
          : "border-border bg-[linear-gradient(180deg,var(--panel-2),var(--card))]",
      )}
      style={inProgress ? { background: IN_PROGRESS_GLOW } : undefined}
    >
      <div className="flex items-center justify-between gap-3">
        <Eyebrow data-testid="course-level-ordinal">
          {t("levelOrdinal", { number: course.sequence })}
        </Eyebrow>
        <GoldBadge
          data-testid="course-level-state"
          variant={inProgress ? "gold" : "neutral"}
        >
          {inProgress ? t("inProgress") : t("notStarted")}
        </GoldBadge>
      </div>

      <h3 className="font-sans text-2xl leading-tight font-extrabold tracking-tight text-foreground">
        <Link
          href={href as never}
          className="rounded-sm hover:text-gold focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {course.title}
        </Link>
      </h3>

      <p className="text-sm leading-relaxed text-muted-foreground">{course.description}</p>

      {leadingModules.length > 0 ? (
        <div className="flex flex-col">
          <ol
            data-testid="course-level-modules"
            aria-label={t("moduleListLabel")}
            className="flex flex-col"
          >
            {leadingModules.map((module) => (
              <li
                key={module.id}
                className="flex items-center gap-3 border-t border-border py-2.5"
              >
                {/*
                  `min-w-16` rather than a fixed width: the ordinals line up
                  in a column, and a longer translation grows its cell
                  instead of wrapping. `Lección 1` overflowed a 48px column
                  and broke onto two lines.
                */}
                <span className="min-w-16 shrink-0 text-[11px] font-bold whitespace-nowrap text-gold tabular-nums">
                  {t("moduleOrdinal", { number: module.sequence })}
                </span>
                <span className="min-w-0 truncate text-sm text-foreground">{module.title}</span>
              </li>
            ))}
          </ol>
          {remainingModules > 0 ? (
            <p
              data-testid="course-level-more"
              className="border-t border-border py-2.5 text-xs font-semibold text-gold tabular-nums"
            >
              {t("moreModules", { count: remainingModules })}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <GoldBadge variant="neutral">
          {tCounts("moduleCount", { count: course.moduleCount })}
        </GoldBadge>
        <GoldBadge variant="neutral">
          {tCounts("lessonCount", { count: course.lessonCount })}
        </GoldBadge>
      </div>

      <Link
        href={href as never}
        data-testid="course-level-cta"
        className={cn(
          "mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-6 text-sm font-bold tracking-wide transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          inProgress
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "border border-border bg-foreground/5 text-foreground hover:bg-foreground/10",
        )}
      >
        {inProgress ? (
          <Play
            className="size-4"
            fill="currentColor"
          />
        ) : null}
        {inProgress ? t("continueCourse") : t("startCourse")}
      </Link>
    </div>
  );
}

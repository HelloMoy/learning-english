import { Eyebrow } from "@/components/eyebrow/eyebrow";
import { GoldBadge } from "@/components/gold-badge/gold-badge";
import { Skeleton } from "@/components/ui/skeleton/skeleton";
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
 *
 * `resolving` is the honest third answer, not a loading flag bolted on. Storage
 * answers "a record exists" in the same tick; which course it belongs to takes
 * a server round-trip. Between the two the card knows that one of the ladder's
 * cards is in progress and not which, so it asserts neither state rather than
 * claiming `not-started` and correcting itself under the learner's thumb.
 */
export type CourseLevelState = "in-progress" | "not-started" | "resolving";

/**
 * Extends a link's pointer target to its positioned ancestor without adding a
 * control: the box is the link's own `::after`, so the DOM, the accessibility
 * tree and the tab order are untouched. Anything that must stay clickable
 * through it needs `relative z-20` — see {@link ACTIONS_ABOVE_HIT_AREA}.
 */
const STRETCHED_HIT_AREA = "after:absolute after:inset-0 after:z-10 after:content-['']";

/** The exception to the card-wide hit area: the actions keep their own hrefs. */
const ACTIONS_ABOVE_HIT_AREA = "relative z-20";

/** Shared shape of both foot actions; only their weight differs. */
const ACTION =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-6 text-sm font-bold tracking-wide transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";
const PRIMARY_ACTION = "bg-primary text-primary-foreground hover:bg-primary/90";
const QUIET_ACTION = "border border-border bg-foreground/5 text-foreground hover:bg-foreground/10";

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
 * Like `ModuleShowcaseCard`, the card is a plain container with links to the
 * course inside it rather than one wrapping link, so its accessible name stays
 * the course title instead of swallowing the description, the module list and
 * every badge.
 *
 * ## Where a click lands
 *
 * The card body is a pointer target for the course overview, because the card
 * looks like one object and a click on its description should do what a click
 * on its title does. That target is the heading link's own stretched
 * `::after` — no wrapping link, no extra control, no extra tab stop.
 *
 * The actions at the foot are the exception: they have their own destinations,
 * so they sit above the overlay. Any interactive element added to this card
 * later must do the same or it will be unreachable by pointer.
 *
 * ## The two actions
 *
 * A course being continued leads with the lesson the learner left off at — the
 * same destination as the home's `Continue watching` panel — and offers the
 * course overview beneath it. A card that said `Continue course` and landed on
 * the overview contradicted that panel two inches above it.
 *
 * The course's state is read off `resumeHref` rather than passed alongside it.
 * Both carry the same fact, and a separate flag would allow a card that
 * promises to continue something it has no address for.
 *
 * @param resumeHref - Locale-relative path of the lesson to resume, or `null`
 *                     when this is not the course being continued
 */
export function CourseLevelCard({
  course,
  leadingModules,
  resumeHref,
  isResolving = false,
}: {
  course: Course;
  leadingModules: ReadonlyArray<Module>;
  resumeHref: string | null;
  isResolving?: boolean;
}) {
  const t = useTranslations("Components.CourseLevelCard");
  const tCounts = useTranslations("CourseCatalog.card");
  const href = courseOverviewPath(course);
  const inProgress = resumeHref !== null;
  const state: CourseLevelState = isResolving
    ? "resolving"
    : inProgress
      ? "in-progress"
      : "not-started";
  const remainingModules = course.moduleCount - leadingModules.length;

  return (
    <div
      data-testid="course-level-card"
      data-state={state}
      className={cn(
        "relative flex h-full flex-col gap-5 rounded-2xl border p-7",
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
        {isResolving ? (
          <Skeleton
            data-testid="course-level-state-skeleton"
            className="h-6 w-24 rounded-full"
          />
        ) : (
          <GoldBadge
            data-testid="course-level-state"
            variant={inProgress ? "gold" : "neutral"}
          >
            {inProgress ? t("inProgress") : t("notStarted")}
          </GoldBadge>
        )}
      </div>

      <h3 className="font-sans text-2xl leading-tight font-extrabold tracking-tight text-foreground">
        <Link
          href={href as never}
          className={cn(
            "rounded-sm hover:text-gold focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            STRETCHED_HIT_AREA,
          )}
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

      <div className={cn("mt-auto flex flex-col gap-2", ACTIONS_ABOVE_HIT_AREA)}>
        {isResolving ? (
          // One bar, not two. The secondary action belongs to the in-progress
          // state alone, and reserving for it would promise a card shape that
          // three of four cards will never take.
          <Skeleton
            data-testid="course-level-cta-skeleton"
            className="h-11 w-full rounded-lg"
          />
        ) : (
          <>
            <Link
              href={(resumeHref ?? href) as never}
              data-testid="course-level-cta"
              className={cn(ACTION, inProgress ? PRIMARY_ACTION : QUIET_ACTION)}
            >
              {inProgress ? (
                <Play
                  className="size-4"
                  fill="currentColor"
                />
              ) : null}
              {inProgress ? t("continueCourse") : t("startCourse")}
            </Link>

            {inProgress ? (
              <Link
                href={href as never}
                data-testid="course-level-secondary-cta"
                className={cn(ACTION, QUIET_ACTION)}
              >
                {t("viewCourseContent")}
              </Link>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

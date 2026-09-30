"use client";

import { CourseEnrollAction } from "@/components/course-enroll-action/course-enroll-action";
import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useEnrolledCourses } from "@/hooks/use-enrolled-courses/use-enrolled-courses";
import { useRuntimeLabel } from "@/hooks/use-runtime-label/use-runtime-label";
import { courseFacts, coursePrizes } from "@/lib/course-shelf/course-shelf";
import { studyPace } from "@/lib/study-pace/study-pace";

import { CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

/** The daily study times the pace picker offers, in minutes. */
const PACE_OPTIONS = [10, 20, 30, 45] as const;
const DEFAULT_PACE = 20;

/** Props for {@link CourseEnrollCard}. */
export type CourseEnrollCardProps = {
  /** The course to enroll in. */
  view: CourseForView;
};

/**
 * The course page's enroll card: the action, how big the course is, and how
 * long it takes at the learner's pace.
 *
 * @remarks
 * The card invites the learner to join until they enroll, then says they are
 * enrolled; the action itself is {@link CourseEnrollAction}. The pace picker
 * offers 10, 20, 30 and 45 minutes a day, starts on 20, and turns the course's
 * runtime into weeks with `studyPace`. The choice is local to the page: it is
 * an estimate, not a setting.
 *
 * @example
 * ```tsx
 * <CourseEnrollCard view={courseView} />
 * ```
 */
export function CourseEnrollCard({ view }: CourseEnrollCardProps) {
  const t = useTranslations("Components.CourseEnrollCard");
  const isEnrolled = useEnrolledCourses().has(view.course.slug);
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-4 rounded-[22px] border border-border bg-card p-5"
    >
      <div className="flex flex-col gap-1.5">
        <h2
          id={titleId}
          className="flex items-center gap-2 text-lg leading-tight font-black tracking-[-0.02em] text-foreground"
        >
          {isEnrolled ? (
            <CircleCheck
              aria-hidden="true"
              className="size-5 text-gold"
            />
          ) : null}
          {t(isEnrolled ? "enrolledTitle" : "joinTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(isEnrolled ? "enrolledBody" : "joinBody")}
        </p>
      </div>
      <CourseEnrollAction
        view={view}
        className="w-full"
      />
      <CourseStats view={view} />
      <PacePicker runtimeSeconds={courseFacts(view).runtimeSeconds} />
    </section>
  );
}

function CourseStats({ view }: { view: CourseForView }) {
  const t = useTranslations("Components.CourseEnrollCard");
  const runtimeLabel = useRuntimeLabel();
  const facts = courseFacts(view);
  const prizeCount = coursePrizes(view, new Set()).length;
  const stats = [
    { value: String(facts.videoCount), label: t("videos", { count: facts.videoCount }) },
    { value: runtimeLabel(facts.runtimeSeconds), label: t("runtime") },
    { value: String(facts.moduleCount), label: t("lessons", { count: facts.moduleCount }) },
    { value: String(prizeCount), label: t("prizes", { count: prizeCount }) },
  ];

  return (
    <ul
      aria-label={t("statsLabel")}
      className="grid grid-cols-2 gap-3 border-t border-border pt-4"
    >
      {stats.map((stat) => (
        <li
          key={stat.label}
          className="flex flex-col"
        >
          <span className="text-xl font-black tracking-[-0.03em] text-foreground tabular-nums">
            {stat.value}
          </span>
          <span className="text-xs text-muted-foreground">{stat.label}</span>
        </li>
      ))}
    </ul>
  );
}

function PacePicker({ runtimeSeconds }: { runtimeSeconds: number }) {
  const t = useTranslations("Components.CourseEnrollCard");
  const [minutesPerDay, setMinutesPerDay] = useState<number>(DEFAULT_PACE);
  const groupName = useId();
  const { weeks } = studyPace(runtimeSeconds, minutesPerDay);

  return (
    <fieldset className="flex flex-col gap-2.5 border-t border-border pt-4">
      <legend className="float-left mb-2.5 text-xs font-bold tracking-[0.32em] text-gold uppercase">
        {t("paceLabel")}
      </legend>
      <div className="clear-left grid grid-cols-4 overflow-hidden rounded-[10px] border border-border">
        {PACE_OPTIONS.map((option) => (
          <label
            key={option}
            className="cursor-pointer py-1.5 text-center text-[0.8125rem] font-semibold text-muted-foreground transition-colors not-first:border-l not-first:border-border has-checked:bg-secondary has-checked:text-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
          >
            <input
              type="radio"
              name={groupName}
              value={option}
              checked={minutesPerDay === option}
              onChange={() => setMinutesPerDay(option)}
              className="sr-only"
            />
            {t("paceOption", { minutes: option })}
          </label>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {t("paceLine", { minutes: minutesPerDay, weeks })}
      </p>
    </fieldset>
  );
}

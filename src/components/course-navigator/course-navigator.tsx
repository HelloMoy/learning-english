"use client";

import type { CourseId, LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { FindNextLesson } from "@/domain/use-cases/find-next-lesson/find-next-lesson";
import { Link } from "@/i18n/navigation";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

/**
 * Resolved value of the `ResultAsync` returned by `FindNextLesson`. After
 * `findNextLesson(...).then((r) => ...)`, `r` is a sync `Result`.
 */
type Resolved = Awaited<ReturnType<FindNextLesson>>;

type Status =
  | { kind: "loading" }
  | { kind: "next"; lesson: Lesson }
  | { kind: "completed" }
  | { kind: "error"; reason: string };

/**
 * Driving adapter: React component that calls the `findNextLessonToRecommend`
 * use case and renders the recommendation.
 *
 * The use case is passed in as a prop — tests inject a stub, Storybook wires
 * the in-memory adapters, and (later) a Next.js page wires its real
 * adapters. The component never imports a domain port directly; ports are
 * resolved by the calling site, preserving the hexágono.
 */
export function CourseNavigator({
  courseId,
  currentLessonId,
  findNextLesson,
  getLessonHref,
}: {
  courseId: CourseId;
  currentLessonId: LessonId;
  findNextLesson: FindNextLesson;
  /**
   * Optional locale-aware path the "next lesson" link points to. The
   * calling site (Storybook, Next.js page) supplies the real route once
   * course routes are wired; defaults to `"#"` until then. Must return a
   * path that the locale-aware `<Link>` can resolve.
   */
  getLessonHref?: (input: { courseId: CourseId; lessonId: LessonId }) => string;
}) {
  const t = useTranslations("Components.CourseNavigator");
  const [result, setResult] = useState<Resolved | null>(null);

  useEffect(() => {
    let cancelled = false;
    findNextLesson({ courseId, currentLessonId }).then((r) => {
      if (!cancelled) setResult(r);
    });
    return () => {
      cancelled = true;
    };
  }, [courseId, currentLessonId, findNextLesson]);

  const status: Status =
    result === null
      ? { kind: "loading" }
      : result.isOk()
        ? result.value === null
          ? { kind: "completed" }
          : { kind: "next", lesson: result.value }
        : { kind: "error", reason: result.error.kind };

  if (status.kind === "loading") {
    return <p>{t("loading")}</p>;
  }

  if (status.kind === "next") {
    const href = getLessonHref ? getLessonHref({ courseId, lessonId: status.lesson.id }) : "#";
    return (
      <Link
        href={href}
        className="text-sm text-blue-700 underline hover:no-underline dark:text-blue-300"
      >
        {t("nextLesson", { title: status.lesson.title })}
      </Link>
    );
  }

  if (status.kind === "completed") {
    return <p>{t("courseCompleted")}</p>;
  }

  return (
    <p
      role="alert"
      className="text-sm text-red-700 dark:text-red-300"
    >
      {t("error")}
    </p>
  );
}

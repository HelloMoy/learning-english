import type { Course } from "@/domain/entities/course/course";
import type { LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";

import { useTranslations } from "next-intl";

import { ModuleList } from "../module-list/module-list";

/**
 * The Course outline sidebar. Renders the course's modules and lessons in
 * `sequence` order with the current lesson indicated. The component itself
 * does not own the responsive shell — the page chooses where the outline
 * sits (sidebar on desktop, drawer on mobile).
 */
export function Outline({
  course,
  modules,
  lessonsByModuleId,
  currentLessonId,
}: {
  course: Course;
  modules: Module[];
  lessonsByModuleId: Map<string, Lesson[]>;
  currentLessonId: LessonId;
}) {
  const t = useTranslations("Components.Outline");
  return (
    <nav
      aria-label={t("title")}
      className="text-sm"
    >
      <h2 className="mb-3 text-xs font-bold tracking-[0.24em] text-gold uppercase">{t("title")}</h2>
      <ModuleList
        course={course}
        modules={modules}
        lessonsByModuleId={lessonsByModuleId}
        currentLessonId={currentLessonId}
      />
    </nav>
  );
}

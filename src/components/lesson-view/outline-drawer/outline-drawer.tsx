import type { Course } from "@/domain/entities/course/course";
import type { LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";

import { useTranslations } from "next-intl";

import { Outline } from "../outline/outline";

/**
 * Responsive shell around the `Outline`. On screens `>= lg` it renders as a
 * permanent sidebar (the design's desktop layout). On smaller screens it
 * renders as a native `<details>` element — collapsed by default, expanded
 * with a tap — satisfying design.md §D9 "Collapsible drawer on mobile"
 * without adding a Sheet/Dialog primitive.
 *
 * The Outline is rendered twice (once per breakpoint) so each branch owns
 * its own DOM subtree; the cost is negligible because the Outline is a
 * static tree of links and headings.
 */
export function OutlineDrawer({
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
    <>
      {/* Mobile: collapsible accordion. Native <details> gives keyboard
          support and a11y semantics for free. */}
      <details className="rounded-xl border border-border bg-card p-3 lg:hidden">
        <summary className="cursor-pointer text-xs font-bold tracking-[0.24em] text-gold uppercase">
          {t("title")}
        </summary>
        <div className="mt-2">
          <Outline
            course={course}
            modules={modules}
            lessonsByModuleId={lessonsByModuleId}
            currentLessonId={currentLessonId}
          />
        </div>
      </details>

      {/* Desktop: permanent sidebar. */}
      <aside className="hidden rounded-2xl border border-border bg-card p-5 lg:block">
        <Outline
          course={course}
          modules={modules}
          lessonsByModuleId={lessonsByModuleId}
          currentLessonId={currentLessonId}
        />
      </aside>
    </>
  );
}

import type { Course } from "@/domain/entities/course/course";
import type { LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";

import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";

import { ModuleList } from "../module-list/module-list";

/**
 * The Course outline sidebar. Renders the course's modules and lessons in
 * `sequence` order with the current lesson indicated. The component itself
 * does not own the responsive shell — the page chooses where the outline
 * sits (sidebar on desktop, drawer on mobile).
 *
 * @remarks
 * The heading is pinned to the top of whatever scroll region the shell puts
 * the outline in. Both shells bound their height and scroll the current
 * lesson into view, which on a long course would carry the heading out of
 * sight and leave the sidebar visually unlabelled. Pinning costs nothing
 * when there is no scroll region — `sticky` is inert without one.
 *
 * A shell whose own control already says "Course outline" — the mobile
 * drawer's `<summary>` — passes `showHeading={false}` so the words do not
 * appear twice. The `<nav>` keeps its `aria-label` either way, so the region
 * never loses its accessible name.
 *
 * The heading's height is published as `--outline-heading-offset` so the
 * module titles below can pin themselves just under it. Keeping the value
 * here means the heading that causes the offset also owns it; when the
 * heading is not rendered the offset is zero.
 *
 * @param showHeading - Whether to render the visible heading; `false` when the shell provides one
 */
export function Outline({
  course,
  modules,
  lessonsByModuleId,
  currentLessonId,
  showHeading = true,
}: {
  course: Course;
  modules: Module[];
  lessonsByModuleId: Map<string, Lesson[]>;
  currentLessonId: LessonId;
  showHeading?: boolean;
}) {
  const t = useTranslations("Components.Outline");
  // `text-xs` (1rem line box) plus the heading's `pb-3` (0.75rem).
  const headingOffset = showHeading ? "1.75rem" : "0rem";
  return (
    <nav
      aria-label={t("title")}
      className="text-sm"
      style={{ "--outline-heading-offset": headingOffset } as CSSProperties}
    >
      {/* The gap below the heading is padding, not margin: a margin is
          transparent, so rows would scroll visibly through it. */}
      {showHeading ? (
        <h2 className="sticky top-0 z-10 bg-card pb-3 text-xs font-bold tracking-[0.24em] text-gold uppercase">
          {t("title")}
        </h2>
      ) : null}
      <ModuleList
        course={course}
        modules={modules}
        lessonsByModuleId={lessonsByModuleId}
        currentLessonId={currentLessonId}
      />
    </nav>
  );
}

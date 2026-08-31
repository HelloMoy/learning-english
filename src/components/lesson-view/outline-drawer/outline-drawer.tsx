"use client";

import type { Course } from "@/domain/entities/course/course";
import type { LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import { useScrollCurrentIntoView } from "@/hooks/use-scroll-current-into-view/use-scroll-current-into-view";

import { useTranslations } from "next-intl";
import { useState, type CSSProperties } from "react";

import { Outline } from "../outline/outline";

/**
 * How far the sticky sidebar sits below the top of the viewport. It has to
 * clear the sticky `SiteHeader`, and the same value sets the gap left under
 * the sidebar, so a change to the header's height is a one-line change here.
 */
const HEADER_CLEARANCE: CSSProperties = { "--outline-inset": "6rem" } as CSSProperties;

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
 *
 * @remarks
 * Each branch is a **self-contained scroll region**, not a column that grows
 * with the course. On a 107-lesson course an unbounded outline is taller
 * than the viewport, which pushed the current lesson far below the fold and
 * made the sidebar unable to answer the one question it exists for — *where
 * am I?*. Bounding each branch and scrolling the current lesson into it
 * answers that on arrival, without touching the page's own scroll position.
 *
 * The two branches differ in *when* they can be measured. The sidebar is
 * laid out from the first paint, so it positions itself on mount. The
 * drawer's contents have no layout while the `<details>` is closed, so it
 * tracks the open state and positions itself the moment the learner opens
 * it.
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerRef = useScrollCurrentIntoView<HTMLDivElement>(isDrawerOpen);
  const sidebarRef = useScrollCurrentIntoView<HTMLDivElement>(true);

  return (
    <>
      {/* Mobile: collapsible accordion. Native <details> gives keyboard
          support and a11y semantics for free. */}
      <details
        className="rounded-xl border border-border bg-card p-3 lg:hidden"
        onToggle={(event) => setIsDrawerOpen(event.currentTarget.open)}
      >
        <summary className="cursor-pointer text-xs font-bold tracking-[0.24em] text-gold uppercase">
          {t("title")}
        </summary>
        <div
          ref={drawerRef}
          className="mt-2 max-h-[60svh] overflow-y-auto"
        >
          <Outline
            course={course}
            modules={modules}
            lessonsByModuleId={lessonsByModuleId}
            currentLessonId={currentLessonId}
            showHeading={false}
          />
        </div>
      </details>

      {/* Desktop: permanent sidebar. `self-start` keeps the grid from
          stretching it to the row's full height, which would leave it
          nothing to stick to. The card keeps its padding and the scrolling
          happens one level in, so nothing can scroll through the padding
          and appear above the outline's pinned heading. */}
      <aside
        style={HEADER_CLEARANCE}
        className="sticky top-[var(--outline-inset)] hidden max-h-[calc(100svh-var(--outline-inset)-2rem)] flex-col self-start rounded-2xl border border-border bg-card p-5 lg:flex"
      >
        <div
          ref={sidebarRef}
          className="min-h-0 overflow-y-auto"
        >
          <Outline
            course={course}
            modules={modules}
            lessonsByModuleId={lessonsByModuleId}
            currentLessonId={currentLessonId}
          />
        </div>
      </aside>
    </>
  );
}

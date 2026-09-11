"use client";

import type { Course } from "@/domain/entities/course/course";
import type { LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import { useCourseWatchProgress } from "@/hooks/use-course-watch-progress/use-course-watch-progress";
import { useIsHydrated } from "@/hooks/use-is-hydrated/use-is-hydrated";
import { useScrollCurrentIntoView } from "@/hooks/use-scroll-current-into-view/use-scroll-current-into-view";
import { lessonPositionInModule } from "@/lib/lesson-position/lesson-position";

import { ChevronDown, List } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState, type CSSProperties } from "react";

import { Outline } from "../outline/outline";

/**
 * How far the sticky sidebar sits below the top of the viewport. It has to
 * clear the sticky `SiteHeader`, and the same value sets the gap left under
 * the sidebar, so a change to the header's height is a one-line change here.
 */
const HEADER_CLEARANCE: CSSProperties = { "--outline-inset": "6rem" } as CSSProperties;

/** The reading is a percentage, so its axis runs to 100 rather than to a count. */
const PERCENT_MAX = 100;

/** What both branches hand to the `Outline`, and what the row derives from. */
type OutlineDrawerProps = {
  course: Course;
  modules: Module[];
  lessonsByModuleId: Map<string, Lesson[]>;
  currentLessonId: LessonId;
};

/**
 * Responsive shell around the `Outline`. On screens `>= lg` it renders as a
 * permanent sidebar (the design's desktop layout). On smaller screens it
 * renders as a compact row above the breadcrumb — collapsed by default,
 * expanded with a tap.
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
 *
 * The mobile row's shape was chosen by comparison on a real phone against two
 * other candidates — a progress card above the breadcrumb, and a bar docked to
 * the bottom of the viewport. The record of why this one won is
 * `openspec/changes/archive/2026-09-11-mobile-course-content-variants`.
 */
export function OutlineDrawer({
  course,
  modules,
  lessonsByModuleId,
  currentLessonId,
}: OutlineDrawerProps) {
  const sidebarRef = useScrollCurrentIntoView<HTMLDivElement>(true);
  const outline = { course, modules, lessonsByModuleId, currentLessonId };

  return (
    <>
      <MobileOutlineDrawer {...outline} />

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
          <Outline {...outline} />
        </div>
      </aside>
    </>
  );
}

/**
 * The mobile branch: one compact row that opens the course outline.
 *
 * @remarks
 * A single row rather than a card, because on a phone the space above the
 * breadcrumb is space taken from the player. It still has to answer *where am
 * I?* before the learner opens anything, which is what the subtitle and the
 * edge meter are for.
 *
 * The whole row is the `<summary>`, so the tile and the chevron are not
 * separately focusable and a thumb aimed anywhere along the card hits the
 * control. The chevron is decorative: it turns, but the state it indicates
 * travels by `aria-expanded`, never by the icon alone.
 *
 * The meter's track renders on the server and its fill does not. Completion
 * lives in `localStorage`, so a bar drawn at zero in the first frame would
 * assert the learner has watched nothing, which may be false; drawing the track
 * alone keeps the row's height stable without making that claim. The same
 * reasoning retires the `progressbar` role until there is a reading —
 * "progressbar, 0%" is that false claim spoken to assistive technology — and
 * silences the meter for a learner who has genuinely completed nothing, which
 * is the rule `ModuleWatchProgress` already applies to its own.
 *
 * @param course - The course the outline belongs to
 * @param modules - The course's modules, in `sequence` order
 * @param lessonsByModuleId - Precomputed moduleId → lessons map
 * @param currentLessonId - The lesson being viewed
 */
function MobileOutlineDrawer({
  course,
  modules,
  lessonsByModuleId,
  currentLessonId,
}: OutlineDrawerProps) {
  const t = useTranslations("Components.Outline");
  const format = useFormatter();
  const isHydrated = useIsHydrated();
  const [isOpen, setIsOpen] = useState(false);
  const outlineRef = useScrollCurrentIntoView<HTMLDivElement>(isOpen);

  const courseLessons = [...lessonsByModuleId.values()].flat();
  const { completedCount, completedFraction } = useCourseWatchProgress(courseLessons);
  const headline = outlineHeadlineFor({ modules, lessonsByModuleId, currentLessonId });

  const hasReading = isHydrated && completedCount > 0;
  const readableFraction = hasReading ? completedFraction : 0;
  const percent = format.number(readableFraction, { style: "percent" });

  const meterSemantics = hasReading
    ? {
        role: "progressbar" as const,
        "aria-label": t("completionAriaLabel", { percent }),
        "aria-valuenow": Math.round(readableFraction * PERCENT_MAX),
        "aria-valuemin": 0,
        "aria-valuemax": PERCENT_MAX,
      }
    : { "aria-hidden": true };

  return (
    <details
      className="overflow-hidden rounded-2xl border border-border bg-card lg:hidden"
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary
        aria-expanded={isOpen}
        data-testid="outline-drawer-row"
        className="relative flex cursor-pointer list-none items-center gap-3 p-3"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
          <List
            aria-hidden="true"
            className="size-5"
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-bold text-foreground">{t("title")}</span>
          {headline ? (
            <span className="block truncate text-sm text-muted-foreground">
              {t("positionLabel", {
                module: headline.moduleTitle,
                position: headline.position,
                total: headline.total,
              })}
            </span>
          ) : null}
        </span>

        <ChevronDown
          aria-hidden="true"
          data-testid="outline-chevron"
          className={`size-5 shrink-0 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />

        {/* The meter is the card's bottom edge, so it is drawn as one, flush
            with the border rather than padded away from it. */}
        <span
          className="absolute inset-x-0 bottom-0 block h-1 bg-foreground/10"
          {...meterSemantics}
        >
          <span
            data-testid="outline-meter-fill"
            className="block h-full rounded-r-full bg-gold transition-[width] duration-300"
            style={{ width: `${readableFraction * PERCENT_MAX}%` }}
          />
        </span>
      </summary>

      <div
        ref={outlineRef}
        className="max-h-[60svh] overflow-y-auto border-t border-border p-3"
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
  );
}

/** Which module the learner is in, and where in it they are. */
type OutlineHeadline = {
  moduleTitle: string;
  position: number;
  total: number;
};

/**
 * The reading the mobile row states under its title.
 *
 * @remarks
 * Derived from the course structure alone — never from `localStorage` — so it
 * renders on the server like the rest of the page rather than appearing at
 * hydration the way the meter's fill does.
 *
 * @param modules - The course's modules
 * @param lessonsByModuleId - Precomputed moduleId → lessons map
 * @param currentLessonId - The lesson being viewed
 * @returns The module and position, or `undefined` when the course holds no
 *          such lesson — the row then names the region alone rather than
 *          inventing a position
 */
function outlineHeadlineFor({
  modules,
  lessonsByModuleId,
  currentLessonId,
}: {
  modules: Module[];
  lessonsByModuleId: Map<string, Lesson[]>;
  currentLessonId: LessonId;
}): OutlineHeadline | undefined {
  const currentModule = modules.find((mod) =>
    (lessonsByModuleId.get(mod.id) ?? []).some((lesson) => lesson.id === currentLessonId),
  );
  const position = lessonPositionInModule([...lessonsByModuleId.values()].flat(), currentLessonId);

  if (currentModule === undefined || position === undefined) return undefined;

  return { moduleTitle: currentModule.title, ...position };
}

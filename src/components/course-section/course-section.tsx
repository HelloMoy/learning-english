import { Eyebrow } from "@/components/eyebrow/eyebrow";

import { useId, type ReactNode } from "react";

/** Props for {@link CourseSection}. */
export type CourseSectionProps = {
  /** The gold label above the heading. */
  eyebrow: string;
  /** The section's level-two heading, which also names the region. */
  heading: string;
  children: ReactNode;
};

/**
 * One section of the course page: a gold eyebrow, a level-two heading, then
 * its content, as a region named by the heading.
 *
 * @remarks
 * Naming the region lets assistive technology list the page's sections
 * (What you'll learn, the sounds, the syllabus) as landmarks.
 *
 * @example
 * ```tsx
 * <CourseSection eyebrow="Syllabus" heading="5 lessons, one prize each">
 *   <CourseSyllabus view={view} />
 * </CourseSection>
 * ```
 */
export function CourseSection({ eyebrow, heading, children }: CourseSectionProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2
          id={headingId}
          className="text-[1.375rem] leading-tight font-black tracking-[-0.025em] text-balance text-foreground"
        >
          {heading}
        </h2>
      </div>
      {children}
    </section>
  );
}

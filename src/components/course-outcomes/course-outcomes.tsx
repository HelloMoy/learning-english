import { CourseSection } from "@/components/course-section/course-section";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

/** Props for {@link CourseOutcomes}. */
export type CourseOutcomesProps = {
  /** What the course teaches, as its manifest declares it. */
  outcomes: ReadonlyArray<string>;
};

/**
 * **What you'll learn**: a course's outcomes as a checklist, in the order the
 * course declares them.
 *
 * @remarks
 * Outcomes are course content, so they render as written in the manifest; only
 * the headings are translated. A course that declares none renders nothing,
 * not an empty heading.
 *
 * @example
 * ```tsx
 * <CourseOutcomes outcomes={course.outcomes ?? []} />
 * ```
 */
export function CourseOutcomes({ outcomes }: CourseOutcomesProps) {
  const t = useTranslations("Components.CourseOutcomes");
  if (outcomes.length === 0) return null;

  return (
    <CourseSection
      eyebrow={t("eyebrow")}
      heading={t("heading")}
    >
      <ul className="grid grid-cols-1 gap-3.5 md:grid-cols-2 md:gap-x-8">
        {outcomes.map((outcome) => (
          <li
            key={outcome}
            className="grid grid-cols-[1.375rem_minmax(0,1fr)] items-start gap-3 text-[0.9375rem] leading-relaxed text-foreground"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 grid size-[1.375rem] place-items-center rounded-full bg-primary/20 text-gold"
            >
              <Check className="size-3.5" />
            </span>
            {outcome}
          </li>
        ))}
      </ul>
    </CourseSection>
  );
}

import { Skeleton } from "@/components/ui/skeleton/skeleton";

/** Props for {@link PendingCoursePage}. */
export type PendingCoursePageProps = {
  /** The course title, the page's level-one heading. */
  title: string;
};

/**
 * What a course route shows before the learner's state has reached the
 * browser: the course title over placeholders, and nothing that depends on
 * whether the learner is enrolled.
 *
 * @remarks
 * The frame matches the course page's hero, so the page does not jump when the
 * real content replaces it. It carries no **Enroll**, no **Start course** and
 * no progress, because none of them can be known yet.
 *
 * @example
 * ```tsx
 * if (!isSeeded) return <PendingCoursePage title={course.title} />;
 * ```
 */
export function PendingCoursePage({ title }: PendingCoursePageProps) {
  return (
    <div
      data-testid="course-page-pending"
      className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pt-4 sm:px-11 lg:pt-5"
    >
      <div className="relative flex min-h-[28rem] flex-col justify-end gap-3 overflow-hidden rounded-[22px] border border-border p-5 pt-16 sm:p-7 sm:pt-24 lg:aspect-[21/9] lg:min-h-0 lg:rounded-[26px] lg:p-8">
        <Skeleton className="h-3 w-56" />
        <h1 className="max-w-[18ch] text-[2.25rem] leading-none font-black tracking-[-0.035em] text-balance text-foreground lg:text-[3.25rem]">
          {title}
        </h1>
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <Skeleton className="h-64 w-full rounded-[18px]" />
    </div>
  );
}

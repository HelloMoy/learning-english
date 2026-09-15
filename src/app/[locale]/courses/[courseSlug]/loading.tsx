import { LoadingStatus } from "@/components/loading-status/loading-status";
import { Skeleton } from "@/components/ui/skeleton/skeleton";

/** How many lesson tiles the shell previews: one row at `lg`. */
const LESSON_SHAPES = 5;

/**
 * The course overview's loading shell.
 *
 * @remarks
 * The shapes trace `CourseProgressBoard`: the continue tile beside the course
 * progress tile (the course tile first on a phone), then a row of lesson ring
 * tiles. Sizes match the real tiles at both breakpoints so nothing reflows when
 * the page arrives.
 */
export default function Loading() {
  return (
    <main
      id="main"
      className="w-full"
    >
      <LoadingStatus />

      <div
        data-testid="course-shell-shapes"
        aria-hidden="true"
        className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 pt-4 pb-16 sm:px-11 sm:pb-24 lg:gap-4 lg:pt-5"
      >
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-12 lg:gap-4">
          <Skeleton
            data-testid="course-shell-continue"
            className="h-80 rounded-[22px] lg:col-span-8 lg:h-[380px] lg:rounded-[26px]"
          />
          <Skeleton
            data-testid="course-shell-course"
            className="-order-1 h-32 rounded-[22px] lg:order-none lg:col-span-4 lg:h-[380px] lg:rounded-[26px]"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5 lg:gap-4">
          {Array.from({ length: LESSON_SHAPES }, (_, index) => (
            <Skeleton
              key={index}
              data-testid="course-shell-lesson"
              className="h-[108px] rounded-[20px] lg:h-[350px] lg:rounded-3xl"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

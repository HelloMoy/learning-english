import { LoadingStatus } from "@/components/loading-status/loading-status";
import { Skeleton } from "@/components/ui/skeleton/skeleton";

/**
 * The course overview's loading shell.
 *
 * @remarks
 * The shapes trace `CourseOverview`: the compact hero (eyebrow, title, meta line
 * and Start course), the poster carousel with its selected poster between
 * shrinking neighbours and its dots, and the progress panel beneath. Sizes match
 * the real carousel at both breakpoints so nothing reflows when it arrives.
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
        className="flex flex-col gap-4 pb-16 sm:gap-6 sm:pb-24"
      >
        <HeroShape />
        <CarouselShape />
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-11">
          <Skeleton
            data-testid="course-shell-panel"
            className="h-[520px] w-full rounded-[22px] lg:h-[300px]"
          />
        </div>
      </div>
    </main>
  );
}

function HeroShape() {
  return (
    <div
      data-testid="course-shell-hero"
      className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-8 sm:px-11 sm:pt-12 lg:flex-row lg:items-end lg:justify-between"
    >
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-11 w-64 sm:h-14 sm:w-96" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-12 w-full rounded-lg lg:w-44" />
    </div>
  );
}

function CarouselShape() {
  return (
    <div className="flex flex-col gap-6">
      <div
        data-testid="course-shell-carousel"
        className="flex h-[400px] items-center justify-center gap-5 overflow-x-clip lg:h-[500px]"
      >
        <Skeleton
          data-testid="course-shell-poster"
          className="hidden h-[270px] w-[180px] shrink-0 rounded-2xl lg:block"
        />
        <Skeleton
          data-testid="course-shell-poster"
          className="h-[300px] w-[200px] shrink-0 rounded-2xl lg:h-[345px] lg:w-[230px]"
        />
        <Skeleton
          data-testid="course-shell-poster"
          className="h-[360px] w-[240px] shrink-0 rounded-[18px] lg:h-[450px] lg:w-[300px]"
        />
        <Skeleton
          data-testid="course-shell-poster"
          className="h-[300px] w-[200px] shrink-0 rounded-2xl lg:h-[345px] lg:w-[230px]"
        />
        <Skeleton
          data-testid="course-shell-poster"
          className="hidden h-[270px] w-[180px] shrink-0 rounded-2xl lg:block"
        />
      </div>
      <div className="flex h-11 items-center justify-center gap-2">
        {[0, 1, 2, 3, 4].map((dot) => (
          <Skeleton
            key={dot}
            className="size-2 rounded-full"
          />
        ))}
      </div>
    </div>
  );
}

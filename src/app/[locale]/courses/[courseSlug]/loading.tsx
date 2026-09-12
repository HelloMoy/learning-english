import { LoadingStatus } from "@/components/loading-status/loading-status";
import { Skeleton } from "@/components/ui/skeleton/skeleton";

/**
 * The course overview's loading shell.
 *
 * @remarks
 * The heaviest document in the app — the course overview ships around 166 KB —
 * so this is the navigation that sits longest on the previous page without one.
 *
 * The shapes trace `CourseOverview`: the title and its badges, the description,
 * and the stack of `ModuleShowcaseCard`s with their poster deck. The cards keep
 * the real card's `lg:flex-row` switch, so the copy column and the deck land
 * where they will be at both breakpoints rather than reflowing on arrival.
 */
export default function Loading() {
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-11 sm:py-16"
    >
      <LoadingStatus />

      <div
        data-testid="course-shell-shapes"
        aria-hidden="true"
        className="flex flex-col gap-10"
      >
        <header
          data-testid="course-shell-header"
          className="flex flex-col gap-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <Skeleton className="h-11 w-80 sm:h-14" />
            <div className="flex items-center gap-2 pt-2">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
          </div>
          <div className="flex max-w-3xl flex-col gap-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
          </div>
        </header>

        <div
          data-testid="course-shell-modules"
          className="flex flex-col gap-10"
        >
          {[0, 1, 2].map((card) => (
            <ModuleCardShape key={card} />
          ))}
        </div>
      </div>
    </main>
  );
}

/**
 * One module showcase: a copy column that takes 30% of the row from `lg` up,
 * and the deck of lesson posters beside it.
 */
function ModuleCardShape() {
  return (
    <div className="flex flex-col gap-3">
      <div
        data-testid="course-shell-module-card"
        className="flex flex-col gap-8 rounded-2xl border border-border p-6 lg:flex-row lg:items-center lg:gap-10 lg:p-8"
      >
        <div className="flex flex-col gap-4 lg:w-[30%] lg:shrink-0">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-11 w-32 rounded-lg" />
        </div>

        <div className="flex min-w-0 flex-1 items-stretch gap-3">
          {[0, 1, 2].map((poster) => (
            <Skeleton
              key={poster}
              className="aspect-video min-w-0 flex-1 rounded-xl"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

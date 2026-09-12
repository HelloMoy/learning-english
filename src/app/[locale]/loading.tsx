import { LoadingStatus } from "@/components/loading-status/loading-status";
import { Skeleton } from "@/components/ui/skeleton/skeleton";

/**
 * The home's loading shell.
 *
 * @remarks
 * Without a shell, a navigation holds the learner on the page they came from
 * until the whole payload lands — measured at several seconds on a throttled
 * phone — and they read that stale page as the one they asked for. This gives
 * Next something to swap in on the first frame instead.
 *
 * The shapes trace the real home: the hero's eyebrow, headline and standfirst,
 * the section heading row, and the course ladder in the grid `CourseLadder`
 * derives from the catalog size. The classes are the page's own, so the arriving
 * content fills positions that are already correct.
 *
 * Three cards, because the catalog holds two courses today and a third column
 * only opens above `xl` — a shell that guessed higher would leave a hole the
 * real ladder never has.
 */
export default function Loading() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-14 px-4 py-12 sm:px-11 sm:py-20"
    >
      <LoadingStatus />

      <div
        data-testid="home-shell-shapes"
        aria-hidden="true"
        className="flex flex-col gap-14"
      >
        <section
          data-testid="home-shell-hero"
          className="flex max-w-3xl flex-col gap-5"
        >
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-16 w-full sm:h-20" />
          <Skeleton className="h-16 w-4/5 sm:h-20" />
          <Skeleton className="h-6 w-full max-w-xl" />
        </section>

        <section
          data-testid="home-shell-section"
          className="flex flex-col gap-8"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-9 w-64" />
            </div>
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>

          <div
            data-testid="home-shell-ladder"
            className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
          >
            {[0, 1, 2].map((card) => (
              <CourseCardShape key={card} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

/**
 * One rung of the ladder: the ordinal and state chips, the course title, its
 * description, the module rows it previews, and the call to action.
 */
function CourseCardShape() {
  return (
    <div className="flex h-full flex-col gap-5 rounded-2xl border border-border p-7">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-7 w-3/4" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="flex flex-col">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="flex items-center gap-3 border-t border-border py-2.5"
          >
            <Skeleton className="h-3 w-16 shrink-0" />
            <Skeleton className="h-4 min-w-0 flex-1" />
          </div>
        ))}
      </div>
      <Skeleton className="h-11 w-36 rounded-lg" />
    </div>
  );
}

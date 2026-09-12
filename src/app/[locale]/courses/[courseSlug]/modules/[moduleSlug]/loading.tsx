import { LoadingStatus } from "@/components/loading-status/loading-status";
import { Skeleton } from "@/components/ui/skeleton/skeleton";

/** A module holds far more lessons than this; enough rows to fill a phone fold. */
const PREVIEWED_LESSON_ROWS = 6;

/**
 * The module overview's loading shell.
 *
 * @remarks
 * The shapes trace `ModuleOverview`: the breadcrumb back to the course, the
 * module title block, and the lesson list. Each row keeps the real row's
 * borders and its `sm:flex` thumbnail, so the list does not change height when
 * the real lessons land.
 *
 * Six rows rather than the module's true lesson count, which this shell cannot
 * know. Six is what fills a phone fold — enough that the shell reads as a list,
 * few enough that a short module is not promised rows it does not have.
 */
export default function Loading() {
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-11 sm:py-16"
    >
      <LoadingStatus />

      <div
        data-testid="module-shell-shapes"
        aria-hidden="true"
        className="flex flex-col gap-8"
      >
        <Skeleton className="h-4 w-40" />

        <header
          data-testid="module-shell-header"
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-3">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-10 w-3/4 sm:h-12" />
          </div>
        </header>

        <ul
          data-testid="module-shell-lessons"
          className="flex flex-col"
        >
          {Array.from({ length: PREVIEWED_LESSON_ROWS }, (_, row) => (
            <li
              key={row}
              data-testid="module-shell-lesson-row"
              className="flex items-center gap-4 border-b border-border py-4 first:border-t"
            >
              <Skeleton className="hidden h-14 w-24 shrink-0 rounded-lg sm:block" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-2/3" />
              </div>
              <Skeleton className="hidden h-4 w-12 sm:block" />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

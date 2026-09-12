import { LoadingStatus } from "@/components/loading-status/loading-status";
import { Skeleton } from "@/components/ui/skeleton/skeleton";

/**
 * The lesson page's loading shell — the one that answers the reported bug.
 *
 * @remarks
 * Tapping a lesson used to leave the learner on the module page for seconds,
 * and a module page has no video frame. The learner read that as arriving at a
 * lesson that had none, then watched the "video space appear" when the real
 * payload finally landed. Nothing was broken; they were looking at the previous
 * route. This shell replaces it on the first frame, with the frame already in
 * place.
 *
 * The shapes trace `LessonView` at both breakpoints: the outline row that only
 * exists below `lg`, the breadcrumb, the 16:9 frame, the title and description,
 * the notes tab row, and the closing card — inside the page's own
 * `lg:grid-cols-[260px_1fr_280px]` grid, with the aside that only appears above
 * `lg`.
 *
 * The frame is drawn as a bordered black box rather than a shimmer, because
 * that is what the real frame is: a shimmering rectangle would be replaced by a
 * black one a moment later, which is a worse sequence than a black one that
 * gains a poster.
 */
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6">
      <LoadingStatus />

      <div
        data-testid="lesson-shell-shapes"
        aria-hidden="true"
      >
        <div
          data-testid="lesson-shell-grid"
          className="grid gap-8 lg:grid-cols-[260px_1fr_280px]"
        >
          {/* The outline: a compact row on a phone, the full rail from `lg`. */}
          <div data-testid="lesson-shell-outline">
            <Skeleton className="h-[68px] w-full rounded-2xl lg:hidden" />
            <div className="hidden flex-col gap-3 lg:flex">
              <Skeleton className="h-5 w-32" />
              {[0, 1, 2, 3, 4].map((row) => (
                <Skeleton
                  key={row}
                  className="h-9 w-full rounded-lg"
                />
              ))}
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <Skeleton
              data-testid="lesson-shell-breadcrumb"
              className="h-4 w-3/4 max-w-sm"
            />

            <div
              data-testid="lesson-shell-frame"
              className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black"
            >
              <Skeleton className="size-full rounded-none bg-white/5" />
            </div>

            <Skeleton
              data-testid="lesson-shell-title"
              className="h-8 w-2/3"
            />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>

            <div
              data-testid="lesson-shell-tabs"
              className="flex gap-2"
            >
              <Skeleton className="h-10 w-24 rounded-lg" />
              <Skeleton className="h-10 w-28 rounded-lg" />
            </div>

            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            <Skeleton
              data-testid="lesson-shell-close"
              className="h-32 w-full rounded-2xl"
            />
          </div>

          <aside className="hidden flex-col gap-4 lg:flex">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </aside>
        </div>
      </div>
    </main>
  );
}

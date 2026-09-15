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
 * The shapes trace the new-visitor home, which is what the server renders: the
 * editorial hero on its twelve-column grid with the vowel-length card beside
 * it, the numbered questions, and the levels table. The classes are the page's
 * own, so the arriving content fills positions that are already correct.
 *
 * Two level rows, because the catalog ships two courses today; a shell that
 * guessed more would promise rows the table never draws.
 */
export default function Loading() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-20 px-4 py-12 sm:gap-28 sm:px-11 sm:py-20"
    >
      <LoadingStatus />

      <div
        data-testid="home-shell-shapes"
        aria-hidden="true"
        className="flex flex-col gap-20 sm:gap-28"
      >
        <section
          data-testid="home-shell-hero"
          className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12"
        >
          <div className="flex flex-col gap-6 lg:col-span-7">
            <Skeleton className="h-3 w-64" />
            <Skeleton className="h-12 w-full sm:h-16" />
            <Skeleton className="h-12 w-5/6 sm:h-16" />
            <Skeleton className="h-12 w-2/3 sm:h-16" />
            <Skeleton className="h-5 w-full max-w-xl" />
            <Skeleton className="h-12 w-60 rounded-lg" />
          </div>
          <CardShape />
        </section>

        <section className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col gap-3 lg:col-span-4">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-9 w-full max-w-72" />
          </div>
          <div className="flex flex-col lg:col-span-8">
            {[0, 1, 2].map((question) => (
              <div
                key={question}
                className="flex gap-6 border-t border-border py-7"
              >
                <Skeleton className="h-8 w-10 shrink-0" />
                <div className="flex w-full flex-col gap-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-7">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-9 w-64" />
          </div>
          <div
            data-testid="home-shell-levels"
            className="flex flex-col border-t-2 border-border"
          >
            {[0, 1].map((row) => (
              <LevelRowShape key={row} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

/** The vowel-length card: eyebrow row, the two word rows, and the anchor note. */
function CardShape() {
  return (
    <div
      data-testid="home-shell-card"
      className="flex flex-col gap-5 rounded-2xl border border-border p-5 sm:p-7 lg:col-span-5"
    >
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-4 w-20" />
      </div>
      {[0, 1].map((row) => (
        <div
          key={row}
          className="flex items-center gap-4 border-t border-border py-3.5"
        >
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="flex w-full flex-col gap-2.5">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>
      ))}
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  );
}

/** One row of the levels table: ordinal, title, description, counts and link. */
function LevelRowShape() {
  return (
    <div className="grid grid-cols-1 gap-3 border-b border-border py-6 lg:grid-cols-[7.5rem_minmax(0,1.2fr)_minmax(0,1.4fr)_12.5rem_11.25rem] lg:items-center lg:gap-6 lg:py-8">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-7 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-11 w-full rounded-lg" />
    </div>
  );
}

import { LoadingStatus } from "@/components/loading-status/loading-status";
import { Skeleton } from "@/components/ui/skeleton/skeleton";

/** My learning's loading shell: the greeting and the panel beneath it. */
export default function Loading() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-20 px-4 py-10 sm:gap-28 sm:px-11 sm:py-16"
    >
      <LoadingStatus />
      <div
        aria-hidden="true"
        className="flex flex-col gap-8"
      >
        <div className="flex items-center gap-5">
          <Skeleton className="size-14 rounded-full sm:size-[4.5rem]" />
          <div className="flex w-full flex-col gap-3">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-10 w-full max-w-md sm:h-14" />
          </div>
        </div>
        <Skeleton className="h-44 w-full max-w-2xl rounded-[1.125rem]" />
      </div>
    </main>
  );
}

import { LoadingStatus } from "@/components/loading-status/loading-status";
import { Skeleton } from "@/components/ui/skeleton/skeleton";

/** Achievements' loading shell: the card and heading, then the two counts. */
export default function Loading() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-10 sm:px-11 sm:py-16"
    >
      <LoadingStatus />
      <div
        aria-hidden="true"
        className="flex flex-col gap-14"
      >
        <div className="grid grid-cols-1 items-center gap-7 lg:grid-cols-12 lg:gap-14">
          <Skeleton className="h-56 w-full rounded-[1.25rem] lg:col-span-5" />
          <div className="flex flex-col gap-4 lg:col-span-7">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full max-w-md" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-[0.875rem]" />
          <Skeleton className="h-24 rounded-[0.875rem]" />
        </div>
      </div>
    </main>
  );
}

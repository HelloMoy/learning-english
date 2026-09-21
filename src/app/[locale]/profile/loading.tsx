import { LoadingStatus } from "@/components/loading-status/loading-status";
import { Skeleton } from "@/components/ui/skeleton/skeleton";

/** The Profile page's loading shell: the card band, then the first section. */
export default function Loading() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pt-10 pb-32 sm:px-11 sm:pt-16 sm:pb-36"
    >
      <LoadingStatus />
      <div
        aria-hidden="true"
        className="mx-auto flex w-full max-w-5xl flex-col gap-8 sm:gap-10"
      >
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full max-w-sm" />
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
          <Skeleton className="h-56 w-full rounded-[1.25rem] lg:w-[26rem] lg:flex-none" />
          <Skeleton className="h-56 w-full rounded-[1.125rem]" />
        </div>
        <div className="flex flex-col gap-5 border-t border-border pt-8">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-14 w-full max-w-xl rounded-xl" />
          <Skeleton className="h-40 w-full rounded-[1.125rem]" />
        </div>
      </div>
    </main>
  );
}

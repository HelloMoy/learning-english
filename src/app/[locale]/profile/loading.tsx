import { LoadingStatus } from "@/components/loading-status/loading-status";
import { Skeleton } from "@/components/ui/skeleton/skeleton";

/** The Profile page's loading shell: the form beside the card preview. */
export default function Loading() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-10 sm:px-11 sm:py-16"
    >
      <LoadingStatus />
      <div
        aria-hidden="true"
        className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:gap-14"
      >
        <div className="flex flex-col gap-6 lg:col-span-7">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-[1.125rem]" />
        </div>
        <Skeleton className="order-first h-56 w-full rounded-[1.25rem] lg:order-none lg:col-span-5" />
      </div>
    </main>
  );
}

import { Skeleton } from "@/components/ui/skeleton/skeleton";

/**
 * The onboarding step's shape while storage has not said whether this device
 * already holds a profile.
 *
 * @remarks
 * Rendering the form before storage answers would flash it at a learner who is
 * about to be forwarded to My learning, so both steps show this instead.
 */
export function OnboardingShell() {
  return (
    <div
      data-testid="onboarding-shell"
      aria-hidden="true"
      className="mx-auto flex w-full max-w-[47.5rem] flex-col items-center gap-6 sm:gap-7"
    >
      <Skeleton className="h-3 w-40" />
      <Skeleton className="h-10 w-full max-w-md sm:h-12" />
      <Skeleton className="h-52 w-full max-w-[27.5rem] rounded-[1.25rem]" />
      <Skeleton className="h-14 w-full max-w-[27.5rem] rounded-xl" />
    </div>
  );
}

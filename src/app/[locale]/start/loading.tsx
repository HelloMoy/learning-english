import { LoadingStatus } from "@/components/loading-status/loading-status";
import { OnboardingShell } from "@/components/onboarding-shell/onboarding-shell";

/** The onboarding's loading shell: the same shape the step shows before storage answers. */
export default function Loading() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-10 sm:px-11 sm:py-16"
    >
      <LoadingStatus />
      <OnboardingShell />
    </main>
  );
}

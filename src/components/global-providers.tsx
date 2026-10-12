"use client";

import { PendingPrizeAnnouncement } from "@/components/pending-prize-announcement/pending-prize-announcement";
import { useAnalyticsIdentity } from "@/hooks/use-analytics-identity/use-analytics-identity";
import { useLegacyThemeMigration } from "@/hooks/use-legacy-theme-migration/use-legacy-theme-migration";
import { useServiceWorkerRegistration } from "@/hooks/use-service-worker-registration/use-service-worker-registration";
import { useSessionRecordingGate } from "@/hooks/use-session-recording-gate/use-session-recording-gate";
import type { AchievementLevel } from "@/lib/learner-achievements/learner-achievements";

import NiceModal from "@ebay/nice-modal-react";
import { NuqsAdapter } from "nuqs/adapters/next/app";

/**
 * Client-side providers that wrap the entire app.
 * Add new global providers here (theme, auth session, query client, etc.).
 *
 * @remarks
 * This renders inside `<ThemeProvider>` and on every route, which is why the
 * one-off theme migration runs here rather than in a theme control: a learner
 * carrying a stored `system` must be migrated whether or not the view they
 * landed on happens to show the toggle. See {@link useLegacyThemeMigration}.
 *
 * Being on every route is also what lets {@link PendingPrizeAnnouncement} do its
 * job: a prize won in the last seconds of a lesson is announced wherever the
 * learner went next, not lost with the page that owed them the news.
 *
 * {@link useServiceWorkerRegistration} is here for the same reason: the browser
 * decides whether to offer an install once per visit, whichever page the
 * learner happened to land on.
 *
 * So are {@link useAnalyticsIdentity} and {@link useSessionRecordingGate}: who
 * is signed in and which page is open change on any navigation, and both
 * decide what PostHog may attribute and record. Neither does anything until
 * the visitor has accepted, or at all in a build with no PostHog token.
 *
 * @param children - The page below the providers
 * @param levels - Every catalog course, for deciding where a waiting prize stands
 * @param learnerAccountId - The signed-in learner's account ID, or `null` when signed out
 */
export function GlobalProviders({
  children,
  levels,
  learnerAccountId,
}: {
  children: React.ReactNode;
  levels: ReadonlyArray<AchievementLevel>;
  learnerAccountId: string | null;
}) {
  useLegacyThemeMigration();
  useServiceWorkerRegistration();
  useAnalyticsIdentity(learnerAccountId);
  useSessionRecordingGate();

  return (
    <NuqsAdapter>
      <NiceModal.Provider>
        <PendingPrizeAnnouncement levels={levels} />
        {children}
      </NiceModal.Provider>
    </NuqsAdapter>
  );
}

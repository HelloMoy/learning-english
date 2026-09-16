"use client";

import { PendingPrizeAnnouncement } from "@/components/pending-prize-announcement/pending-prize-announcement";
import { useLegacyThemeMigration } from "@/hooks/use-legacy-theme-migration/use-legacy-theme-migration";
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
 * @param children - The page below the providers
 * @param levels - Every catalog course, for deciding where a waiting prize stands
 */
export function GlobalProviders({
  children,
  levels,
}: {
  children: React.ReactNode;
  levels: ReadonlyArray<AchievementLevel>;
}) {
  useLegacyThemeMigration();

  return (
    <NuqsAdapter>
      <NiceModal.Provider>
        <PendingPrizeAnnouncement levels={levels} />
        {children}
      </NiceModal.Provider>
    </NuqsAdapter>
  );
}

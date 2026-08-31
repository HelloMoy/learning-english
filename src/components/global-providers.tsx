"use client";

import { useLegacyThemeMigration } from "@/hooks/use-legacy-theme-migration/use-legacy-theme-migration";

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
 */
export function GlobalProviders({ children }: { children: React.ReactNode }) {
  useLegacyThemeMigration();

  return (
    <NuqsAdapter>
      <NiceModal.Provider>{children}</NiceModal.Provider>
    </NuqsAdapter>
  );
}

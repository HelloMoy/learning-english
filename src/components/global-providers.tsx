"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import NiceModal from "@ebay/nice-modal-react";

/**
 * Client-side providers that wrap the entire app.
 * Add new global providers here (theme, auth session, query client, etc.).
 */
export function GlobalProviders({ children }: { children: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <NiceModal.Provider>{children}</NiceModal.Provider>
    </NuqsAdapter>
  );
}

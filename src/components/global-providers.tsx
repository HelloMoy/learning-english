"use client";

import NiceModal from "@ebay/nice-modal-react";
import { NuqsAdapter } from "nuqs/adapters/next/app";

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

"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import NiceModal from "@ebay/nice-modal-react";

/**
 * Client-side providers for the app.
 * Add new client providers here (theme, auth session, query client, etc.).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <NiceModal.Provider>{children}</NiceModal.Provider>
    </NuqsAdapter>
  );
}

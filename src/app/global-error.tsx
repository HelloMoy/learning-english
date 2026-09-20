"use client";

import { GlobalErrorFallback } from "@/components/global-error-fallback/global-error-fallback";

import "./globals.css";

/** Replaces the root layout when it fails, so it brings its own html and body. */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <GlobalErrorFallback
          error={error}
          retry={unstable_retry}
        />
      </body>
    </html>
  );
}

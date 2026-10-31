"use client";

import { useConsentStatus } from "@/hooks/use-consent-status/use-consent-status";
import { usePathname } from "@/i18n/navigation";
import { startRecording, stopRecording } from "@/lib/product-analytics/product-analytics";
import { isRecordableRoute } from "@/lib/recordable-route/recordable-route";

import { useEffect } from "react";

/**
 * Client hook: starts and stops the session recording as the visitor's
 * consent and the current page allow.
 *
 * @remarks
 * PostHog is started with recording off, so nothing is recorded until this
 * hook says so — and it says so only while the visitor has accepted **and**
 * the page is not one where a credential is typed or carried. That ordering
 * is what keeps a password-reset link out of a recording even when it is the
 * first page of a visit.
 *
 * Mounted once, in `GlobalProviders`, so it follows every navigation.
 *
 * @example
 * ```tsx
 * useSessionRecordingGate();
 * ```
 *
 * @category Observability
 */
export function useSessionRecordingGate(): void {
  const consent = useConsentStatus();
  const pathname = usePathname();
  const mayRecord = consent === "granted" && isRecordableRoute(pathname);

  useEffect(() => {
    if (mayRecord) startRecording();
    else stopRecording();
  }, [mayRecord]);
}

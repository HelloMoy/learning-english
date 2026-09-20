"use client";

import { clearPendingPrize } from "@/hooks/use-pending-prize-announcement/use-pending-prize-announcement";

import { useEffect } from "react";

/**
 * Drops the prize announcement the deleted account left on this device, so
 * the next learner here is not told about a prize that no longer exists.
 */
export function ForgetPendingPrize() {
  useEffect(() => clearPendingPrize(), []);
  return null;
}

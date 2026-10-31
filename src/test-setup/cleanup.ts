import { resetLearnerStore } from "@/lib/learner-store/learner-store";
import { detachProductAnalyticsClient } from "@/lib/product-analytics/product-analytics";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Cleanup the DOM after each test to avoid leaks between tests
afterEach(() => {
  cleanup();
  // The learner store is module-level on purpose (every surface in a tab must
  // agree), so a test that seeds it would otherwise leak into the next one.
  resetLearnerStore();
  // Same for the analytics client a test attached: the next test must start
  // as every build without a project token does, with nothing to talk to.
  detachProductAnalyticsClient();
});

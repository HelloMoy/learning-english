import { resetLearnerStore } from "@/lib/learner-store/learner-store";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Cleanup the DOM after each test to avoid leaks between tests
afterEach(() => {
  cleanup();
  // The learner store is module-level on purpose (every surface in a tab must
  // agree), so a test that seeds it would otherwise leak into the next one.
  resetLearnerStore();
});

import { vi } from "vitest";

// The learner Server Actions reach a database through a verified session —
// neither exists in a component test. Every client composition root imports
// them, so they are replaced here with actions that accept every write; a test
// that needs a refusal overrides one with `vi.mocked(...)`. The actions' own
// integration suite restores the real module with `vi.unmock`.
vi.mock("@/app/[locale]/learner-actions", () => ({
  markLessonCompleteAction: vi.fn(async () => ({ data: { completed: true } })),
  unmarkLessonCompleteAction: vi.fn(async () => ({ data: { unmarked: true } })),
  recordPlaybackPositionAction: vi.fn(async () => ({ data: { recorded: true } })),
  recordContinueWatchingAction: vi.fn(async () => ({ data: { recorded: true } })),
  saveLearnerProfileAction: vi.fn(async () => ({ data: { saved: true } })),
  earnTicketsAction: vi.fn(async () => ({ data: { earned: true } })),
  claimPrizeAction: vi.fn(async () => ({ data: { claimed: true } })),
}));

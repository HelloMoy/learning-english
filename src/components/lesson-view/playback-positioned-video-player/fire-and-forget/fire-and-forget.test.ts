import { describe, expect, test, vi } from "vitest";

import { fireAndForget } from "./fire-and-forget";

/**
 * A rejection like a destroyed provider's, with a spy on its own `catch`.
 *
 * @remarks
 * An earlier version of this test listened for `process.on("unhandledRejection")`
 * and passed against the defect too: Vitest installs its own handler and
 * reports leaks at the end of the run, so the event never reaches a listener
 * added inside a test. What actually separates the fixed code from the broken
 * one is whether a handler is attached at all.
 *
 * The fixture attaches its own `catch` so the rejection cannot escape the test
 * either way, which means the spy already carries that one call — hence the
 * before/after count rather than `toHaveBeenCalled`.
 */
function rejectingCommand() {
  const promise = Promise.reject<void>(new Error("provider destroyed"));
  const observed = vi.spyOn(promise, "catch");
  void promise.catch(() => {});
  return { promise, attachedHandlers: () => observed.mock.calls.length };
}

describe("fireAndForget", () => {
  describe("GIVEN a command that rejects because the provider was destroyed", () => {
    test("WHEN it is fired THEN a handler is attached, so nothing leaks", () => {
      // Arrange
      const { promise, attachedHandlers } = rejectingCommand();
      const before = attachedHandlers();

      // Act
      fireAndForget(promise);

      // Assert
      expect(attachedHandlers()).toBeGreaterThan(before);
    });
  });

  describe("GIVEN there is no player yet, as on the first render", () => {
    test("WHEN it is fired with nothing THEN it does not throw", () => {
      // Act + Assert
      expect(() => fireAndForget(undefined)).not.toThrow();
    });
  });

  describe("GIVEN a command that resolves", () => {
    test("WHEN it is fired THEN the promise settles without complaint", async () => {
      // Act + Assert
      expect(() => fireAndForget(Promise.resolve())).not.toThrow();
      await Promise.resolve();
    });
  });
});

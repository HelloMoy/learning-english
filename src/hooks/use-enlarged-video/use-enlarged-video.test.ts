import { faker } from "@faker-js/faker";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { useEnlargedVideo } from "./use-enlarged-video";

describe("useEnlargedVideo", () => {
  describe("GIVEN a player that has just mounted", () => {
    test("WHEN nothing has happened THEN the video is not enlarged", () => {
      const { result } = renderHook(() => useEnlargedVideo());

      expect(result.current.isEnlarged).toBe(false);
    });

    test("WHEN exit is called THEN the video stays collapsed", () => {
      const { result } = renderHook(() => useEnlargedVideo());

      act(() => {
        result.current.exit();
      });

      expect(result.current.isEnlarged).toBe(false);
    });
  });

  describe("GIVEN a learner working the enlarge control", () => {
    test("WHEN toggle is called THEN the video is enlarged", () => {
      const { result } = renderHook(() => useEnlargedVideo());

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isEnlarged).toBe(true);
    });

    test("WHEN toggle is called twice THEN the video is back in the page", () => {
      const { result } = renderHook(() => useEnlargedVideo());

      act(() => {
        result.current.toggle();
      });
      act(() => {
        result.current.toggle();
      });

      expect(result.current.isEnlarged).toBe(false);
    });

    test("WHEN exit is called while enlarged THEN the video is back in the page", () => {
      const { result } = renderHook(() => useEnlargedVideo());

      act(() => {
        result.current.toggle();
      });
      act(() => {
        result.current.exit();
      });

      expect(result.current.isEnlarged).toBe(false);
    });
  });

  describe("GIVEN a learner reaching for the keyboard", () => {
    test("WHEN Escape is pressed while enlarged THEN the video is back in the page", () => {
      const { result } = renderHook(() => useEnlargedVideo());

      act(() => {
        result.current.toggle();
      });
      act(() => {
        pressKey("Escape");
      });

      expect(result.current.isEnlarged).toBe(false);
    });

    test("WHEN another key is pressed while enlarged THEN the video stays enlarged", () => {
      const { result } = renderHook(() => useEnlargedVideo());

      act(() => {
        result.current.toggle();
      });
      act(() => {
        pressKey(" ");
      });

      expect(result.current.isEnlarged).toBe(true);
    });

    test("WHEN Escape is pressed while the video is in the page THEN nothing changes", () => {
      const { result } = renderHook(() => useEnlargedVideo());

      act(() => {
        pressKey("Escape");
      });

      expect(result.current.isEnlarged).toBe(false);
    });

    test("WHEN Escape is pressed after unmount THEN the listener is gone", () => {
      const { result, unmount } = renderHook(() => useEnlargedVideo());

      act(() => {
        result.current.toggle();
      });
      unmount();

      expect(() => {
        pressKey("Escape");
      }).not.toThrow();
    });
  });
});

function pressKey(key: string): void {
  document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
}

describe("useEnlargedVideo and the page behind it", () => {
  beforeEach(() => {
    document.body.style.overflow = "";
  });

  test("GIVEN the video is enlarged WHEN it fills the viewport THEN the page is still free to scroll", () => {
    // On an iPhone the browser toolbar hides only for a real scroll gesture on
    // the document, and that gesture passes through the pinned player. A lock
    // here is what kept the enlarged video wedged under Safari's toolbar.
    const { result } = renderHook(() => useEnlargedVideo());

    act(() => {
      result.current.toggle();
    });

    expect(document.body.style.overflow).toBe("");
  });

  test("GIVEN the page suppresses its own scrolling WHEN the video is enlarged THEN that value is left alone", () => {
    document.body.style.overflow = "clip";
    const { result } = renderHook(() => useEnlargedVideo());

    act(() => {
      result.current.toggle();
    });

    expect(document.body.style.overflow).toBe("clip");
  });
});

describe("useEnlargedVideo and where the page was", () => {
  const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

  beforeEach(() => {
    scrollTo.mockClear();
    pageScrolledTo(0);
  });

  test("GIVEN the page was scrolled WHEN the learner enters and leaves the mode THEN the page is put back where it was", () => {
    // Without a scroll lock, the swipe that hides Safari's toolbar moves the
    // page under the pinned player; back in the page, the learner expects the
    // player where they left it, not under the sticky header.
    const offsetAtEntry = faker.number.int({ min: 1, max: 1000 });
    pageScrolledTo(offsetAtEntry);
    const { result } = renderHook(() => useEnlargedVideo());

    act(() => {
      result.current.toggle();
    });
    pageScrolledTo(offsetAtEntry + faker.number.int({ min: 1, max: 1000 }));
    act(() => {
      result.current.exit();
    });

    expect(scrollTo).toHaveBeenCalledWith({ top: offsetAtEntry });
  });

  test("GIVEN the page was scrolled WHEN the control itself takes the learner out THEN the page is put back too", () => {
    const offsetAtEntry = faker.number.int({ min: 1, max: 1000 });
    pageScrolledTo(offsetAtEntry);
    const { result } = renderHook(() => useEnlargedVideo());

    act(() => {
      result.current.toggle();
    });
    pageScrolledTo(offsetAtEntry + faker.number.int({ min: 1, max: 1000 }));
    act(() => {
      result.current.toggle();
    });

    expect(scrollTo).toHaveBeenCalledWith({ top: offsetAtEntry });
  });

  test("GIVEN the mode was never entered WHEN exit is called THEN the page is not moved", () => {
    pageScrolledTo(faker.number.int({ min: 1, max: 1000 }));
    const { result } = renderHook(() => useEnlargedVideo());

    act(() => {
      result.current.exit();
    });

    expect(scrollTo).not.toHaveBeenCalled();
  });

  test("GIVEN the video is still enlarged WHEN the player unmounts THEN the page is not moved", () => {
    // An unmount mid-mode is a navigation; scrolling the next page to the
    // old offset would be wrong.
    pageScrolledTo(faker.number.int({ min: 1, max: 1000 }));
    const { result, unmount } = renderHook(() => useEnlargedVideo());

    act(() => {
      result.current.toggle();
    });
    unmount();

    expect(scrollTo).not.toHaveBeenCalled();
  });
});

function pageScrolledTo(offset: number): void {
  Object.defineProperty(window, "scrollY", { configurable: true, get: () => offset });
}

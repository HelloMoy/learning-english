import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";

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

  test("GIVEN the video is in the page WHEN nothing has happened THEN the page scrolls", () => {
    renderHook(() => useEnlargedVideo());

    expect(document.body.style.overflow).toBe("");
  });

  test("GIVEN the video is enlarged WHEN it fills the viewport THEN the page does not scroll", () => {
    const { result } = renderHook(() => useEnlargedVideo());

    act(() => {
      result.current.toggle();
    });

    expect(document.body.style.overflow).toBe("hidden");
  });

  test("GIVEN the video was enlarged WHEN the learner leaves the mode THEN the page scrolls again", () => {
    const { result } = renderHook(() => useEnlargedVideo());

    act(() => {
      result.current.toggle();
    });
    act(() => {
      result.current.exit();
    });

    expect(document.body.style.overflow).toBe("");
  });

  test("GIVEN the page already suppressed its own scrolling WHEN the mode ends THEN that value is restored", () => {
    document.body.style.overflow = "clip";
    const { result } = renderHook(() => useEnlargedVideo());

    act(() => {
      result.current.toggle();
    });
    act(() => {
      result.current.exit();
    });

    expect(document.body.style.overflow).toBe("clip");
  });

  test("GIVEN the video is still enlarged WHEN the player unmounts THEN the page is not left frozen", () => {
    const { result, unmount } = renderHook(() => useEnlargedVideo());

    act(() => {
      result.current.toggle();
    });
    unmount();

    expect(document.body.style.overflow).toBe("");
  });
});

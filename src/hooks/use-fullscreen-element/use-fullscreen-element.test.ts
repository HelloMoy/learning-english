import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";

import { useFullscreenElement } from "./use-fullscreen-element";

/**
 * jsdom has no Fullscreen API, so the element the browser would be presenting
 * is stood in for — which is all this hook reads.
 */
const presentFullscreen = (element: Element | null) => {
  Object.defineProperty(document, "fullscreenElement", {
    configurable: true,
    value: element,
  });
  act(() => {
    document.dispatchEvent(new Event("fullscreenchange"));
  });
};

afterEach(() => {
  presentFullscreen(null);
});

describe("useFullscreenElement", () => {
  test("WHEN nothing is presented THEN there is no fullscreen element", () => {
    const { result } = renderHook(() => useFullscreenElement());

    expect(result.current).toBeNull();
  });

  test("WHEN the learner enters fullscreen THEN the presented element is returned", () => {
    const player = document.createElement("div");
    document.body.append(player);
    const { result } = renderHook(() => useFullscreenElement());

    presentFullscreen(player);

    expect(result.current).toBe(player);
  });

  test("WHEN the learner leaves fullscreen THEN it reads as nothing presented again", () => {
    const player = document.createElement("div");
    document.body.append(player);
    const { result } = renderHook(() => useFullscreenElement());
    presentFullscreen(player);

    presentFullscreen(null);

    expect(result.current).toBeNull();
  });

  test("WHEN the page already opened in fullscreen THEN the element is read on mount", () => {
    const player = document.createElement("div");
    document.body.append(player);
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: player,
    });

    const { result } = renderHook(() => useFullscreenElement());

    expect(result.current).toBe(player);
  });

  test("WHEN the reader unmounts THEN it stops listening", () => {
    const player = document.createElement("div");
    document.body.append(player);
    const { result, unmount } = renderHook(() => useFullscreenElement());

    unmount();
    presentFullscreen(player);

    expect(result.current).toBeNull();
  });
});

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { useRouteRouter } from "./use-route-router";

const intlRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};
const currentPathname = vi.fn<() => string | null>();

vi.mock("@/i18n/intl-navigation", () => ({
  useRouter: () => intlRouter,
  usePathname: () => currentPathname(),
}));

function routerOn(pathname: string | null) {
  currentPathname.mockReturnValue(pathname);
  return renderHook(() => useRouteRouter()).result.current;
}

describe("useRouteRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GIVEN a route with a motion towards the destination", () => {
    test("WHEN pushing THEN the navigation carries the route pair's transition type", () => {
      routerOn("/start").push("/start/avatar");

      expect(intlRouter.push).toHaveBeenCalledWith("/start/avatar", {
        transitionTypes: ["route-slide-forward"],
      });
    });

    test("WHEN replacing THEN the navigation carries the route pair's transition type", () => {
      routerOn("/sign-in").replace("/learning");

      expect(intlRouter.replace).toHaveBeenCalledWith("/learning", {
        transitionTypes: ["route-sink"],
      });
    });

    test("WHEN the caller passes options THEN they reach next-intl alongside the type", () => {
      routerOn("/start").push("/start/avatar", { scroll: false });

      expect(intlRouter.push).toHaveBeenCalledWith("/start/avatar", {
        transitionTypes: ["route-slide-forward"],
        scroll: false,
      });
    });

    test("WHEN the caller names its own transition types THEN those win", () => {
      routerOn("/start").push("/start/avatar", { transitionTypes: ["route-fade"] });

      expect(intlRouter.push).toHaveBeenCalledWith("/start/avatar", {
        transitionTypes: ["route-fade"],
      });
    });
  });

  describe("GIVEN a navigation with no motion", () => {
    test("WHEN switching locale on the same route THEN only the caller's options are passed", () => {
      routerOn("/learning").replace("/learning", { locale: "es" });

      expect(intlRouter.replace).toHaveBeenCalledWith("/learning", { locale: "es" });
    });

    test("WHEN the current pathname is unknown THEN no transition type is added", () => {
      routerOn(null).push("/courses");

      expect(intlRouter.push).toHaveBeenCalledWith("/courses", {});
    });
  });

  describe("GIVEN the rest of the router", () => {
    test("WHEN refreshing THEN the call goes straight to next-intl's router", () => {
      routerOn("/learning").refresh();

      expect(intlRouter.refresh).toHaveBeenCalledTimes(1);
    });

    test("WHEN the hook re-renders on the same route THEN the router keeps its identity", () => {
      currentPathname.mockReturnValue("/learning");
      const { result, rerender } = renderHook(() => useRouteRouter());
      const firstRouter = result.current;

      rerender();

      expect(result.current).toBe(firstRouter);
    });
  });
});

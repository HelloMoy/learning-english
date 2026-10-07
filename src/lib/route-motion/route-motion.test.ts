import { describe, expect, test } from "vitest";

import {
  ROUTE_MOTIONS,
  routeMotion,
  routeTransitionType,
  routeTransitionTypes,
} from "./route-motion";

const ABOUT = "/courses/basic-course/about";
const PROGRESS = "/courses/basic-course/progress";
const MODULE = "/courses/basic-course/modules/vowels";
const LESSON = "/courses/basic-course/modules/vowels/lessons/video-6";
const NEXT_LESSON = "/courses/basic-course/modules/vowels/lessons/video-7";

describe("routeMotion", () => {
  describe("GIVEN two sections", () => {
    test.each([
      ["/", "/learning"],
      ["/learning", "/courses"],
      ["/courses", "/achievements"],
      ["/achievements", "/profile"],
      ["/", "/profile"],
    ])("WHEN going from %s to the later %s THEN it slides forward", (from, to) => {
      expect(routeMotion(from, to)).toBe("slide-forward");
    });

    test.each([
      ["/achievements", "/learning"],
      ["/profile", "/courses"],
      ["/learning", "/"],
    ])("WHEN going from %s to the earlier %s THEN it slides back", (from, to) => {
      expect(routeMotion(from, to)).toBe("slide-back");
    });
  });

  describe("GIVEN a route one or more levels deeper", () => {
    test.each([
      ["/courses", ABOUT],
      ["/learning", PROGRESS],
      [PROGRESS, MODULE],
      [ABOUT, MODULE],
      [MODULE, LESSON],
      ["/learning", LESSON],
      ["/courses", LESSON],
    ])("WHEN going from %s to %s THEN it goes in", (from, to) => {
      expect(routeMotion(from, to)).toBe("depth-in");
    });
  });

  describe("GIVEN a route one or more levels shallower", () => {
    test.each([
      [LESSON, MODULE],
      [LESSON, PROGRESS],
      [MODULE, PROGRESS],
      [PROGRESS, "/courses"],
      [ABOUT, "/courses"],
      [LESSON, "/learning"],
    ])("WHEN going from %s to %s THEN it comes out", (from, to) => {
      expect(routeMotion(from, to)).toBe("depth-out");
    });
  });

  describe("GIVEN two routes on the same level", () => {
    test("WHEN going from course details to course progress THEN it slides forward", () => {
      expect(routeMotion(ABOUT, PROGRESS)).toBe("slide-forward");
    });

    test("WHEN going from course progress to course details THEN it slides back", () => {
      expect(routeMotion(PROGRESS, ABOUT)).toBe("slide-back");
    });

    test("WHEN going from one lesson to another THEN it slides forward", () => {
      expect(routeMotion(LESSON, NEXT_LESSON)).toBe("slide-forward");
    });

    test("WHEN going from one module to another THEN it slides forward", () => {
      expect(routeMotion(MODULE, "/courses/basic-course/modules/consonants")).toBe("slide-forward");
    });
  });

  describe("GIVEN the onboarding steps", () => {
    test.each([
      ["/start", "/start/avatar"],
      ["/start/avatar", "/start/first-course"],
      ["/sign-up", "/start"],
      ["/learning", "/start/first-course"],
    ])("WHEN going from %s to %s THEN it slides forward", (from, to) => {
      expect(routeMotion(from, to)).toBe("slide-forward");
    });

    test.each([
      ["/start/avatar", "/start"],
      ["/start/first-course", "/start/avatar"],
    ])("WHEN going from %s back to %s THEN it slides back", (from, to) => {
      expect(routeMotion(from, to)).toBe("slide-back");
    });
  });

  describe("GIVEN the account pages", () => {
    test.each([
      ["/sign-in", "/forgot-password"],
      ["/forgot-password", "/reset-password"],
      ["/reset-password", "/sign-in"],
      ["/sign-in", "/sign-up"],
    ])("WHEN going from %s to %s THEN it slides forward", (from, to) => {
      expect(routeMotion(from, to)).toBe("slide-forward");
    });

    test.each([
      ["/", "/sign-in"],
      ["/profile", "/account-deleted"],
      [LESSON, "/sign-in"],
    ])("WHEN entering %s → %s from outside the account pages THEN it rises", (from, to) => {
      expect(routeMotion(from, to)).toBe("rise");
    });

    test.each([
      ["/sign-in", "/learning"],
      ["/account-deleted", "/"],
      ["/start/first-course", LESSON],
      ["/start/first-course", "/courses"],
    ])("WHEN leaving %s for %s THEN it sinks", (from, to) => {
      expect(routeMotion(from, to)).toBe("sink");
    });
  });

  describe("GIVEN an unplaced route on either side", () => {
    test.each([
      ["/profile", "/privacy"],
      ["/privacy", "/terms"],
      ["/terms", "/learning"],
      ["/privacy", "/sign-up"],
      ["/sign-in", "/terms"],
      ["/cursos", "/courses"],
      ["/courses/basic-course", "/courses"],
    ])("WHEN going from %s to %s THEN it fades", (from, to) => {
      expect(routeMotion(from, to)).toBe("fade");
    });
  });

  describe("GIVEN the same route on both sides", () => {
    test.each([
      ["/learning", "/learning"],
      ["/sign-in", "/sign-in?reset=done"],
      [LESSON, `${LESSON}#notes`],
      ["/privacy", "/privacy"],
      ["/es/courses", "/courses"],
    ])("WHEN going from %s to %s THEN there is no motion", (from, to) => {
      expect(routeMotion(from, to)).toBe("none");
    });
  });

  describe("GIVEN paths that carry more than the route", () => {
    test.each([
      ["a locale prefix", "/es/learning", "/es/courses"],
      ["a locale prefix on one side only", "/pt/learning", "/courses"],
      ["a query string", "/learning?from=email", "/courses?level=1"],
      ["a hash", "/learning#top", "/courses#atlas"],
      ["a trailing slash", "/learning/", "/courses/"],
    ])("WHEN the paths have %s THEN the motion is unchanged", (_, from, to) => {
      expect(routeMotion(from, to)).toBe("slide-forward");
    });

    test("WHEN the path is only a locale THEN it is the home section", () => {
      expect(routeMotion("/es", "/es/learning")).toBe("slide-forward");
    });
  });
});

describe("routeTransitionTypes", () => {
  test.each(ROUTE_MOTIONS)(
    "WHEN the motion is %s THEN the type is that motion, prefixed",
    (motion) => {
      expect(routeTransitionType(motion)).toBe(`route-${motion}`);
    },
  );

  test("WHEN the routes have a motion THEN its type is the only one", () => {
    expect(routeTransitionTypes("/learning", "/courses")).toEqual(["route-slide-forward"]);
  });

  test("WHEN the routes are the same THEN there are no types", () => {
    expect(routeTransitionTypes("/learning", "/learning")).toEqual([]);
  });

  test("WHEN the destination is an href object THEN its pathname decides", () => {
    const href = { pathname: "/courses", query: { level: "1" } };

    expect(routeTransitionTypes("/learning", href)).toEqual(["route-slide-forward"]);
  });

  test.each([
    ["an external URL", "https://example.com/courses"],
    ["a protocol-relative URL", "//example.com/courses"],
    ["a mail link", "mailto:hello@example.com"],
    ["only a hash", "#notes"],
    ["only a query string", "?level=1"],
    ["an href object without a pathname", { pathname: null }],
  ])("WHEN the destination is %s THEN there are no types", (_, href) => {
    expect(routeTransitionTypes("/learning", href)).toEqual([]);
  });

  test.each([
    ["the current pathname", null, "/courses"],
    ["the destination", "/learning", undefined],
  ])("WHEN %s is unknown THEN there are no types", (_, from, to) => {
    expect(routeTransitionTypes(from, to)).toEqual([]);
  });
});

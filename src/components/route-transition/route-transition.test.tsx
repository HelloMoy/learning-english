import { ROUTE_MOTIONS, routeTransitionType } from "@/lib/route-motion/route-motion";

import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { RouteTransition } from "./route-transition";

type BoundaryProps = {
  update: Record<string, string>;
  default: string;
  children: ReactNode;
};

const react = vi.hoisted(() => ({ hasViewTransition: false }));

function ViewTransitionProbe({ update, default: defaultClass, children }: BoundaryProps) {
  return (
    <div
      data-testid="view-transition"
      data-update={JSON.stringify(update)}
      data-default={defaultClass}
    >
      {children}
    </div>
  );
}

/**
 * The React installed for tests has no `ViewTransition`; the canary Next
 * bundles does. The getter lets one file render the component against both.
 */
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    get ViewTransition() {
      return react.hasViewTransition ? ViewTransitionProbe : undefined;
    },
  };
});

function renderPage() {
  const pageCopy = faker.lorem.sentence();
  render(
    <RouteTransition>
      <p>{pageCopy}</p>
    </RouteTransition>,
  );
  return screen.getByText(pageCopy);
}

describe("RouteTransition", () => {
  beforeEach(() => {
    react.hasViewTransition = false;
  });

  describe("GIVEN a React without ViewTransition", () => {
    test("WHEN rendered THEN the page sits in the column that pins the footer", () => {
      const page = renderPage();

      expect(page.parentElement).toHaveClass("flex", "flex-1", "flex-col");
      expect(screen.queryByTestId("view-transition")).not.toBeInTheDocument();
    });
  });

  describe("GIVEN a React with ViewTransition", () => {
    beforeEach(() => {
      react.hasViewTransition = true;
    });

    test("WHEN rendered THEN the same column is the boundary's only child", () => {
      const page = renderPage();

      const boundary = screen.getByTestId("view-transition");
      expect(boundary.children).toHaveLength(1);
      expect(boundary.firstElementChild).toBe(page.parentElement);
      expect(page.parentElement).toHaveClass("flex", "flex-1", "flex-col");
    });

    test.each(ROUTE_MOTIONS)(
      "WHEN a %s navigation updates it THEN it plays that motion's class",
      (motion) => {
        renderPage();

        const update = JSON.parse(screen.getByTestId("view-transition").dataset.update ?? "{}");
        expect(update[routeTransitionType(motion)]).toBe(routeTransitionType(motion));
      },
    );

    test("WHEN an untyped transition updates it THEN nothing plays", () => {
      renderPage();

      const boundary = screen.getByTestId("view-transition");
      expect(JSON.parse(boundary.dataset.update ?? "{}").default).toBe("none");
      expect(boundary).toHaveAttribute("data-default", "none");
    });
  });
});

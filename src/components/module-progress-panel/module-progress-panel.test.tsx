import type { ModuleRouteReading } from "@/hooks/use-module-route/use-module-route";

import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ModuleProgressPanel } from "./module-progress-panel";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
  useFormatter: () => ({ number: (value: number) => `${Math.round(value * 100)}%` }),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const key = (name: string, values?: Record<string, unknown>): string =>
  values ? `${name}:${JSON.stringify(values)}` : name;

const readRoute = (
  finishedCount: number,
  lessonCount: number,
  secondsLeft: number,
): ModuleRouteReading => ({
  isRead: true,
  route: { steps: [], finishedCount, lessonCount, secondsLeft },
});

beforeEach(() => {
  mockUseTranslations.mockImplementation(() => key as never);
});

describe("ModuleProgressPanel", () => {
  describe("GIVEN 5 of 17 videos finished with 98 minutes left", () => {
    test("WHEN it renders THEN it states the percentage, the count and the time left", () => {
      render(<ModuleProgressPanel reading={readRoute(5, 17, 98 * 60)} />);

      expect(screen.getByText("29%")).toBeInTheDocument();
      expect(
        screen.getByText(key("videosFinished", { finished: 5, total: 17 })),
      ).toBeInTheDocument();
      expect(
        screen.getByText(key("timeLeft", { runtime: key("runtime", { hours: 1, minutes: 38 }) })),
      ).toBeInTheDocument();
    });

    test("WHEN it renders THEN the ring is decorative", () => {
      const { container } = render(<ModuleProgressPanel reading={readRoute(5, 17, 98 * 60)} />);

      expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("GIVEN every video finished", () => {
    test("WHEN it renders THEN it says the lesson is completed and states no time left", () => {
      render(<ModuleProgressPanel reading={readRoute(17, 17, 0)} />);

      expect(screen.getByText("100%")).toBeInTheDocument();
      expect(screen.getByText("moduleCompleted")).toBeInTheDocument();
      expect(screen.queryByText(/^timeLeft/)).toBeNull();
      expect(screen.queryByText(/^videosFinished/)).toBeNull();
    });
  });

  describe("GIVEN a prize row handed to the panel", () => {
    test("WHEN it renders THEN the prize row sits below the figures, inside the panel", () => {
      render(
        <ModuleProgressPanel reading={readRoute(5, 17, 98 * 60)}>
          <p>prize row</p>
        </ModuleProgressPanel>,
      );

      const panel = screen.getByRole("region", { name: "progressHeading" });
      const figures = screen.getByText(key("videosFinished", { finished: 5, total: 17 }));
      const prizeRow = screen.getByText("prize row");
      expect(panel).toContainElement(prizeRow);
      expect(figures.compareDocumentPosition(prizeRow)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });
  });

  describe("GIVEN progress not read yet", () => {
    test("WHEN it renders THEN it shows its heading and no figures", () => {
      render(<ModuleProgressPanel reading={{ isRead: false }} />);

      expect(screen.getByText("progressHeading")).toBeInTheDocument();
      expect(screen.queryByText(/%$/)).toBeNull();
      expect(screen.queryByText(/^videosFinished/)).toBeNull();
      expect(screen.queryByText(/^timeLeft/)).toBeNull();
    });
  });
});

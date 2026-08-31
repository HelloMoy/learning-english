import { stubElementGeometry, type ElementGeometryStub } from "@/test-setup/stubs/element-geometry";

import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { useScrollCurrentIntoView } from "./use-scroll-current-into-view";

// A 600px-tall region over 2600px of content: it can scroll 2000px. The
// current row sits 1000px down and is 40px tall, so centring it lands on
// 1000 - (600 - 40) / 2 = 720.
const REGION_HEIGHT = 600;
const REGION_SCROLL_HEIGHT = 2600;
const CURRENT_ROW_TOP = 1000;
const CURRENT_ROW_HEIGHT = 40;
const CENTERED_OFFSET = 720;

let geometry: ElementGeometryStub;

beforeEach(() => {
  geometry = stubElementGeometry();
});

afterEach(() => {
  geometry.restore();
});

function Outline({ isActive, hasCurrentRow }: { isActive: boolean; hasCurrentRow: boolean }) {
  const regionRef = useScrollCurrentIntoView<HTMLDivElement>(isActive);
  return (
    <div
      ref={regionRef}
      data-testid="region"
      data-top="0"
      data-height={REGION_HEIGHT}
      data-scroll-height={REGION_SCROLL_HEIGHT}
    >
      <a
        // A fragment, not a route: the hook resolves the row by attribute,
        // and an in-app path here would be a job for next/link.
        href="#exercise-2"
        aria-current={hasCurrentRow ? "page" : undefined}
        data-top={CURRENT_ROW_TOP}
        data-height={CURRENT_ROW_HEIGHT}
      >
        Exercise 2
      </a>
    </div>
  );
}

describe("useScrollCurrentIntoView", () => {
  describe("GIVEN an active region holding the current row", () => {
    test("WHEN it mounts THEN the region is scrolled so the row is centred", () => {
      const { getByTestId } = render(
        <Outline
          isActive
          hasCurrentRow
        />,
      );

      expect(geometry.scrollTopWrites).toHaveLength(1);
      expect(geometry.scrollTopWrites[0]?.element).toBe(getByTestId("region"));
      expect(geometry.scrollTopWrites[0]?.value).toBe(CENTERED_OFFSET);
    });
  });

  describe("GIVEN a region with no row marked current", () => {
    test("WHEN it mounts THEN the region is left where it is", () => {
      render(
        <Outline
          isActive
          hasCurrentRow={false}
        />,
      );

      expect(geometry.scrollTopWrites).toHaveLength(0);
    });
  });

  describe("GIVEN a region that is not active yet", () => {
    test("WHEN it mounts inactive THEN nothing is scrolled", () => {
      render(
        <Outline
          isActive={false}
          hasCurrentRow
        />,
      );

      expect(geometry.scrollTopWrites).toHaveLength(0);
    });

    test("WHEN it becomes active THEN the region is scrolled to the centred offset", () => {
      const { rerender } = render(
        <Outline
          isActive={false}
          hasCurrentRow
        />,
      );

      rerender(
        <Outline
          isActive
          hasCurrentRow
        />,
      );

      expect(geometry.scrollTopWrites).toHaveLength(1);
      expect(geometry.scrollTopWrites[0]?.value).toBe(CENTERED_OFFSET);
    });
  });
});

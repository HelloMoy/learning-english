import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { AccountWait } from "./account-wait";

describe("AccountWait", () => {
  describe("GIVEN no request is in flight", () => {
    test("WHEN the surface renders THEN its children are there and no beam is", () => {
      // Arrange
      const body = faker.word.words(3);

      // Act
      render(<AccountWait busy={false}>{body}</AccountWait>);

      // Assert
      expect(screen.getByText(body)).toBeInTheDocument();
      expect(screen.queryByTestId("account-wait-beam")).not.toBeInTheDocument();
    });
  });

  describe("GIVEN a request is in flight", () => {
    test("WHEN the surface renders THEN the beam crosses it, carrying the animated class", () => {
      // Arrange
      const body = faker.word.words(3);

      // Act
      render(<AccountWait busy>{body}</AccountWait>);

      // Assert
      const beam = screen.getByTestId("account-wait-beam");
      expect(beam).toHaveClass("account-wait-beam");
      expect(screen.getByText(body)).toBeInTheDocument();
    });

    test("WHEN assistive technology reads the surface THEN the beam is hidden from it", () => {
      // Arrange + Act
      render(<AccountWait busy>{faker.word.words(3)}</AccountWait>);

      // Assert
      expect(screen.getByTestId("account-wait-beam")).toHaveAttribute("aria-hidden", "true");
    });

    test("WHEN the beam renders THEN it is pinned to the top edge of the surface", () => {
      // Arrange + Act
      render(<AccountWait busy>{faker.word.words(3)}</AccountWait>);

      // Assert
      const beam = screen.getByTestId("account-wait-beam");
      expect(beam).toHaveClass("absolute");
      expect(beam).toHaveClass("top-0");
    });
  });
});

describe("AccountWait.Paused", () => {
  const withFields = (busy: boolean, label: string) => (
    <AccountWait busy={busy}>
      <AccountWait.Paused>
        <label>
          {label}
          <input defaultValue="" />
        </label>
      </AccountWait.Paused>
    </AccountWait>
  );

  describe("GIVEN no request is in flight", () => {
    test("WHEN the region renders THEN it is live and undimmed", () => {
      // Arrange
      const label = faker.word.noun();

      // Act
      render(withFields(false, label));

      // Assert
      const region = screen.getByTestId("account-wait-paused");
      expect(region).not.toHaveAttribute("inert");
      expect(region).toHaveAttribute("data-state", "live");
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    });
  });

  describe("GIVEN a request is in flight", () => {
    test("WHEN the region renders THEN it is inert, so nothing inside can be reached", () => {
      // Arrange + Act
      render(withFields(true, faker.word.noun()));

      // Assert
      const region = screen.getByTestId("account-wait-paused");
      expect(region).toHaveAttribute("inert");
      expect(region).toHaveAttribute("data-state", "paused");
    });

    test("WHEN the region renders THEN it is dimmed", () => {
      // Arrange + Act
      render(withFields(true, faker.word.noun()));

      // Assert
      expect(screen.getByTestId("account-wait-paused")).toHaveClass("opacity-45");
    });

    test("WHEN the wait starts and ends THEN the learner's typing was never unmounted", async () => {
      // Arrange
      const label = faker.word.noun();
      const typed = faker.internet.email();
      const { rerender } = render(withFields(false, label));
      const field = screen.getByLabelText(label);
      (field as HTMLInputElement).value = typed;

      // Act
      rerender(withFields(true, label));
      const during = screen.getByLabelText(label);
      rerender(withFields(false, label));

      // Assert
      expect(during).toBe(field);
      expect(screen.getByLabelText(label)).toHaveValue(typed);
    });

    test("WHEN a caller supplies layout classes THEN they join the region's own", () => {
      // Arrange + Act
      render(
        <AccountWait busy>
          <AccountWait.Paused className="flex flex-col gap-4">
            {faker.word.noun()}
          </AccountWait.Paused>
        </AccountWait>,
      );

      // Assert
      const region = screen.getByTestId("account-wait-paused");
      expect(region).toHaveClass("gap-4");
      expect(region).toHaveClass("opacity-45");
    });
  });
});

describe("AccountWait.Status", () => {
  const withStatus = (busy: boolean, sentence: string) => (
    <AccountWait busy={busy}>
      <AccountWait.Paused>
        <input aria-label="email" />
      </AccountWait.Paused>
      <button type="submit">submit</button>
      <AccountWait.Status>{sentence}</AccountWait.Status>
    </AccountWait>
  );

  describe("GIVEN no request is in flight", () => {
    test("WHEN the surface renders THEN the live region is already there, and empty", () => {
      // Arrange + Act
      render(withStatus(false, faker.word.words(3)));

      // Assert
      const live = screen.getByRole("status");
      expect(live).toBeEmptyDOMElement();
      expect(live).toHaveClass("sr-only");
    });

    test("WHEN the surface renders THEN no visible status line is shown", () => {
      // Arrange + Act
      const sentence = faker.word.words(3);
      render(withStatus(false, sentence));

      // Assert
      expect(screen.queryByTestId("account-wait-status")).not.toBeInTheDocument();
      expect(screen.queryByText(sentence)).not.toBeInTheDocument();
    });
  });

  describe("GIVEN a request is in flight", () => {
    test("WHEN the wait starts THEN the sentence fills the live region that was already mounted", () => {
      // Arrange
      const sentence = faker.word.words(3);
      const { rerender } = render(withStatus(false, sentence));
      const liveBeforeTheWait = screen.getByRole("status");

      // Act
      rerender(withStatus(true, sentence));

      // Assert
      const live = screen.getByRole("status");
      expect(live).toBe(liveBeforeTheWait);
      expect(live).toHaveTextContent(sentence);
    });

    test("WHEN the wait is on THEN the same sentence is shown visibly, hidden from assistive technology", () => {
      // Arrange
      const sentence = faker.word.words(3);

      // Act
      render(withStatus(true, sentence));

      // Assert
      const visible = screen.getByTestId("account-wait-status");
      expect(visible).toHaveTextContent(sentence);
      expect(visible).toHaveAttribute("aria-hidden", "true");
    });

    test("WHEN the surface re-renders while still waiting THEN the announcement does not change", () => {
      // Arrange
      const sentence = faker.word.words(3);
      const { rerender } = render(withStatus(true, sentence));

      // Act
      rerender(withStatus(true, sentence));

      // Assert
      expect(screen.getByRole("status")).toHaveTextContent(sentence);
    });
  });

  describe("GIVEN assistive technology reads a waiting surface", () => {
    test("WHEN every part is mounted together THEN the surface speaks with exactly one voice", () => {
      // Arrange + Act
      render(withStatus(true, faker.word.words(3)));

      // Assert
      expect(screen.getAllByRole("status")).toHaveLength(1);
    });

    test("WHEN the surface is idle THEN it still exposes exactly one live region", () => {
      // Arrange + Act
      render(withStatus(false, faker.word.words(3)));

      // Assert
      expect(screen.getAllByRole("status")).toHaveLength(1);
    });

    test("WHEN a notice carries its own status role THEN the paused region is what silences it", () => {
      // Arrange
      const notice = faker.word.words(4);

      // Act
      render(
        <AccountWait busy>
          <AccountWait.Paused>
            <p role="status">{notice}</p>
          </AccountWait.Paused>
          <AccountWait.Status>{faker.word.words(3)}</AccountWait.Status>
        </AccountWait>,
      );

      // Assert — jsdom does not apply `inert` to the accessibility tree, so this
      // asserts the structure a browser acts on: the notice is inside the inert
      // subtree, and exactly one live region is left outside it.
      const paused = screen.getByTestId("account-wait-paused");
      expect(paused).toHaveAttribute("inert");
      expect(paused).toContainElement(screen.getByText(notice));
      expect(
        screen.getAllByRole("status").filter((region) => !paused.contains(region)),
      ).toHaveLength(1);
    });
  });
});

import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { PendingButton } from "./pending-button";

const labels = () => ({
  label: faker.word.words(2),
  pendingLabel: faker.word.words(3),
});

describe("PendingButton", () => {
  describe("GIVEN no request is in flight", () => {
    test("WHEN the button renders THEN it offers its ordinary label and no arc", () => {
      // Arrange
      const { label, pendingLabel } = labels();

      // Act
      render(
        <PendingButton
          isPending={false}
          label={label}
          pendingLabel={pendingLabel}
        />,
      );

      // Assert
      expect(screen.getByRole("button", { name: label })).toBeEnabled();
      expect(screen.queryByText(pendingLabel)).not.toBeInTheDocument();
      expect(screen.queryByTestId("spinner-arc")).not.toBeInTheDocument();
    });

    test("WHEN the caller disables it for its own reasons THEN it stays disabled", () => {
      // Arrange
      const { label, pendingLabel } = labels();

      // Act
      render(
        <PendingButton
          isPending={false}
          disabled
          label={label}
          pendingLabel={pendingLabel}
        />,
      );

      // Assert
      const button = screen.getByRole("button", { name: label });
      expect(button).toBeDisabled();
      expect(button).not.toHaveClass("disabled:opacity-100");
    });
  });

  describe("GIVEN a request is in flight", () => {
    test("WHEN the button renders THEN it swaps to the pending label and turns the arc", () => {
      // Arrange
      const { label, pendingLabel } = labels();

      // Act
      render(
        <PendingButton
          isPending
          label={label}
          pendingLabel={pendingLabel}
        />,
      );

      // Assert
      expect(screen.getByText(pendingLabel)).toBeInTheDocument();
      expect(screen.queryByText(label)).not.toBeInTheDocument();
      expect(screen.getByTestId("spinner-arc")).toBeInTheDocument();
    });

    test("WHEN the button renders THEN it is disabled, so a second press sends nothing", async () => {
      // Arrange
      const user = userEvent.setup();
      const onClick = vi.fn();
      const { label, pendingLabel } = labels();
      render(
        <PendingButton
          isPending
          onClick={onClick}
          label={label}
          pendingLabel={pendingLabel}
        />,
      );

      // Act
      await user.click(screen.getByRole("button"));

      // Assert
      expect(screen.getByRole("button")).toBeDisabled();
      expect(onClick).not.toHaveBeenCalled();
    });

    test("WHEN the button renders THEN it keeps its full ink, so the arc and the label stay legible", () => {
      // Arrange
      const { label, pendingLabel } = labels();

      // Act
      render(
        <PendingButton
          isPending
          label={label}
          pendingLabel={pendingLabel}
        />,
      );

      // Assert — `Button` dims anything disabled; a button that is disabled
      // because it is working is not the same as one that cannot be pressed yet
      expect(screen.getByRole("button")).toHaveClass("disabled:opacity-100");
    });

    test("WHEN assistive technology reads the button THEN its name is the pending label alone", () => {
      // Arrange
      const { label, pendingLabel } = labels();

      // Act
      render(
        <PendingButton
          isPending
          label={label}
          pendingLabel={pendingLabel}
        />,
      );

      // Assert
      expect(screen.getByRole("button", { name: pendingLabel })).toBeInTheDocument();
    });
  });

  describe("GIVEN a caller that is not a form's submit button", () => {
    test("WHEN it passes button props THEN they reach the underlying button", async () => {
      // Arrange
      const user = userEvent.setup();
      const onClick = vi.fn();
      const { label, pendingLabel } = labels();
      render(
        <PendingButton
          isPending={false}
          type="button"
          variant="destructive"
          onClick={onClick}
          label={label}
          pendingLabel={pendingLabel}
        />,
      );

      // Act
      const button = screen.getByRole("button", { name: label });
      await user.click(button);

      // Assert
      expect(button).toHaveAttribute("type", "button");
      expect(button).toHaveAttribute("data-variant", "destructive");
      expect(onClick).toHaveBeenCalledOnce();
    });
  });
});

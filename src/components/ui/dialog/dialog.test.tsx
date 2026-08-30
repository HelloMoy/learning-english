import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const OpenDialog = ({
  onOpenChange,
  showCloseButton,
}: {
  onOpenChange?: (open: boolean) => void;
  showCloseButton?: boolean;
}) => (
  <Dialog
    open
    onOpenChange={onOpenChange}
  >
    <DialogContent showCloseButton={showCloseButton}>
      <DialogHeader>
        <DialogTitle>Resume playback</DialogTitle>
        <DialogDescription>Pick up where you left off.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose>Dismiss</DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

describe("Dialog", () => {
  beforeEach(() => {
    // Echo the key so assertions stay decoupled from real translated copy.
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
  });

  describe("GIVEN the module's public surface", () => {
    test("WHEN imported THEN every shadcn Dialog part is exported", () => {
      const parts = [
        Dialog,
        DialogClose,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogOverlay,
        DialogPortal,
        DialogTitle,
        DialogTrigger,
      ];

      for (const part of parts) {
        expect(part).toBeDefined();
      }
    });
  });

  describe("GIVEN an open dialog", () => {
    test("WHEN rendered THEN the overlay and content are portalled outside the caller's container", () => {
      const { container } = render(<OpenDialog />);

      const overlay = document.querySelector('[data-slot="dialog-overlay"]');
      const content = document.querySelector('[data-slot="dialog-content"]');

      expect(overlay).toBeInTheDocument();
      expect(content).toBeInTheDocument();
      expect(container).not.toContainElement(overlay as HTMLElement);
      expect(container).not.toContainElement(content as HTMLElement);
    });

    test("WHEN rendered THEN the content is a dialog named by its title", () => {
      render(<OpenDialog />);

      const dialog = screen.getByRole("dialog", { name: "Resume playback" });

      expect(dialog).toHaveAttribute("data-slot", "dialog-content");
    });

    // Radix enforces modality by hiding the rest of the document rather than by
    // setting `aria-modal` — see design.md §D1b for why that is the stronger
    // of the two techniques.
    test("WHEN rendered THEN everything outside the dialog is hidden from assistive technology", () => {
      render(<OpenDialog />);

      const dialog = screen.getByRole("dialog");
      const background = [...document.body.children].filter((child) => !child.contains(dialog));

      expect(background.length).toBeGreaterThan(0);
      for (const element of background) {
        expect(element).toHaveAttribute("aria-hidden", "true");
      }
      expect(dialog).not.toHaveAttribute("aria-hidden");
    });

    test("WHEN rendered THEN the description is wired to the dialog", () => {
      render(<OpenDialog />);

      const description = screen.getByText("Pick up where you left off.");

      expect(description).toHaveAttribute("data-slot", "dialog-description");
      expect(screen.getByRole("dialog")).toHaveAttribute(
        "aria-describedby",
        description.getAttribute("id"),
      );
    });
  });

  describe("GIVEN an open dialog the learner wants to leave", () => {
    test("WHEN Escape is pressed THEN onOpenChange is called with false", async () => {
      const onOpenChange = vi.fn();
      const user = userEvent.setup();

      render(<OpenDialog onOpenChange={onOpenChange} />);
      await user.keyboard("{Escape}");

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    test("WHEN the overlay is clicked THEN onOpenChange is called with false", async () => {
      const onOpenChange = vi.fn();
      const user = userEvent.setup();

      render(<OpenDialog onOpenChange={onOpenChange} />);
      const overlay = document.querySelector('[data-slot="dialog-overlay"]') as HTMLElement;
      await user.click(overlay);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    test("WHEN the close button is clicked THEN onOpenChange is called with false", async () => {
      const onOpenChange = vi.fn();
      const user = userEvent.setup();

      render(<OpenDialog onOpenChange={onOpenChange} />);
      await user.click(screen.getByRole("button", { name: "closeLabel" }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("GIVEN the default close affordance", () => {
    test("WHEN rendered THEN its accessible name comes from the Components.Dialog namespace", () => {
      render(<OpenDialog />);

      expect(mockUseTranslations).toHaveBeenCalledWith("Components.Dialog");
      expect(screen.getByRole("button", { name: "closeLabel" })).toBeInTheDocument();
    });

    test("WHEN showCloseButton is false THEN no close button is rendered", () => {
      render(<OpenDialog showCloseButton={false} />);

      expect(screen.queryByRole("button", { name: "closeLabel" })).not.toBeInTheDocument();
    });
  });

  describe("GIVEN the project's theming contract", () => {
    test("WHEN the content renders THEN it uses token-backed surface utilities", () => {
      render(<OpenDialog />);

      const dialog = screen.getByRole("dialog");

      expect(dialog).toHaveClass("bg-card");
      expect(dialog).toHaveClass("border-border");
      expect(dialog).toHaveClass("text-card-foreground");
    });

    // A `position: fixed` card taller than the viewport cannot be scrolled to,
    // so without a cap its footer — and the primary action in it — is
    // unreachable. Verified in the browser at a 300px-tall viewport.
    test("WHEN the content renders THEN it is capped to the viewport and scrolls internally", () => {
      render(<OpenDialog />);

      const dialog = screen.getByRole("dialog");

      expect(dialog).toHaveClass("max-h-[calc(100svh-2rem)]");
      expect(dialog).toHaveClass("overflow-y-auto");
    });
  });

  describe("GIVEN a closed dialog", () => {
    test("WHEN open is false THEN nothing is rendered in the document", () => {
      render(
        <Dialog open={false}>
          <DialogContent>
            <DialogTitle>Resume playback</DialogTitle>
            <DialogDescription>Pick up where you left off.</DialogDescription>
          </DialogContent>
        </Dialog>,
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});

import "@testing-library/jest-dom/vitest";

import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { InstallPromptArt } from "./install-prompt-art";

describe("InstallPromptArt", () => {
  describe("GIVEN a prompt that would otherwise only show its own icon", () => {
    test("WHEN drawn for a handheld THEN it is the home screen", () => {
      // The Safari guides all end on this frame: a guide that stops at the
      // confirmation asks for effort and never shows the payoff.
      const { container } = render(<InstallPromptArt surface="handheld" />);

      expect(container.querySelector('[data-slot="home-screen"]')).toBeInTheDocument();
      expect(container.querySelector('[data-slot="app-switcher"]')).not.toBeInTheDocument();
    });

    test("WHEN drawn for a desktop THEN it is the application switcher", () => {
      // Presence among apps is a claim the learner can check; the absence of
      // tabs is not visible until afterwards.
      const { container } = render(<InstallPromptArt surface="desktop" />);

      expect(container.querySelector('[data-slot="app-switcher"]')).toBeInTheDocument();
      expect(container.querySelector('[data-slot="home-screen"]')).not.toBeInTheDocument();
    });

    test.each(["handheld", "desktop"] as const)(
      "WHEN drawn for a %s THEN the course's own icon is in it",
      (surface) => {
        const { container } = render(<InstallPromptArt surface={surface} />);

        expect(container.querySelector('[data-slot="app-icon"]')).toBeInTheDocument();
      },
    );

    test.each(["handheld", "desktop"] as const)(
      "WHEN drawn for a %s THEN it is hidden from assistive technology",
      (surface) => {
        // It repeats what the prompt's text already says.
        const { container } = render(<InstallPromptArt surface={surface} />);

        expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
      },
    );

    test.each(["handheld", "desktop"] as const)(
      "WHEN drawn for a %s THEN it contributes no text",
      (surface) => {
        const { container } = render(<InstallPromptArt surface={surface} />);

        expect(container.textContent?.trim()).toBe("");
      },
    );
  });
});

import { vowelsModule } from "@/components/module-route/module-route.fixtures";
import type { ModulePrizeDetails } from "@/hooks/use-module-prize/use-module-prize";
import { renderInLocale } from "@/test-setup/render-in-locale";

import { screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { ModulePrize } from "./module-prize";

const VISIBLE_ONLY = "[aria-hidden='true'] *, [aria-hidden='true']";

/** Claim prize is a secondary text link, like the lesson page's Unmark — never a button. */
const expectTextLink = (link: HTMLElement): void => {
  expect(link).toHaveClass("underline", "text-muted-foreground");
  expect(link.className).not.toMatch(/\bbg-/);
};

const vowelsPrize = (overrides: Partial<ModulePrizeDetails> = {}): ModulePrizeDetails => ({
  hasPrize: true,
  prize: "harmonica",
  state: "collecting",
  ticketsEarned: 11,
  ticketCount: 17,
  ...overrides,
});

describe("ModulePrize", () => {
  describe("GIVEN the panel layout", () => {
    test("WHEN tickets are still being collected THEN the prize stays a silhouette, unnamed, with its tickets and what is left", () => {
      const { container } = renderInLocale(
        <ModulePrize
          module={vowelsModule}
          prize={vowelsPrize()}
          isRead
          layout="panel"
        />,
      );

      expect(container.querySelector("svg[data-prize]")).toHaveAttribute("data-locked", "true");
      expect(screen.getByText("???", { selector: VISIBLE_ONLY })).toBeInTheDocument();
      expect(screen.queryByText("Harmonica")).not.toBeInTheDocument();
      expect(screen.getByText("11 / 17", { selector: VISIBLE_ONLY })).toBeInTheDocument();
      expect(
        screen.getByText("6 tickets left to claim it", { selector: VISIBLE_ONLY }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Hidden prize of Vowels: 11 of 17 tickets", { selector: ".sr-only" }),
      ).toBeInTheDocument();
    });

    test("WHEN no ticket is earned THEN the silhouette is tagged with none of the module's tickets", () => {
      renderInLocale(
        <ModulePrize
          module={vowelsModule}
          prize={vowelsPrize({ state: "locked", ticketsEarned: 0 })}
          isRead
          layout="panel"
        />,
      );

      expect(screen.getByText("0 / 17", { selector: VISIBLE_ONLY })).toBeInTheDocument();
      expect(
        screen.getByText("17 tickets left to claim it", { selector: VISIBLE_ONLY }),
      ).toBeInTheDocument();
    });

    test("WHEN every ticket is collected THEN the prize stays hidden and says so", () => {
      const { container } = renderInLocale(
        <ModulePrize
          module={vowelsModule}
          prize={vowelsPrize({ state: "ready", ticketsEarned: 17 })}
          isRead
          layout="panel"
        />,
      );

      expect(container.querySelector("svg[data-prize]")).toHaveAttribute("data-locked", "true");
      expect(screen.getByText("???", { selector: VISIBLE_ONLY })).toBeInTheDocument();
      expect(
        screen.getByText("You collected all 17 tickets", { selector: VISIBLE_ONLY }),
      ).toBeInTheDocument();
      expect(screen.queryByText("17 / 17")).not.toBeInTheDocument();
      expect(
        screen.getByText("Hidden prize of Vowels: ready to claim", { selector: ".sr-only" }),
      ).toBeInTheDocument();
    });

    test("WHEN the prize is claimed THEN it is drawn in colour, named, glowing and tagged Redeemed", () => {
      const { container } = renderInLocale(
        <ModulePrize
          module={vowelsModule}
          prize={vowelsPrize({ state: "claimed", ticketsEarned: 17 })}
          isRead
          layout="panel"
        />,
      );

      expect(container.querySelector("svg[data-prize]")).toHaveAttribute("data-locked", "false");
      expect(container.querySelector(".prize-glow")).not.toBeNull();
      expect(screen.getByText("Harmonica", { selector: VISIBLE_ONLY })).toBeInTheDocument();
      expect(screen.getByText("Redeemed", { selector: VISIBLE_ONLY })).toBeInTheDocument();
      expect(screen.queryByText("???")).not.toBeInTheDocument();
      expect(
        screen.getByText("Harmonica: prize redeemed", { selector: ".sr-only" }),
      ).toBeInTheDocument();
    });

    test("WHEN progress has not been read THEN only the label, the silhouette and ??? hold the row's place", () => {
      const { container } = renderInLocale(
        <ModulePrize
          module={vowelsModule}
          prize={vowelsPrize({ state: "claimed", ticketsEarned: 17 })}
          isRead={false}
          layout="panel"
        />,
      );

      expect(container.querySelector("svg[data-prize]")).toHaveAttribute("data-locked", "true");
      expect(screen.getByText("???")).toBeInTheDocument();
      expect(screen.queryByText("Harmonica")).not.toBeInTheDocument();
      expect(screen.queryByText(/\d+ \/ \d+/)).not.toBeInTheDocument();
      expect(screen.queryByText("Redeemed")).not.toBeInTheDocument();
      expect(container.querySelector(".sr-only")).toBeNull();
    });

    test("WHEN every ticket is collected THEN a Claim prize link named after the module opens the counter asking for it", () => {
      renderInLocale(
        <ModulePrize
          module={vowelsModule}
          prize={vowelsPrize({ state: "ready", ticketsEarned: 17 })}
          isRead
          layout="panel"
        />,
      );

      const link = screen.getByRole("link", { name: "Claim the Vowels prize" });
      expect(link).toHaveAttribute("href", "/achievements?claim=2-vowels");
      expect(link).toHaveTextContent("Claim prize");
      expectTextLink(link);
    });

    test("WHEN every ticket is collected THEN Claim prize shares the Prize ready label's line", () => {
      renderInLocale(
        <ModulePrize
          module={vowelsModule}
          prize={vowelsPrize({ state: "ready", ticketsEarned: 17 })}
          isRead
          layout="panel"
        />,
      );

      const heading = screen.getByTestId("module-prize-heading");
      const label = within(heading).getByText("Prize ready");
      const link = within(heading).getByRole("link", { name: "Claim the Vowels prize" });
      expect(label.compareDocumentPosition(link)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    test.each(["locked", "collecting", "claimed"] as const)(
      "WHEN the prize is %s THEN nothing is offered to claim or share",
      (state) => {
        renderInLocale(
          <ModulePrize
            module={vowelsModule}
            prize={vowelsPrize({ state })}
            isRead
            layout="panel"
          />,
        );

        expect(screen.queryByRole("link")).not.toBeInTheDocument();
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
      },
    );

    test("WHEN every ticket is collected THEN the panel offers no next lesson", () => {
      renderInLocale(
        <ModulePrize
          module={vowelsModule}
          prize={vowelsPrize({ state: "ready", ticketsEarned: 17 })}
          isRead
          layout="panel"
          nextLesson={{ sequence: 3, href: "/courses/basic-course/modules/3-consonants" }}
        />,
      );

      expect(screen.getAllByRole("link")).toHaveLength(1);
    });

    test("WHEN a ready prize's progress has not been read THEN no Claim prize link is offered", () => {
      renderInLocale(
        <ModulePrize
          module={vowelsModule}
          prize={vowelsPrize({ state: "ready", ticketsEarned: 17 })}
          isRead={false}
          layout="panel"
        />,
      );

      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    test("WHEN rendered in Spanish THEN the counter's words are used", () => {
      renderInLocale(
        <ModulePrize
          module={vowelsModule}
          prize={vowelsPrize()}
          isRead
          layout="panel"
        />,
        "es",
      );

      expect(
        screen.getByText("Premio de la lección", { selector: VISIBLE_ONLY }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Te faltan 6 tickets para reclamarlo", { selector: VISIBLE_ONLY }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Premio oculto de Vowels: 11 de 17 tickets", { selector: ".sr-only" }),
      ).toBeInTheDocument();
    });
  });

  describe("GIVEN the finale layout", () => {
    const renderFinale = (prize: ModulePrizeDetails, isRead = true) =>
      renderInLocale(
        <ModulePrize
          module={vowelsModule}
          prize={prize}
          isRead={isRead}
          layout="finale"
        />,
      );

    const marker = (container: HTMLElement) =>
      container.querySelector("[data-testid='module-prize-marker']");
    const card = (container: HTMLElement) =>
      container.querySelector("[data-testid='module-prize-card']");

    test("WHEN tickets are still being collected THEN a dashed marker leads to a subordinate card with the hidden prize", () => {
      const { container } = renderFinale(vowelsPrize());

      expect(marker(container)).toHaveAttribute("data-marker", "collecting");
      expect(marker(container)).toHaveClass("border-dashed");
      expect(card(container)).toHaveAttribute("data-featured", "false");
      expect(container.querySelector("svg[data-prize]")).toHaveAttribute("data-locked", "true");
      expect(screen.getByText("???", { selector: VISIBLE_ONLY })).toBeInTheDocument();
      expect(screen.getByText("11 / 17", { selector: VISIBLE_ONLY })).toBeInTheDocument();
      expect(
        screen.getByText("Hidden prize of Vowels: 11 of 17 tickets", { selector: ".sr-only" }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    test("WHEN every ticket is collected THEN a solid marker leads to a featured card that sends the learner to claim it", () => {
      const { container } = renderFinale(vowelsPrize({ state: "ready", ticketsEarned: 17 }));

      expect(marker(container)).toHaveAttribute("data-marker", "collected");
      expect(marker(container)).not.toHaveClass("border-dashed");
      expect(card(container)).toHaveAttribute("data-featured", "true");
      expect(container.querySelector("svg[data-prize]")).toHaveAttribute("data-locked", "true");
      expect(screen.queryByText("Harmonica")).not.toBeInTheDocument();
      const claimLink = screen.getByRole("link", { name: "Claim the Vowels prize" });
      expect(claimLink).toHaveAttribute("href", "/achievements?claim=2-vowels");
      expectTextLink(claimLink);
    });

    test("WHEN the prize is claimed THEN the featured card reveals it, with nothing to claim or share", () => {
      const { container } = renderFinale(vowelsPrize({ state: "claimed", ticketsEarned: 17 }));

      expect(marker(container)).toHaveAttribute("data-marker", "collected");
      expect(card(container)).toHaveAttribute("data-featured", "true");
      expect(container.querySelector("svg[data-prize]")).toHaveAttribute("data-locked", "false");
      expect(screen.getByText("Harmonica", { selector: VISIBLE_ONLY })).toBeInTheDocument();
      expect(screen.getByText("Redeemed", { selector: VISIBLE_ONLY })).toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    const consonants = { sequence: 3, href: "/courses/basic-course/modules/3-consonants" };
    const startLink = () => screen.queryByRole("link", { name: "Start Lesson 03" });

    test.each(["locked", "collecting", "ready", "claimed"] as const)(
      "WHEN the prize is %s THEN the rail marker is a trophy",
      (state) => {
        const { container } = renderFinale(vowelsPrize({ state }));

        expect(marker(container)?.querySelector("svg.lucide-trophy")).not.toBeNull();
      },
    );

    test("WHEN every ticket is collected and a next lesson exists THEN Start Lesson is the primary button, with the Claim prize text link on the label's line above it", () => {
      renderInLocale(
        <ModulePrize
          module={vowelsModule}
          prize={vowelsPrize({ state: "ready", ticketsEarned: 17 })}
          isRead
          layout="finale"
          nextLesson={consonants}
        />,
      );

      const start = startLink()!;
      expect(start).toHaveAttribute("href", consonants.href);
      expect(start).toHaveClass("bg-gold");
      const heading = screen.getByTestId("module-prize-heading");
      expect(within(heading).getByText("Prize ready")).toBeInTheDocument();
      const claim = within(heading).getByRole("link", { name: "Claim the Vowels prize" });
      expect(claim.compareDocumentPosition(start)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    test("WHEN the prize is claimed and a next lesson exists THEN Start Lesson is still offered, with nothing to claim", () => {
      renderInLocale(
        <ModulePrize
          module={vowelsModule}
          prize={vowelsPrize({ state: "claimed", ticketsEarned: 17 })}
          isRead
          layout="finale"
          nextLesson={consonants}
        />,
      );

      expect(startLink()).toHaveAttribute("href", consonants.href);
      expect(
        screen.queryByRole("link", { name: "Claim the Vowels prize" }),
      ).not.toBeInTheDocument();
    });

    test("WHEN tickets are still being collected THEN no next lesson is offered", () => {
      renderInLocale(
        <ModulePrize
          module={vowelsModule}
          prize={vowelsPrize()}
          isRead
          layout="finale"
          nextLesson={consonants}
        />,
      );

      expect(startLink()).not.toBeInTheDocument();
    });

    test("WHEN the module is the course's last THEN no next lesson is offered", () => {
      renderFinale(vowelsPrize({ state: "claimed", ticketsEarned: 17 }));

      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    test("WHEN rendered in Spanish THEN it reads Empezar Lección 03", () => {
      renderInLocale(
        <ModulePrize
          module={vowelsModule}
          prize={vowelsPrize({ state: "claimed", ticketsEarned: 17 })}
          isRead
          layout="finale"
          nextLesson={consonants}
        />,
        "es",
      );

      expect(screen.getByRole("link", { name: "Empezar Lección 03" })).toBeInTheDocument();
    });

    test("WHEN it renders THEN it is not a step of the route's list", () => {
      const { container } = renderFinale(vowelsPrize());

      expect(container.querySelector("li")).toBeNull();
      expect(container.querySelector("[data-state]")).toBeNull();
    });

    test("WHEN progress has not been read THEN the finale renders nothing", () => {
      const { container } = renderFinale(vowelsPrize({ state: "ready", ticketsEarned: 17 }), false);

      expect(container).toBeEmptyDOMElement();
    });
  });
});

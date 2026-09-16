import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, within } from "storybook/test";

import { TicketToast } from "./ticket-toast";

const meta = {
  title: "Components/TicketToast",
  component: TicketToast,
  args: {
    moment: {
      id: 1,
      lessonTitle: "The vowel sound /i/",
      symbol: "i",
      ticketsEarned: 12,
      ticketCount: 17,
      prize: "harmonica",
      moduleTitle: "Vowels",
      moduleSlug: "2-vowels",
      readiesPrize: false,
    },
    onDone: fn(),
  },
} satisfies Meta<typeof TicketToast>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The twelfth Vowels ticket drops out of its slot. */
export const TicketEarned: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("status")).toHaveTextContent("12 of 17");
  },
};

/** A lesson with no sound in its title carries its position. */
export const NumberedTicket: Story = {
  args: {
    moment: {
      id: 1,
      lessonTitle: "The weak-vowel merger",
      symbol: "5",
      ticketsEarned: 3,
      ticketCount: 25,
      prize: "megaphone",
      moduleTitle: "Consonants",
      moduleSlug: "3-consonants",
      readiesPrize: false,
    },
  },
};

/** No moment: the listening region only. */
export const Idle: Story = {
  args: { moment: null },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** Portuguese copy. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};

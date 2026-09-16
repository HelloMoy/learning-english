import { vowelsModule } from "@/components/module-route/module-route.fixtures";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ModulePrize } from "./module-prize";

const meta = {
  title: "Components/ModulePrize",
  component: ModulePrize,
  args: {
    module: vowelsModule,
    prize: {
      hasPrize: true,
      prize: "harmonica",
      state: "collecting",
      ticketsEarned: 11,
      ticketCount: 17,
    },
    isRead: true,
    layout: "panel",
  },
  argTypes: {
    layout: { control: { type: "inline-radio" }, options: ["panel", "finale"] },
  },
  decorators: [
    (Story, context) => (
      <div className={context.args.layout === "panel" ? "w-[340px] p-6" : "max-w-3xl p-6"}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ModulePrize>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Eleven of seventeen tickets: the harmonica's silhouette, `???` and what is left. */
export const PanelCollecting: Story = {};

/** No ticket yet: the silhouette with none of the module's tickets. */
export const PanelLocked: Story = {
  args: { prize: { ...meta.args.prize, state: "locked", ticketsEarned: 0 } },
};

/** Every ticket in: still hidden, now sending the learner to claim it on the counter. */
export const PanelReady: Story = {
  args: { prize: { ...meta.args.prize, state: "ready", ticketsEarned: 17 } },
};

/** Claimed on the counter: the harmonica in colour, named and redeemed. */
export const PanelClaimed: Story = {
  args: { prize: { ...meta.args.prize, state: "claimed", ticketsEarned: 17 } },
};

/** Before progress is read: only the label, the silhouette and `???` hold the row's place. */
export const PanelNotRead: Story = {
  args: { isRead: false },
};

/** The end of the route while tickets are still being collected: a dashed marker and a quiet card. */
export const FinaleCollecting: Story = {
  args: { layout: "finale" },
};

/** The end of the route with every ticket in: a trophy on a solid marker, Start Lesson 03 and the Claim prize text link. */
export const FinaleReady: Story = {
  args: {
    layout: "finale",
    nextLesson: { sequence: 3, href: "/courses/basic-course/modules/3-consonants" },
    prize: { ...meta.args.prize, state: "ready", ticketsEarned: 17 },
  },
};

/** The end of the route once claimed: the revealed prize, still handing on to Start Lesson 03. */
export const FinaleClaimed: Story = {
  args: {
    layout: "finale",
    nextLesson: { sequence: 3, href: "/courses/basic-course/modules/3-consonants" },
    prize: { ...meta.args.prize, state: "claimed", ticketsEarned: 17 },
  },
};

/** Spanish copy on a ready finale. */
export const FinaleReadyInSpanish: Story = {
  parameters: { locale: "es" },
  args: {
    layout: "finale",
    nextLesson: { sequence: 3, href: "/courses/basic-course/modules/3-consonants" },
    prize: { ...meta.args.prize, state: "ready", ticketsEarned: 17 },
  },
};

/** The course's last lesson, claimed: nothing further to start. */
export const FinaleClaimedLastLesson: Story = {
  args: {
    layout: "finale",
    prize: { ...meta.args.prize, state: "claimed", ticketsEarned: 17 },
  },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const meta = {
  title: "UI/Tooltip",
  component: Tooltip,
  decorators: [
    (Story) => (
      <div className="flex min-h-40 items-center justify-center">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger className="rounded-sm text-sm text-muted-foreground underline decoration-dotted underline-offset-4">
        4 of 48 videos
      </TooltipTrigger>
      <TooltipContent>8% of the course watched</TooltipContent>
    </Tooltip>
  ),
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Closed until the trigger is hovered or focused. */
export const Default: Story = {};

/** Held open for review. */
export const Open: Story = {
  args: { open: true },
};

/** Hovering the trigger opens it. */
export const OpensOnHover: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByRole("button", { name: "4 of 48 videos" }));
    await expect(await within(document.body).findByRole("tooltip")).toHaveTextContent(
      "8% of the course watched",
    );
  },
};

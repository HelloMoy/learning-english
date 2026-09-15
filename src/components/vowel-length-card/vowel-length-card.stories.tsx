import type { PlayableClip } from "@/hooks/use-clip-sequence/use-clip-sequence";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { VowelLengthCard } from "./vowel-length-card";

/**
 * A clip that starts and never ends, so a story can hold the playing state
 * still for review instead of losing it the moment the recording finishes.
 */
const holdsPlaying = (): PlayableClip => ({
  onended: null,
  play: () => Promise.resolve(),
  pause: () => {},
});

const meta = {
  title: "Components/VowelLengthCard",
  component: VowelLengthCard,
  args: { variant: "hear-the-difference" },
  argTypes: {
    variant: { control: { type: "select" }, options: ["hear-the-difference", "quick-review"] },
  },
  decorators: [
    (Story) => (
      <div className="max-w-[470px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof VowelLengthCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** What a new visitor sees beside the hero. */
export const HearTheDifference: Story = {};

/** The same card for a returning learner: only the eyebrow changes. */
export const QuickReview: Story = {
  args: { variant: "quick-review" },
};

/** *sheep* mid-playback: pressed button, playing glyph and the long bar filling. */
export const Playing: Story = {
  args: { createAudio: holdsPlaying },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sheep = canvas.getByRole("button", { name: /sheep/ });

    await userEvent.click(sheep);

    await expect(sheep).toHaveAttribute("aria-pressed", "true");
  },
};

/** Spanish: the anchor note compares both vowels to *sí* and *sé*. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** Portuguese: the note compares them to *vi* and *vê*; the English words stay. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};

/** Phone width, where the card sits under the hero's primary action. */
export const OnAPhone: Story = {
  decorators: [
    (Story) => (
      <div className="w-[358px]">
        <Story />
      </div>
    ),
  ],
};

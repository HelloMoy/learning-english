import { Button } from "@/components/ui/button/button";

import NiceModal from "@ebay/nice-modal-react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect } from "react";

import { LessonVideoResumeModal } from "./lesson-video-resume-modal";

/**
 * The modal is opened imperatively, so a story cannot simply render it — it
 * has to ask NiceModal to show it, exactly as the player does.
 */
const OpenOnMount = ({ positionSeconds }: { positionSeconds: number }) => {
  useEffect(() => {
    void NiceModal.show(LessonVideoResumeModal, { positionSeconds });
  }, [positionSeconds]);

  return null;
};

/**
 * The modal's own props. `NiceModal.create` widens the component's signature
 * with registry-injected props (`id`, `keepMounted`, `defaultVisible`) that no
 * caller ever passes, so the stories are typed against the real argument
 * surface instead of `typeof LessonVideoResumeModal`.
 */
type ResumeModalArgs = { positionSeconds: number };

const meta = {
  title: "Components/LessonVideoResumeModal",
  parameters: {
    // The dialog is portalled over a `fixed inset-0` backdrop; a padded canvas
    // would only add scrollbars around it.
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <NiceModal.Provider>
        <div className="min-h-svh bg-background p-10">
          <p className="text-sm text-muted-foreground">
            Lesson page content sits behind the backdrop.
          </p>
          <Story />
        </div>
      </NiceModal.Provider>
    ),
  ],
} satisfies Meta<ResumeModalArgs>;

export default meta;
type Story = StoryObj<ResumeModalArgs>;

/** Three minutes into a lesson — the common case. */
export const MidLecture: Story = {
  args: { positionSeconds: 180 },
  render: (args) => <OpenOnMount positionSeconds={args.positionSeconds} />,
};

/** Under a minute in — checks the leading zero in the MM:SS timestamp. */
export const JustPastTheThreshold: Story = {
  args: { positionSeconds: 45 },
  render: (args) => <OpenOnMount positionSeconds={args.positionSeconds} />,
};

/** A long lesson — the minute count keeps running past an hour. */
export const LongLesson: Story = {
  args: { positionSeconds: 3661 },
  render: (args) => <OpenOnMount positionSeconds={args.positionSeconds} />,
};

/**
 * Closed until the button is pressed — the only story that exercises the full
 * open, focus-trap and dismiss cycle by hand.
 */
export const OpenedByHand: Story = {
  args: { positionSeconds: 180 },
  render: (args) => (
    <Button onClick={() => void NiceModal.show(LessonVideoResumeModal, args)}>
      Show resume prompt
    </Button>
  ),
};

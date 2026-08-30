import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "../button/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

const meta = {
  title: "UI/Dialog",
  component: Dialog,
  parameters: {
    // The dialog is portalled and fills the viewport; a padded canvas only
    // adds scrollbars around a backdrop that is already `fixed inset-0`.
    layout: "fullscreen",
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Open by default so the card is visible without interaction. */
export const Open: Story = {
  args: { open: true },
  render: (args) => (
    <Dialog {...args}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resume playback</DialogTitle>
          <DialogDescription>
            You stopped watching partway through. Pick up where you left off, or start again from
            the beginning.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Restart from beginning</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button>Resume from 03:00</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

/**
 * Suppresses the corner close affordance. Use when the footer already carries
 * an unambiguous dismissal and a second one would be redundant.
 */
export const WithoutCloseButton: Story = {
  args: { open: true },
  render: (args) => (
    <Dialog {...args}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Delete this note?</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="destructive">Delete</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

/** Long body copy — checks that the card grows without the footer drifting off-screen. */
export const LongContent: Story = {
  args: { open: true },
  render: (args) => (
    <Dialog {...args}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Before you start this module</DialogTitle>
          <DialogDescription>
            {Array.from({ length: 6 })
              .map(
                () =>
                  "This module builds on the previous one, so the vocabulary is assumed rather than reintroduced.",
              )
              .join(" ")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Got it</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

/** Closed until the trigger is used — exercises the uncontrolled path. */
export const FromTrigger: Story = {
  args: {},
  render: (args) => (
    <div className="p-10">
      <Dialog {...args}>
        <DialogTrigger asChild>
          <Button>Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Opened from a trigger</DialogTitle>
            <DialogDescription>
              Focus moves into the dialog and returns to the trigger on close.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  ),
};

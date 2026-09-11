import { SEEK_STEP_STORAGE_KEY } from "@/hooks/use-seek-step/use-seek-step";
import { DEFAULT_SEEK_STEP_SECONDS, type SeekStepSeconds } from "@/lib/seek-run/seek-run";

import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import { defaultLayoutIcons, DefaultVideoLayout } from "@vidstack/react/player/layouts/default";

import { SeekStepMenu } from "./seek-step-menu";

/**
 * The entry the player's settings menu grows for the double-tap seek.
 *
 * Every story stands up a real `DefaultVideoLayout` and mounts the component
 * in the slot the app uses, rather than faking the layout's context around it.
 * That is the whole point of reviewing this one visually: what matters is how
 * the entry sits beside Speed and Accessibility, how its hint reads, and how
 * the radio group looks once opened — none of which a bare render shows. **To
 * see it, press the gear in the control bar.**
 *
 * The component takes no props: it reads the chosen step from `localStorage`,
 * so each story seeds the value it wants to show. Choosing an option writes
 * the preference for real, which is why every story re-seeds on mount —
 * switch away and back to reset one.
 */
const seedStep = (seconds: SeekStepSeconds | null): void => {
  if (seconds === null) {
    window.localStorage.removeItem(SEEK_STEP_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(SEEK_STEP_STORAGE_KEY, String(seconds));
};

const withStoredStep = (seconds: SeekStepSeconds | null): Decorator => {
  const WithStoredStep: Decorator = (Story) => {
    seedStep(seconds);
    return <Story />;
  };
  return WithStoredStep;
};

const meta = {
  title: "LessonView/SeekStepMenu",
  component: SeekStepMenu,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="min-h-svh bg-black p-6">
        <MediaPlayer
          className="mx-auto aspect-video w-full max-w-3xl bg-black"
          src="/videos/vowels-short-vs-long.mp4"
          title="Vowels: short vs. long"
          viewType="video"
          playsInline
        >
          <MediaProvider />
          <DefaultVideoLayout
            icons={defaultLayoutIcons}
            colorScheme="dark"
            slots={{ settingsMenuItemsEnd: <Story /> }}
          />
        </MediaPlayer>
      </div>
    ),
  ],
} satisfies Meta<typeof SeekStepMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A learner who has never chosen: five seconds, the default. */
export const Default: Story = {
  decorators: [withStoredStep(null)],
};

/** The shortest step, for replaying a single word or sound. */
export const ThreeSeconds: Story = {
  decorators: [withStoredStep(3)],
};

/** The longer step — what this gesture always did before it was a setting. */
export const TenSeconds: Story = {
  decorators: [withStoredStep(10)],
};

/** The setting's name and its seconds in Spanish, through `Components.SeekStepMenu`. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
  decorators: [withStoredStep(DEFAULT_SEEK_STEP_SECONDS)],
};

/** The same in Portuguese — the ICU plural is each locale's own. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
  decorators: [withStoredStep(10)],
};

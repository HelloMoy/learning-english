import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ShareCard } from "./share-card";

/**
 * The Open Graph card, at each of the four compositions the routes produce.
 *
 * A caveat that matters when reviewing these: in production this tree is
 * rendered by **Satori**, not by a browser. What you see here is the same
 * markup laid out by Chrome, which agrees closely but is not the authority —
 * Satori supports no CSS grid, resolves no custom properties, and loads its
 * fonts as buffers. The shipped artwork is reviewed as the real PNGs the
 * `/<locale>/…/opengraph-image` routes serve.
 *
 * These stories are still the fastest way to see how a composition reacts to
 * copy: paste a long headline into the control and watch the type step down.
 */
const meta = {
  title: "Cinema/ShareCard",
  component: ShareCard,
  parameters: {
    backgrounds: { default: "dark" },
    layout: "fullscreen",
  },
  argTypes: {
    headline: { control: "text" },
    kicker: { control: "text" },
    supporting: { control: "text" },
    badge: { control: "text" },
  },
  // The card is a fixed 1200×630. Scaling it down keeps the whole composition
  // visible in the panel without changing any of its internal proportions.
  decorators: [
    (Story) => (
      <div style={{ width: 1200, transform: "scale(0.62)", transformOrigin: "top left" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ShareCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The locale home: the catalog's promise over its real totals. */
export const Home: Story = {
  args: {
    kicker: "Now streaming · Spoken English",
    headline: "Start where your ear is",
    supporting:
      "Pronunciation-first English courses, in order. Each level assumes the sounds from the one before it.",
    facts: ["2 courses", "15 modules", "155 lessons"],
  },
};

/**
 * A course. The headline is the course's promise, derived from its own
 * description — never `Basic Course`, which names a row and tells a reader
 * nothing. The catalog name drops to the supporting line.
 */
export const Course: Story = {
  args: {
    kicker: "Level 1",
    headline: "American pronunciation from the ground up",
    supporting: "Basic Course",
    facts: ["5 modules", "48 lessons"],
  },
};

/** A module. Its own title is already the useful headline. */
export const Module: Story = {
  args: {
    kicker: "Basic Course",
    headline: "Contractions and reductions",
    facts: ["3 / 5", "12 lessons"],
  },
};

/** A Lecture. The runtime earns the badge — it decides whether someone presses play now. */
export const Lesson: Story = {
  args: {
    kicker: "Advanced Intermediate Course · Advanced Pronunciation Course",
    headline: "Welcome",
    badge: "Lesson 1",
    facts: ["03:15"],
  },
};

/**
 * The failure mode the headline sizing exists for. A course whose description
 * opens without a colon yields the whole sentence, so the type has to step down
 * rather than overrun the card.
 */
export const LongHeadline: Story = {
  args: {
    kicker: "Level 2",
    headline:
      "Rhythm, stress and the reductions that make fast speech land the way a native speaker hears it",
    supporting: "Advanced Intermediate Course",
    facts: ["10 modules", "107 lessons"],
  },
};

/** A reading lesson: no runtime, so the footer simply carries nothing. */
export const WithoutFacts: Story = {
  args: {
    kicker: "Basic Course · Introduction",
    headline: "Before you start",
    badge: "Lesson 1",
  },
};

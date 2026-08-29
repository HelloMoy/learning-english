import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LessonNotesTabs } from "./lesson-notes-tabs";

/**
 * The markdown below is lesson content, not UI copy, so it stays inline
 * rather than moving into `Stories.*` — the reviewer is judging how the
 * component splits and renders notes, and the tab labels themselves already
 * come from the production `Components.LessonTabs` namespace.
 */
const BILINGUAL_NOTES = `# Vowel length

English contrasts *short* and *long* vowels. The pair \`ship\` / \`sheep\`
is the classic minimal pair.

- **ship** — short, lax vowel
- **sheep** — long, tense vowel

---

# Longitud vocálica

El inglés contrasta vocales *cortas* y *largas*. El par \`ship\` / \`sheep\`
es el ejemplo clásico de par mínimo.

- **ship** — vocal corta y relajada
- **sheep** — vocal larga y tensa
`;

const ENGLISH_ONLY_NOTES = `# Word stress

Multi-syllable words carry one primary stress. Moving it changes meaning:
\`REcord\` (noun) vs \`reCORD\` (verb).
`;

const meta = {
  title: "LessonView/LessonNotesTabs",
  component: LessonNotesTabs,
} satisfies Meta<typeof LessonNotesTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Notes with an `---` divider, which the component splits into two columns. */
export const Bilingual: Story = {
  args: { markdown: BILINGUAL_NOTES },
};

/** No divider — the notes render as a single column. */
export const EnglishOnly: Story = {
  args: { markdown: ENGLISH_ONLY_NOTES },
};

/** With the optional lesson description rendered above the tabs. */
export const WithDescription: Story = {
  args: {
    markdown: BILINGUAL_NOTES,
    description: "Video lesson. The full description lives in the linked notes.",
  },
};

/** No notes on disk yet — the empty state the tab panel falls back to. */
export const Empty: Story = {
  args: { markdown: "" },
};

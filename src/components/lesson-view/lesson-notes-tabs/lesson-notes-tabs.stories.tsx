import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LessonNotesTabs } from "./lesson-notes-tabs";

/**
 * The markdown below is lesson content, not UI copy, so it stays inline
 * rather than moving into `Stories.*` — the reviewer is judging how the
 * component splits and renders notes, and the tab labels themselves already
 * come from the production `Components.LessonTabs` namespace.
 *
 * It mirrors a real Basic Course body: `##` language sections, a `###`
 * sub-heading, a bullet list, a bold-labelled example run and a blockquote.
 * Reviewing anything thinner would not exercise the typographic hierarchy.
 */
const BILINGUAL_NOTES = `# The Vowel Sound: /ə/ (El más importante)

## 🇪🇸 Español

### La schwa /ə/: la vocal más frecuente del inglés

La schwa es el sonido de las sílabas **sin acento**. No tiene color propio: la boca se queda relajada, en el centro, y la vocal casi desaparece.

**Cómo se produce**

- 👄 **Boca:** entreabierta y floja, sin estirar ni redondear los labios.
- 👅 **Lengua:** en el centro exacto de la boca, sin subir ni bajar.
- 🔊 **Voz:** sonora, muy corta y débil — nunca cae sobre ella el acento.

**Lo oyes en:** *about* · *banana* · *problem* · *support* · *the*

> ⚠️ **El error típico en español:** pronunciar cada vocal como se escribe. En inglés *problem* es /ˈprɑbləm/ y la segunda vocal se reduce hasta casi nada.

**Al terminar vas a poder:** reconocer la schwa al oírla y reducir las sílabas sin acento.

## 🇺🇸 English

### The schwa /ə/: the most frequent vowel in English

The schwa is the sound of **unstressed** syllables. It has no color of its own: your mouth stays relaxed and central, and the vowel almost disappears.

**How it's made**

- 👄 **Mouth:** slightly open and loose — lips neither spread nor rounded.
- 👅 **Tongue:** dead center in the mouth, neither high nor low.
- 🔊 **Voice:** voiced, very short and weak — the stress never lands on it.

**You hear it in:** *about* · *banana* · *problem* · *support* · *the*

> ⚠️ **The typical Spanish-speaker mistake:** pronouncing every vowel the way it's spelled. In English *problem* is /ˈprɑbləm/ and that second vowel reduces to almost nothing.

**By the end you'll be able to:** recognize the schwa when you hear it and reduce unstressed syllables.
`;

const ENGLISH_ONLY_NOTES = `# Word stress

## 🇺🇸 English

### One syllable carries the word

Multi-syllable words carry one primary stress, and moving it changes what the word means.

**You hear it in:** *REcord* (noun) · *reCORD* (verb) · *PREsent* · *preSENT*
`;

const UNMARKED_NOTES = `# Vowel length

English contrasts short and long vowels. The pair *ship* / *sheep* is the classic
minimal pair, and it is the one Spanish speakers get wrong most often.
`;

const meta = {
  title: "LessonView/LessonNotesTabs",
  component: LessonNotesTabs,
} satisfies Meta<typeof LessonNotesTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Both language sections present — the component renders two labelled columns. */
export const Bilingual: Story = {
  args: { markdown: BILINGUAL_NOTES },
};

/** One language section — a single column, with the `##` marker dropped. */
export const EnglishOnly: Story = {
  args: { markdown: ENGLISH_ONLY_NOTES },
};

/** No language section at all — the fallback single column. */
export const Unmarked: Story = {
  args: { markdown: UNMARKED_NOTES },
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

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LessonNotesTabs } from "./lesson-notes-tabs";

/**
 * The markdown below is lesson content, not UI copy, so it stays inline
 * rather than moving into `Stories.*` — the reviewer is judging which
 * language the component picks and how it renders it, and the tab labels
 * themselves already come from the production `Components.LessonTabs`
 * namespace.
 *
 * It mirrors a real Basic Course body: one `##` section per locale, each
 * with a `###` sub-heading, a bullet list, a bold-labelled example run and a
 * blockquote. Reviewing anything thinner would not exercise the typographic
 * hierarchy.
 */
const TRILINGUAL_NOTES = `# The Vowel Sound: /ə/ (El más importante)

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

> ⚠️ **The typical mistake:** pronouncing every vowel the way it's spelled. In English *problem* is /ˈprɑbləm/ and that second vowel reduces to almost nothing.

**By the end you'll be able to:** recognize the schwa when you hear it and reduce unstressed syllables.

## 🇧🇷 Português

### O schwa /ə/: a vogal mais frequente do inglês

O schwa é o som das sílabas **sem acento**. Não tem cor própria: a boca fica relaxada, no centro, e a vogal quase desaparece.

**Como se produz**

- 👄 **Boca:** entreaberta e frouxa, sem esticar nem arredondar os lábios.
- 👅 **Língua:** bem no centro da boca, sem subir nem descer.
- 🔊 **Voz:** sonora, muito curta e fraca — o acento nunca cai nela.

**Você ouve em:** *about* · *banana* · *problem* · *support* · *the*

> ⚠️ **O erro típico:** dar a cada vogal o valor cheio da escrita. Em inglês *problem* é /ˈprɑbləm/ e a segunda vogal se reduz a quase nada.

**No fim você vai conseguir:** reconhecer o schwa ao ouvi-lo e reduzir as sílabas sem acento.
`;

/** A body that predates the Portuguese section — the fallback case. */
const WITHOUT_PORTUGUESE = TRILINGUAL_NOTES.slice(0, TRILINGUAL_NOTES.indexOf("## 🇧🇷 Português"));

const UNMARKED_NOTES = `# Vowel length

English contrasts short and long vowels. The pair *ship* / *sheep* is the classic
minimal pair, and it is the one learners get wrong most often.
`;

const meta = {
  title: "LessonView/LessonNotesTabs",
  component: LessonNotesTabs,
  args: { markdown: TRILINGUAL_NOTES },
} satisfies Meta<typeof LessonNotesTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The learner reads in Spanish — only the Spanish section is rendered. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** The learner reads in English — only the English section is rendered. */
export const InEnglish: Story = {
  parameters: { locale: "en" },
};

/** The learner reads in Portuguese — only the Portuguese section is rendered. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};

/**
 * A lesson whose notes predate the Portuguese section, read under `pt`: the
 * panel falls back to English rather than rendering empty.
 */
export const FallsBackToEnglish: Story = {
  parameters: { locale: "pt" },
  args: { markdown: WITHOUT_PORTUGUESE },
};

/** No language section at all — the whole body is rendered as-is. */
export const Unmarked: Story = {
  args: { markdown: UNMARKED_NOTES },
};

/** With the optional lesson description rendered above the tabs. */
export const WithDescription: Story = {
  args: {
    description: "Video lesson. The full description lives in the linked notes.",
  },
};

/** No notes on disk yet — the empty state the tab panel falls back to. */
export const Empty: Story = {
  args: { markdown: "" },
};

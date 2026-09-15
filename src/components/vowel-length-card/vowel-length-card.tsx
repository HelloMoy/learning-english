"use client";

import { Eyebrow } from "@/components/eyebrow/eyebrow";
import { useClipSequence, type CreateAudio } from "@/hooks/use-clip-sequence/use-clip-sequence";
import {
  MINIMAL_PAIR_CLIPS,
  type MinimalPairWord,
} from "@/lib/minimal-pair-clips/minimal-pair-clips";
import { cn } from "@/lib/utils/utils";

import { AudioLines, Play } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Which audience the card addresses. The two differ only in the eyebrow: a new
 * visitor is invited to hear the difference, a returning learner is reviewing it.
 */
export type VowelLengthCardVariant = "hear-the-difference" | "quick-review";

type VowelLength = "short" | "long";

type VowelRowContent = {
  word: MinimalPairWord;
  ipa: string;
  /** The word split so its vowel letters can be emphasized: `sh` · `ee` · `p`. */
  spelling: readonly [before: string, vowel: string, after: string];
  length: VowelLength;
  labelKey: "shortVowel" | "longVowel";
};

/** The pair, in the order `Play both` plays it. English words and IPA are never translated. */
const ROWS: readonly VowelRowContent[] = [
  {
    word: "ship",
    ipa: "/ʃɪp/",
    spelling: ["sh", "i", "p"],
    length: "short",
    labelKey: "shortVowel",
  },
  {
    word: "sheep",
    ipa: "/ʃip/",
    spelling: ["sh", "ee", "p"],
    length: "long",
    labelKey: "longVowel",
  },
];

/** How much of the track each vowel's length fills. */
const TRACK_WIDTH: Record<VowelLength, string> = { short: "w-[34%]", long: "w-[78%]" };

const EYEBROW_KEY = {
  "hear-the-difference": "eyebrow.hearTheDifference",
  "quick-review": "eyebrow.quickReview",
} as const;

/**
 * The home's interactive minimal-pair card: *ship* /ɪ/ against *sheep* /i/,
 * each with a recording, a duration bar and a note tying both vowels to words
 * the learner already says.
 *
 * @remarks
 * One recording sounds at a time — `useClipSequence` stops the clip in
 * progress before starting another, so `Play both` and a word button never
 * talk over each other. A word's button is `aria-pressed` exactly while its
 * clip plays, and a clip the browser refuses leaves every button released.
 *
 * The bar's fill animates only while its word plays and is still when the
 * learner prefers reduced motion; the pressed state carries the meaning.
 *
 * @param variant - `hear-the-difference` for a new visitor, `quick-review` for a returning learner
 * @param createAudio - Overrides how clips are built; tests inject a fake
 *
 * @example
 * ```tsx
 * <VowelLengthCard variant="quick-review" />
 * ```
 */
export function VowelLengthCard({
  variant,
  createAudio,
}: {
  variant: VowelLengthCardVariant;
  createAudio?: CreateAudio;
}) {
  const t = useTranslations("Components.VowelLengthCard");
  const { playingSource, play } = useClipSequence(createAudio);

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-[0_30px_60px_-30px_color-mix(in_oklab,var(--foreground)_35%,transparent)] sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <Eyebrow>{t(EYEBROW_KEY[variant])}</Eyebrow>
        <button
          type="button"
          onClick={() => play(ROWS.map((row) => MINIMAL_PAIR_CLIPS[row.word]))}
          className="inline-flex min-h-11 items-center gap-2 rounded-md px-1 text-sm font-bold text-gold focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Play
            aria-hidden="true"
            className="size-3.5"
            fill="currentColor"
          />
          {t("playBoth")}
        </button>
      </div>

      <ol className="flex flex-col border-b border-border">
        {ROWS.map((row) => (
          <VowelRow
            key={row.word}
            row={row}
            isPlaying={playingSource === MINIMAL_PAIR_CLIPS[row.word]}
            playLabel={t("playWord", { word: row.word })}
            lengthLabel={t(row.labelKey)}
            onPlay={() => play([MINIMAL_PAIR_CLIPS[row.word]])}
          />
        ))}
      </ol>

      <AnchorNote />
    </section>
  );
}

function VowelRow({
  row,
  isPlaying,
  playLabel,
  lengthLabel,
  onPlay,
}: {
  row: VowelRowContent;
  isPlaying: boolean;
  playLabel: string;
  lengthLabel: string;
  onPlay: () => void;
}) {
  const [before, vowel, after] = row.spelling;

  return (
    <li
      data-testid={`vowel-row-${row.word}`}
      className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 border-t border-border py-3.5"
    >
      <button
        type="button"
        aria-label={playLabel}
        aria-pressed={isPlaying}
        onClick={onPlay}
        className={cn(
          "flex size-12 items-center justify-center rounded-full transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          isPlaying
            ? "bg-secondary text-gold ring-2 ring-primary"
            : "bg-primary text-primary-foreground",
        )}
      >
        {isPlaying ? (
          <AudioLines
            aria-hidden="true"
            className="size-5"
          />
        ) : (
          <Play
            aria-hidden="true"
            className="size-5"
            fill="currentColor"
          />
        )}
      </button>

      <div className="flex min-w-0 flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <span
            lang="en"
            className="font-sans text-[2.625rem] leading-[0.9] font-extrabold tracking-tight text-foreground sm:text-5xl"
          >
            {before}
            <span className="text-amber">{vowel}</span>
            {after}
          </span>
          <span className="font-mono text-base text-gold">{row.ipa}</span>
        </div>
        <div
          data-testid={`vowel-track-${row.word}`}
          data-length={row.length}
          className="relative h-2 overflow-hidden rounded-full bg-secondary"
        >
          <span
            className={cn(
              "absolute inset-y-0 left-0 rounded-full bg-muted-foreground/35",
              TRACK_WIDTH[row.length],
            )}
          />
          {isPlaying ? (
            <span
              data-testid="vowel-fill"
              className={cn(
                "absolute inset-y-0 left-0 origin-left animate-vowel-fill rounded-full bg-primary motion-reduce:animate-none",
                TRACK_WIDTH[row.length],
              )}
            />
          ) : null}
        </div>
        <span className="text-xs text-muted-foreground">{lengthLabel}</span>
      </div>
    </li>
  );
}

function AnchorNote() {
  const t = useTranslations("Components.VowelLengthCard");

  return (
    <div
      data-testid="vowel-anchor-note"
      className="flex flex-col gap-3 rounded-xl bg-background p-4"
    >
      <span className="self-start rounded-md border border-border bg-secondary px-2 py-0.5 text-[11px] font-semibold text-foreground">
        {t("anchorLanguage")}
      </span>
      <p className="text-sm leading-relaxed text-pretty text-foreground">
        {t.rich("anchorNote", {
          ipa: (chunks) => <span className="font-mono text-gold">{chunks}</span>,
          b: (chunks) => <strong>{chunks}</strong>,
          i: (chunks) => <em>{chunks}</em>,
        })}
      </p>
    </div>
  );
}

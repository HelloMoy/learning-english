/**
 * The artwork every Open Graph image renders.
 *
 * @remarks
 * This is **not** a React component the browser ever mounts. It is handed to
 * `ImageResponse`, which renders it through Satori — a layout engine, not a
 * browser. Three consequences shape everything below and are the reason this
 * file looks unlike the rest of `src/components/`:
 *
 * - Satori supports flexbox and absolute positioning, and **no CSS grid**.
 * - Every element with more than one child needs an explicit `display: "flex"`.
 * - It resolves no CSS custom properties, so the Immersion Cinema tokens are
 *   written here as literal hex rather than as `var(--background)`. The values
 *   are the `.dark` block of `globals.css`; changing the palette means changing
 *   both, which is the price of rendering outside the browser.
 *
 * One card serves the home, course, module and lesson routes. Four hand-rolled
 * layouts would drift — and a sharing image is invisible unless someone goes
 * looking for it, so drift would not be noticed.
 *
 * @category Metadata
 */

/** Immersion Cinema, dark. Mirrors the `.dark` block in `globals.css`. */
const GROUND = "#08080b";
const INK = "#f4f1ea";
const MUTED = "#9b968c";
const GOLD = "#e7b64c";
const SUBTLE_INK = "#cfc9bd";

export const SHARE_CARD_SIZE = { width: 1200, height: 630 } as const;

/**
 * What a card says, whatever route it is for.
 *
 * @category Metadata
 */
export type ShareCardProps = {
  /** The promise, set largest — never a catalog name. */
  headline: string;
  /** Where the reader is in the catalog: `Basic Course · Module 1`. */
  kicker?: string;
  /** One supporting sentence, shown only when the headline is short enough. */
  supporting?: string;
  /** Catalog facts, already localized and pluralized: `5 modules`, `8:11`. */
  facts?: string[];
  /** A short lead fact set apart in gold, e.g. `Lesson 1`. */
  badge?: string;
};

/**
 * Renders the sharing card at 1200×630.
 *
 * @param props - The card's copy, already localized by the calling route
 * @returns The element tree for `ImageResponse`
 * @category Metadata
 */
export function ShareCard({ headline, kicker, supporting, facts = [], badge }: ShareCardProps) {
  // A long headline has to shrink or it overruns the card. The catalog's
  // descriptions vary enough that a single size cannot serve all of them.
  const headlineSize = headline.length > 64 ? 58 : headline.length > 40 ? 72 : 88;

  return (
    <div
      style={{
        width: SHARE_CARD_SIZE.width,
        height: SHARE_CARD_SIZE.height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 68px 60px",
        backgroundColor: GROUND,
        color: INK,
        fontFamily: "Geist",
        // The double radial glow from `CinemaBackground`, flattened to literal
        // colours: Satori resolves no `color-mix()`.
        backgroundImage:
          "radial-gradient(45% 40% at 78% 10%, rgba(240,200,105,0.24), rgba(8,8,11,0)), " +
          "radial-gradient(90% 80% at 80% 0%, #1d1a16, #08080b 62%)",
      }}
    >
      {/* The letterbox scrim along the top edge. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 72,
          backgroundImage: "linear-gradient(180deg, rgba(0,0,0,0.85), rgba(0,0,0,0))",
        }}
      />

      <div
        style={{
          display: "flex",
          fontSize: 23,
          fontWeight: 800,
          letterSpacing: "0.28em",
        }}
      >
        <span>ENGLISH</span>
        <span style={{ color: GOLD, padding: "0 4px" }}>·</span>
        <span>COURSE</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {kicker ? (
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: GOLD,
            }}
          >
            {kicker}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            fontSize: headlineSize,
            fontWeight: 800,
            letterSpacing: "-0.025em",
            lineHeight: 1.04,
          }}
        >
          {headline}
        </div>

        {supporting ? (
          <div
            style={{
              display: "flex",
              fontSize: 27,
              lineHeight: 1.45,
              color: SUBTLE_INK,
              maxWidth: 840,
            }}
          >
            {supporting}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          fontSize: 22,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: MUTED,
        }}
      >
        {badge ? (
          <div
            style={{
              display: "flex",
              border: `1px solid rgba(231,182,76,0.45)`,
              color: GOLD,
              padding: "8px 16px",
            }}
          >
            {badge}
          </div>
        ) : null}
        {facts.map((fact, index) => (
          <div
            key={fact}
            style={{ display: "flex", alignItems: "center", gap: 18 }}
          >
            {index > 0 || badge ? <span style={{ color: GOLD }}>·</span> : null}
            <span>{fact}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

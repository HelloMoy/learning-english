import type { PrizeId } from "@/lib/module-prizes/module-prizes";

import type { ReactNode } from "react";

/** The three paints a prize is drawn with; a silhouette sets all three to one colour. */
type Paint = { main: string; detail: string; light: string };

const COLOUR: Paint = { main: "#e7b64c", detail: "#8a5e0f", light: "#f7e7bd" };
const SILHOUETTE: Paint = {
  main: "var(--prize-silhouette)",
  detail: "var(--prize-silhouette)",
  light: "var(--prize-silhouette)",
};

/** Each prize as a handful of shapes on a 64-unit grid. */
const PRIZE_SHAPES: Record<PrizeId, (paint: Paint) => ReactNode> = {
  whistle: ({ main, detail, light }) => (
    <>
      <path
        d="M8 24 H38 A16 16 0 1 1 36.5 46 H16 A8 8 0 0 1 8 38 Z"
        fill={main}
      />
      <rect
        x="8"
        y="24"
        width="18"
        height="6"
        fill={light}
      />
      <circle
        cx="44"
        cy="35"
        r="6"
        fill={detail}
      />
      <circle
        cx="12"
        cy="17"
        r="5"
        fill="none"
        stroke={main}
        strokeWidth="3"
      />
    </>
  ),
  harmonica: ({ main, detail, light }) => (
    <>
      <rect
        x="4"
        y="20"
        width="56"
        height="24"
        rx="5"
        fill={main}
      />
      <rect
        x="4"
        y="20"
        width="56"
        height="7"
        rx="3"
        fill={light}
      />
      <rect
        x="4"
        y="37"
        width="56"
        height="7"
        rx="3"
        fill={light}
      />
      <path
        d="M11 29 V35 M18 29 V35 M25 29 V35 M32 29 V35 M39 29 V35 M46 29 V35 M53 29 V35"
        stroke={detail}
        strokeWidth="4"
      />
    </>
  ),
  megaphone: ({ main, detail, light }) => (
    <>
      <path
        d="M16 24 L48 10 V54 L16 40 Z"
        fill={main}
      />
      <rect
        x="46"
        y="8"
        width="8"
        height="48"
        rx="4"
        fill={light}
      />
      <rect
        x="6"
        y="24"
        width="12"
        height="16"
        rx="3"
        fill={detail}
      />
      <rect
        x="22"
        y="40"
        width="7"
        height="16"
        rx="3"
        fill={main}
      />
    </>
  ),
  drum: ({ main, detail, light }) => (
    <>
      <path
        d="M20 4 L30 18 M46 4 L36 18"
        stroke={detail}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect
        x="10"
        y="22"
        width="44"
        height="28"
        fill={main}
      />
      <ellipse
        cx="32"
        cy="50"
        rx="22"
        ry="7"
        fill={main}
      />
      <polyline
        points="10,27 20,46 32,27 44,46 54,27"
        fill="none"
        stroke={detail}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <ellipse
        cx="32"
        cy="22"
        rx="22"
        ry="7"
        fill={light}
      />
    </>
  ),
  car: ({ main, detail, light }) => (
    <>
      <path
        d="M4 40 L10 30 L22 28 L30 18 H44 L52 28 L60 32 V42 H4 Z"
        fill={main}
      />
      <path
        d="M32 21 H43 L48 28 H27 Z"
        fill={light}
      />
      <circle
        cx="16"
        cy="44"
        r="7"
        fill={detail}
      />
      <circle
        cx="48"
        cy="44"
        r="7"
        fill={detail}
      />
      <circle
        cx="16"
        cy="44"
        r="3"
        fill={light}
      />
      <circle
        cx="48"
        cy="44"
        r="3"
        fill={light}
      />
    </>
  ),
  microphone: ({ main, detail, light }) => (
    <>
      <circle
        cx="32"
        cy="20"
        r="14"
        fill={main}
      />
      <path
        d="M23 12 L41 28 M41 12 L23 28 M18 20 H46"
        stroke={detail}
        strokeWidth="2"
      />
      <rect
        x="28"
        y="32"
        width="8"
        height="26"
        rx="4"
        fill={main}
      />
      <rect
        x="24"
        y="31"
        width="16"
        height="5"
        rx="2"
        fill={light}
      />
    </>
  ),
  kazoo: ({ main, detail, light }) => (
    <>
      <path
        d="M8 28 H44 L60 33 L44 38 H8 C4 38 4 28 8 28 Z"
        fill={main}
      />
      <rect
        x="22"
        y="19"
        width="12"
        height="11"
        rx="3"
        fill={light}
      />
      <ellipse
        cx="28"
        cy="19"
        rx="7"
        ry="2.5"
        fill={detail}
      />
      <rect
        x="10"
        y="31"
        width="30"
        height="3"
        rx="1.5"
        fill={detail}
      />
    </>
  ),
  spring: ({ main, light }) => (
    <>
      {[49, 42, 35, 28, 21].map((cy, index) => (
        <ellipse
          key={cy}
          cx={36 - index * 2}
          cy={cy}
          rx="20"
          ry="6"
          fill="none"
          stroke={main}
          strokeWidth="4"
        />
      ))}
      <ellipse
        cx="26"
        cy="14"
        rx="20"
        ry="6"
        fill="none"
        stroke={light}
        strokeWidth="4"
      />
    </>
  ),
  kaleidoscope: ({ main, detail, light }) => (
    <g transform="rotate(-30 32 32)">
      <rect
        x="8"
        y="24"
        width="40"
        height="16"
        rx="3"
        fill={main}
      />
      <rect
        x="18"
        y="24"
        width="4"
        height="16"
        fill={detail}
      />
      <rect
        x="46"
        y="20"
        width="10"
        height="24"
        rx="3"
        fill={light}
      />
      <rect
        x="3"
        y="27"
        width="7"
        height="10"
        rx="2"
        fill={detail}
      />
    </g>
  ),
  yoyo: ({ main, detail, light }) => (
    <>
      <line
        x1="32"
        y1="2"
        x2="32"
        y2="28"
        stroke={light}
        strokeWidth="2"
      />
      <circle
        cx="32"
        cy="40"
        r="20"
        fill={main}
      />
      <circle
        cx="32"
        cy="40"
        r="13"
        fill="none"
        stroke={detail}
        strokeWidth="3"
      />
      <circle
        cx="32"
        cy="40"
        r="5"
        fill={light}
      />
    </>
  ),
  top: ({ main, detail, light }) => (
    <>
      <rect
        x="29"
        y="4"
        width="6"
        height="13"
        rx="3"
        fill={detail}
      />
      <path
        d="M10 22 H54 L34 58 Q32 61 30 58 Z"
        fill={main}
      />
      <path
        d="M14 31 H50"
        stroke={detail}
        strokeWidth="3"
      />
      <ellipse
        cx="32"
        cy="22"
        rx="22"
        ry="7"
        fill={light}
      />
    </>
  ),
  walkie: ({ main, detail, light }) => (
    <>
      <rect
        x="39"
        y="2"
        width="5"
        height="18"
        rx="2"
        fill={detail}
      />
      <rect
        x="16"
        y="16"
        width="32"
        height="46"
        rx="6"
        fill={main}
      />
      <rect
        x="22"
        y="22"
        width="20"
        height="10"
        rx="2"
        fill={light}
      />
      <path
        d="M22 40 H42 M22 46 H42 M22 52 H42"
        stroke={detail}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </>
  ),
  tinphone: ({ main, detail, light }) => (
    <>
      <path
        d="M12 30 C22 4 40 44 52 14"
        fill="none"
        stroke={detail}
        strokeWidth="2"
      />
      <rect
        x="4"
        y="30"
        width="16"
        height="24"
        rx="3"
        fill={main}
      />
      <ellipse
        cx="12"
        cy="30"
        rx="8"
        ry="3"
        fill={light}
      />
      <rect
        x="44"
        y="14"
        width="16"
        height="24"
        rx="3"
        fill={main}
      />
      <ellipse
        cx="52"
        cy="14"
        rx="8"
        ry="3"
        fill={light}
      />
    </>
  ),
  crown: ({ main, detail, light }) => (
    <>
      <path
        d="M6 46 L10 16 L22 32 L32 12 L42 32 L54 16 L58 46 Z"
        fill={main}
      />
      <rect
        x="6"
        y="44"
        width="52"
        height="10"
        rx="2"
        fill={light}
      />
      {[20, 32, 44].map((cx) => (
        <circle
          key={cx}
          cx={cx}
          cy="49"
          r="3"
          fill={detail}
        />
      ))}
    </>
  ),
  robot: ({ main, detail, light }) => (
    <>
      <line
        x1="32"
        y1="5"
        x2="32"
        y2="12"
        stroke={detail}
        strokeWidth="3"
      />
      <circle
        cx="32"
        cy="5"
        r="3"
        fill={light}
      />
      <rect
        x="18"
        y="12"
        width="28"
        height="20"
        rx="5"
        fill={main}
      />
      <circle
        cx="26"
        cy="22"
        r="3.5"
        fill={detail}
      />
      <circle
        cx="38"
        cy="22"
        r="3.5"
        fill={detail}
      />
      <rect
        x="16"
        y="34"
        width="32"
        height="24"
        rx="4"
        fill={main}
      />
      <rect
        x="24"
        y="40"
        width="16"
        height="8"
        rx="2"
        fill={light}
      />
      <rect
        x="8"
        y="36"
        width="6"
        height="16"
        rx="3"
        fill={main}
      />
      <rect
        x="50"
        y="36"
        width="6"
        height="16"
        rx="3"
        fill={main}
      />
    </>
  ),
  gift: ({ main, detail, light }) => (
    <>
      <rect
        x="10"
        y="28"
        width="44"
        height="30"
        rx="3"
        fill={main}
      />
      <rect
        x="6"
        y="20"
        width="52"
        height="10"
        rx="2"
        fill={light}
      />
      <rect
        x="29"
        y="20"
        width="6"
        height="38"
        fill={detail}
      />
      <path
        d="M32 20 C24 8 14 12 20 20 M32 20 C40 8 50 12 44 20"
        fill="none"
        stroke={detail}
        strokeWidth="3"
      />
    </>
  ),
};

/**
 * One prize from the arcade counter, drawn in colour or as a silhouette.
 *
 * @remarks
 * A module's prize stays a silhouette until every one of its tickets is earned,
 * so the same illustration has two states: three paints in colour, or one
 * silhouette colour (`--prize-silhouette`) that hides every detail.
 *
 * The illustration is decorative — whatever it means (the prize's name, whether
 * it is redeemed) must be said by nearby text — so it is hidden from assistive
 * technology.
 *
 * @example
 * ```tsx
 * <PrizeIcon prize="harmonica" locked={ticketsEarned < ticketCount} size={104} />
 * ```
 *
 * @param prize - Which prize to draw
 * @param locked - Draw the silhouette instead of the colour illustration
 * @param size - Width and height in pixels
 */
export function PrizeIcon({
  prize,
  locked = false,
  size = 96,
}: {
  prize: PrizeId;
  locked?: boolean;
  size?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      data-prize={prize}
      data-locked={locked}
      width={size}
      height={size}
      viewBox="0 0 64 64"
    >
      {PRIZE_SHAPES[prize](locked ? SILHOUETTE : COLOUR)}
    </svg>
  );
}

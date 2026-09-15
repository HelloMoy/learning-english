import type { LearnerIllustrationId } from "@/domain/entities/learner-profile/learner-profile";

import type { ReactNode } from "react";

const INK = "#1c1710";

/** Two dot eyes, shifted down by `offset` for faces drawn lower on the tile. */
function Eyes({ offset = 0 }: { offset?: number }) {
  return (
    <>
      <circle
        cx="50"
        cy={66 + offset}
        r="4"
        fill={INK}
      />
      <circle
        cx="70"
        cy={66 + offset}
        r="4"
        fill={INK}
      />
    </>
  );
}

function Smile({ x = 49, y = 79 }: { x?: number; y?: number }) {
  return (
    <path
      d={`M${x} ${y}q11 9 22 0`}
      stroke={INK}
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
  );
}

/**
 * The artwork of each illustration, drawn on a 120×120 tile. Colours are part
 * of the artwork rather than theme tokens: an avatar must look the same on
 * every surface and in every theme it appears on.
 */
const ARTWORK: Record<LearnerIllustrationId, ReactNode> = {
  sun: (
    <>
      <rect
        width="120"
        height="120"
        fill="#e7b64c"
      />
      <g
        stroke="#8a5e0f"
        strokeWidth="5"
        strokeLinecap="round"
      >
        <path d="M60 14v10" />
        <path d="M26 28l7 7" />
        <path d="M94 28l-7 7" />
        <path d="M14 64h10" />
        <path d="M96 64h10" />
      </g>
      <circle
        cx="60"
        cy="70"
        r="30"
        fill="#fff4d8"
      />
      <Eyes />
      <Smile />
    </>
  ),
  wave: (
    <>
      <rect
        width="120"
        height="120"
        fill="#4d6fa8"
      />
      <circle
        cx="60"
        cy="72"
        r="30"
        fill="#f4f1ea"
      />
      <path
        d="M28 62c4-22 20-32 36-30 14 2 24 12 28 26-10-6-18-2-26-8-8 6-22 4-38 12z"
        fill="#1c2a44"
      />
      <Eyes offset={6} />
      <Smile y={85} />
    </>
  ),
  leaf: (
    <>
      <rect
        width="120"
        height="120"
        fill="#5b8a72"
      />
      <path
        d="M60 40c-2-12 4-22 16-26-2 12-8 20-16 26z"
        fill="#a7d18a"
      />
      <path
        d="M60 40c0-10-6-16-14-18 0 8 6 14 14 18z"
        fill="#cfe8b4"
      />
      <circle
        cx="60"
        cy="72"
        r="30"
        fill="#f1e6d0"
      />
      <Eyes offset={6} />
      <Smile y={85} />
    </>
  ),
  plum: (
    <>
      <rect
        width="120"
        height="120"
        fill="#8a5fa8"
      />
      <circle
        cx="60"
        cy="30"
        r="14"
        fill="#3b2350"
      />
      <circle
        cx="60"
        cy="70"
        r="30"
        fill="#f4e4f7"
      />
      <path
        d="M30 64c2-18 14-28 30-28s28 10 30 28c-8-8-20-12-30-12s-22 4-30 12z"
        fill="#3b2350"
      />
      <Eyes offset={6} />
      <Smile y={84} />
    </>
  ),
  ember: (
    <>
      <rect
        width="120"
        height="120"
        fill="#c46b4a"
      />
      <circle
        cx="60"
        cy="68"
        r="30"
        fill="#ffe7d6"
      />
      <g
        fill="none"
        stroke="#2b1a12"
        strokeWidth="4"
      >
        <circle
          cx="49"
          cy="64"
          r="9"
        />
        <circle
          cx="71"
          cy="64"
          r="9"
        />
        <path d="M58 64h4" />
      </g>
      <circle
        cx="49"
        cy="64"
        r="3"
        fill="#2b1a12"
      />
      <circle
        cx="71"
        cy="64"
        r="3"
        fill="#2b1a12"
      />
      <Smile
        x={50}
        y={81}
      />
    </>
  ),
  echo: (
    <>
      <rect
        width="120"
        height="120"
        fill="#3f8f8f"
      />
      <circle
        cx="60"
        cy="68"
        r="30"
        fill="#e6f4f1"
      />
      <path
        d="M26 66c0-22 15-38 34-38s34 16 34 38"
        fill="none"
        stroke="#16302f"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <rect
        x="20"
        y="58"
        width="14"
        height="24"
        rx="6"
        fill="#16302f"
      />
      <rect
        x="86"
        y="58"
        width="14"
        height="24"
        rx="6"
        fill="#16302f"
      />
      <Eyes />
      <Smile />
    </>
  ),
  night: (
    <>
      <rect
        width="120"
        height="120"
        fill="#2b2d3a"
      />
      <path
        d="M74 30a32 32 0 1 0 16 56 26 26 0 1 1-16-56z"
        fill="#e7b64c"
      />
      <g fill="#f4f1ea">
        <circle
          cx="30"
          cy="30"
          r="2.5"
        />
        <circle
          cx="44"
          cy="96"
          r="2"
        />
        <circle
          cx="96"
          cy="24"
          r="2"
        />
        <circle
          cx="24"
          cy="70"
          r="1.8"
        />
      </g>
    </>
  ),
  schwa: (
    <>
      <rect
        width="120"
        height="120"
        fill="#d98b6a"
      />
      <path
        d="M24 34h72a10 10 0 0 1 10 10v34a10 10 0 0 1-10 10H54l-16 14v-14H24a10 10 0 0 1-10-10V44a10 10 0 0 1 10-10z"
        fill="#fff4ea"
      />
      <text
        x="60"
        y="76"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="42"
        fontWeight="700"
        fill={INK}
      >
        ə
      </text>
    </>
  ),
};

/**
 * One of the eight learner illustrations, filling its container.
 *
 * @remarks
 * Always decorative: whatever wears the illustration — an avatar, a picker
 * option — carries the accessible name.
 *
 * @param id - Which illustration to draw
 */
export function LearnerIllustration({ id }: { id: LearnerIllustrationId }) {
  return (
    <svg
      viewBox="0 0 120 120"
      aria-hidden="true"
      focusable="false"
      data-illustration={id}
      className="block size-full"
    >
      {ARTWORK[id]}
    </svg>
  );
}

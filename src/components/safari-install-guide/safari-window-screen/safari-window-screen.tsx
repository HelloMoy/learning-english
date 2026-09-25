"use client";

import { useTranslations } from "next-intl";
import type { CSSProperties, ReactNode } from "react";

import {
  isSafariInstallStep,
  type SafariGuideFrame,
  type SafariPlatform,
} from "../safari-install-steps/safari-install-steps";

/**
 * The depiction is a picture of Safari, not part of this app's design system,
 * so it is drawn with Apple's colours and fixed pixel sizes rather than the
 * project's theme tokens. Nothing here should follow the app's light/dark mode.
 *
 * The values are the ones the captures show. Safari tints its chrome with the
 * page's `theme-color`, and this app's is near-black, which is why the toolbar
 * is dark while the iPad's share popover stays on its light material.
 */
const SAFARI = {
  chrome: "#1c1c1e",
  chromeEdge: "rgba(255,255,255,0.10)",
  page: "#08080b",
  field: "rgba(120,120,128,0.24)",
  glyph: "rgba(235,235,245,0.62)",
  lightSheet: "#EDEDEF",
  lightCard: "#FFFFFF",
  darkSheet: "#2C2C2E",
  label: "#000000",
  labelOnDark: "#FFFFFF",
  secondary: "rgba(60,60,67,0.6)",
  secondaryOnDark: "rgba(235,235,245,0.6)",
  separator: "rgba(60,60,67,0.20)",
  separatorOnDark: "rgba(255,255,255,0.12)",
  muted: "rgba(120,120,128,0.20)",
  mutedOnDark: "rgba(235,235,245,0.18)",
  blue: "#0A84FF",
  green: "#34C759",
} as const;

/** The app's gold, used only to point at the control the step is about. */
const POINT = "#E7B64C";

const SANS = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif";

/**
 * Window sizes per platform: a portrait tablet and a landscape desktop window.
 *
 * @remarks
 * Exported so a caller can fit a depiction to the room it has without
 * hardcoding a copy that drifts.
 *
 * @category Components
 */
export const SAFARI_WINDOW_SIZE: Readonly<
  Record<SafariPlatform, { readonly width: number; readonly height: number }>
> = {
  ipad: { width: 300, height: 414 },
  mac: { width: 384, height: 292 },
} as const;

type SafariWindowScreenProps = {
  /** Which Safari is being depicted; decides the frame and the surfaces. */
  platform: SafariPlatform;
  /** The frame to depict; its `surface` decides which Safari screen is drawn. */
  step: SafariGuideFrame;
};

/**
 * A miniature Safari window showing the surface one install step happens on,
 * with that step's target control picked out.
 *
 * @remarks
 * Reconstructed from the real thing — the iPad from the iPadOS 26.5 simulator
 * and a recording of a device, the Mac from Safari 26.6.2 and a recording —
 * so the positions are the ones the learner will actually be hunting in.
 *
 * One component for two platforms, because Safari gives them one shape: a
 * toolbar with share at its trailing end, a popover hanging off that control
 * with the page **undimmed** behind it, and a confirmation over a **dimmed**
 * page. Three enumerable differences are all that separate them, and each is
 * drawn from the step rather than from a branch buried in the drawing code:
 *
 * - the iPad's popover carries an app row and a row of round actions, and has a
 *   collapsed state; the Mac's is one flat list that opens complete;
 * - the iPad confirms on a light card centred over the page, with **Add** at the
 *   top trailing corner and an *Open as Web App* switch; the Mac confirms on a
 *   sheet hung from the top of the window, with **Cancel** and **Add** at the
 *   bottom trailing corner and no switch;
 * - the icon comes to rest on a home screen, or in the Dock.
 *
 * The iPhone is not drawn here. Its surfaces rise from the bottom of a phone and
 * have their own component.
 *
 * Controls the learner does not need are drawn as unlabelled grey shapes at
 * their true position and size. Dropping them would be tidier and would also
 * move the target to a place it does not occupy on a real screen, which is the
 * one thing this component exists to get right.
 *
 * The target's label is read from the same message key the step's instruction
 * uses, so the picture and the sentence can never name different controls.
 *
 * It is `aria-hidden`: it repeats what the instruction already says, and a
 * screen reader walking a mock of someone else's UI would only be noise.
 *
 * @param props - See {@link SafariWindowScreenProps}
 * @returns A decorative miniature of the step's Safari window
 * @category Components
 */
export function SafariWindowScreen({ platform, step }: SafariWindowScreenProps) {
  const { width, height } = SAFARI_WINDOW_SIZE[platform];
  const isTablet = platform === "ipad";

  return (
    <div
      aria-hidden="true"
      style={{
        width: width + 12,
        height: height + 12,
        padding: 6,
        borderRadius: isTablet ? 30 : 16,
        background: "#0b0b0d",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.09), 0 18px 40px rgba(0,0,0,0.45)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "relative",
          width,
          height,
          borderRadius: isTablet ? 24 : 11,
          overflow: "hidden",
          background: SAFARI.page,
          fontFamily: SANS,
        }}
      >
        <PageBackdrop />
        <Toolbar
          platform={platform}
          pointed={step.surface === "toolbar"}
        />
        <Surface
          platform={platform}
          step={step}
        />
      </div>
    </div>
  );
}

/** Picks the Safari surface for the frame. */
function Surface({ platform, step }: { platform: SafariPlatform; step: SafariGuideFrame }) {
  const controls = useTranslations("Components.AddToHomeScreenGuide");

  // Before reading a target: the result frames have none, because the learner
  // acts on nothing there.
  if (!isSafariInstallStep(step))
    return step.surface === "home-screen" ? <HomeScreenResult /> : <DockResult />;

  if (step.surface === "toolbar") return null;

  const targetLabel = controls(step.targetKey);

  if (step.surface === "share-popover-collapsed")
    return <TabletPopover viewMoreLabel={targetLabel} />;

  if (step.surface === "share-popover")
    return platform === "ipad" ? (
      <TabletPopover targetLabel={targetLabel} />
    ) : (
      <DesktopPopover targetLabel={targetLabel} />
    );

  return (
    <>
      <PageDim />
      {platform === "ipad" ? (
        <TabletConfirm
          addLabel={targetLabel}
          title={controls("iosAddToHomeScreen")}
          switchLabel={controls("iosOpenAsWebApp")}
        />
      ) : (
        <DesktopConfirm
          addLabel={targetLabel}
          title={controls("macAddToDock")}
        />
      )}
    </>
  );
}

/**
 * Safari dims the page behind its confirmation and **not** behind its share
 * popover. Both were checked; getting it backwards would teach the learner that
 * the popover takes the page over, which it does not.
 */
function PageDim() {
  return (
    <div
      data-slot="scrim"
      className="guide-dim-in"
      style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 21 }}
    />
  );
}

/* ------------------------------------------------------------- small pieces */

/** An unlabelled stand-in for a control the learner does not need. */
function Muted({
  width,
  height,
  radius = 4,
  onDark = true,
  style,
}: {
  width: number | string;
  height: number;
  radius?: number | string;
  onDark?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: onDark ? SAFARI.mutedOnDark : SAFARI.muted,
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

/**
 * The outline and the repeating tap that together say *where* the tap lands,
 * rather than merely which control is outlined.
 */
function Pointer({ radius, inset = -4 }: { radius: number | string; inset?: number }) {
  return (
    <>
      <div
        className="guide-point"
        style={{
          position: "absolute",
          inset,
          borderRadius: radius,
          border: `2px solid ${POINT}`,
          pointerEvents: "none",
        }}
      />
      <span
        className="guide-tap"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 36,
          height: 36,
          marginLeft: -18,
          marginTop: -18,
          borderRadius: "50%",
          border: `2px solid ${POINT}`,
          pointerEvents: "none",
        }}
      />
    </>
  );
}

/** The course, blurred behind Safari's chrome — enough to read as this app. */
function PageBackdrop() {
  return (
    <div style={{ position: "absolute", inset: 0, padding: "14px 16px", paddingTop: 60 }}>
      <div
        style={{
          fontSize: 8,
          letterSpacing: 2,
          fontWeight: 800,
          color: "#f4f1ea",
          marginBottom: 14,
        }}
      >
        ENGLISH<span style={{ color: POINT, padding: "0 2px" }}>·</span>COURSE
      </div>
      <Muted
        width="72%"
        height={13}
        style={{ marginBottom: 7 }}
      />
      <Muted
        width="54%"
        height={13}
        style={{ marginBottom: 14 }}
      />
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {Array.from({ length: 3 }, (_, index) => (
          <Muted
            key={index}
            width="32%"
            height={46}
            radius={6}
          />
        ))}
      </div>
      <Muted
        width="44%"
        height={9}
        style={{ marginBottom: 9 }}
      />
      {Array.from({ length: 4 }, (_, index) => (
        <Muted
          key={index}
          width={index % 2 === 0 ? "88%" : "66%"}
          height={7}
          style={{ marginBottom: 7 }}
        />
      ))}
    </div>
  );
}

/** The app's icon: black plate, cinema letterbox bars, gold disc. */
function AppIcon({ size, radius = "22%" }: { size: number; radius?: number | string }) {
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: radius,
        overflow: "hidden",
        background: "#08080b",
        flexShrink: 0,
      }}
    >
      <div style={{ position: "absolute", inset: "0 0 87% 0", background: "#000" }} />
      <div style={{ position: "absolute", inset: "87% 0 0 0", background: "#000" }} />
      <div
        style={{
          position: "absolute",
          inset: "26% 24%",
          borderRadius: "50%",
          background: POINT,
        }}
      />
    </div>
  );
}

/**
 * Safari's toolbar. Share sits at the trailing end on both platforms — never in
 * a bottom bar, which is the iPhone's arrangement and not these.
 */
function Toolbar({ platform, pointed }: { platform: SafariPlatform; pointed: boolean }) {
  const isTablet = platform === "ipad";

  return (
    <div
      style={{
        position: "absolute",
        insetInline: 0,
        top: 0,
        zIndex: 20,
        background: SAFARI.chrome,
        borderBottom: `1px solid ${SAFARI.chromeEdge}`,
        paddingTop: isTablet ? 18 : 8,
      }}
    >
      {isTablet ? null : (
        <div style={{ display: "flex", gap: 5, padding: "0 10px 6px" }}>
          <Muted
            width={7}
            height={7}
            radius="50%"
          />
          <Muted
            width={7}
            height={7}
            radius="50%"
          />
          <Muted
            width={7}
            height={7}
            radius="50%"
          />
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 10px 8px",
        }}
      >
        <Muted
          width={16}
          height={16}
          radius={5}
        />
        <div
          style={{
            flex: 1,
            height: 22,
            borderRadius: 11,
            background: SAFARI.field,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 8.5,
            color: SAFARI.glyph,
          }}
        >
          english-course.online
        </div>
        <div style={{ position: "relative", display: "flex", gap: 7, alignItems: "center" }}>
          <div
            style={{
              position: "relative",
              width: 16,
              height: 16,
              borderRadius: 4,
              background: pointed ? "rgba(231,182,76,0.22)" : "transparent",
              display: "grid",
              placeItems: "center",
            }}
          >
            <ShareGlyph color={pointed ? POINT : SAFARI.glyph} />
            {pointed ? <Pointer radius={6} /> : null}
          </div>
          <Muted
            width={12}
            height={12}
            radius={3}
          />
          <Muted
            width={12}
            height={12}
            radius={3}
          />
        </div>
      </div>
    </div>
  );
}

/** The square-with-an-arrow Safari puts on its share control. */
function ShareGlyph({ color }: { color: string }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 15V3m0 0L8 7m4-4 4 4" />
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}

/**
 * The chevron on the control that opens the popover out. It points down while
 * there is more to show and up once there is not, which is how iPadOS marks
 * the difference between View More and View Less.
 */
function ChevronGlyph({ pointsUp }: { pointsUp: boolean }) {
  return (
    <svg
      data-glyph={pointsUp ? "chevron-up" : "chevron-down"}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={SAFARI.label}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={pointsUp ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} />
    </svg>
  );
}

/**
 * The square-with-a-plus iOS puts beside "Add to Home Screen" — the same mark
 * the header chip wears, so the learner is hunting for an icon they have
 * already seen.
 */
function AddToHomeScreenGlyph({ color }: { color: string }) {
  return (
    <svg
      data-glyph="square-plus"
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="4"
      />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

/**
 * The display Safari puts beside "Add to Dock". Deliberately not the square-
 * and-plus of iOS: a Mac is gaining an icon in its Dock, not a tile on a home
 * screen it does not have, and Safari marks the two differently.
 */
function AddToDockGlyph({ color }: { color: string }) {
  return (
    <svg
      data-glyph="add-to-dock"
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="4"
      />
      <path d="M9 15.5h6" />
    </svg>
  );
}

/** A round share-sheet action: a grey disc, with a glyph when it has one. */
function RoundAction({ children }: { children?: ReactNode }) {
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        background: SAFARI.muted,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------ iPad surfaces */

const TABLET_ROUND_ACTIONS = 4;

/**
 * The iPad's share popover, in both the state it opens in and the state
 * **View More** leaves it in.
 *
 * @remarks
 * One component rather than two, because the learner sees one popover growing:
 * the header, app row and round actions are identical across the two states and
 * only the list below them arrives. Two components would let those drift.
 *
 * The last round action is named only while collapsed. iPadOS relabels it
 * **View Less** once open, so carrying the label across would put a word on the
 * depiction that the learner's iPad does not show.
 */
function TabletPopover({
  viewMoreLabel,
  targetLabel,
}: {
  viewMoreLabel?: string;
  targetLabel?: string;
}) {
  const isExpanded = targetLabel !== undefined;

  return (
    <div
      data-slot="share-popover"
      className="guide-popover-pop"
      style={{
        position: "absolute",
        top: 54,
        right: 8,
        width: 178,
        zIndex: 22,
        borderRadius: 13,
        background: SAFARI.lightSheet,
        boxShadow: "0 14px 34px rgba(0,0,0,0.42)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 9,
        paddingBottom: 14,
      }}
    >
      <PopoverSiteHeader />
      <Muted
        width={52}
        height={13}
        radius={7}
        onDark={false}
        style={{ marginLeft: 2 }}
      />
      <div style={{ display: "flex", gap: 10, paddingInline: 2 }}>
        {Array.from({ length: 3 }, (_, index) => (
          <Muted
            key={index}
            width={30}
            height={30}
            radius={7}
            onDark={false}
          />
        ))}
      </div>
      <div
        data-slot="round-actions"
        style={{ display: "flex", gap: 10, paddingInline: 2 }}
      >
        {Array.from({ length: TABLET_ROUND_ACTIONS }, (_, index) => {
          const isLast = index === TABLET_ROUND_ACTIONS - 1;
          if (!isLast) return <RoundAction key={index} />;

          return (
            <div
              key={index}
              style={{ position: "relative", width: 30 }}
            >
              <RoundAction>
                <ChevronGlyph pointsUp={isExpanded} />
              </RoundAction>
              {isExpanded ? null : (
                <>
                  <div
                    style={{
                      fontSize: 6.5,
                      textAlign: "center",
                      marginTop: 2,
                      color: SAFARI.label,
                      fontWeight: 600,
                    }}
                  >
                    {viewMoreLabel}
                  </div>
                  <Pointer radius={12} />
                </>
              )}
            </div>
          );
        })}
      </div>
      {isExpanded ? <TabletPopoverList targetLabel={targetLabel} /> : null}
    </div>
  );
}

/** Icon, title and host — the same on both platforms' popovers. */
function PopoverSiteHeader({ onDark = false }: { onDark?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", padding: 2 }}>
      <AppIcon size={30} />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: onDark ? SAFARI.labelOnDark : SAFARI.label,
          }}
        >
          English Course
        </div>
        <div
          style={{
            fontSize: 7.5,
            color: onDark ? SAFARI.secondaryOnDark : SAFARI.secondary,
          }}
        >
          english-course.online
        </div>
      </div>
    </div>
  );
}

/**
 * The list "View More" reveals. Drawn complete, because on an iPad it fits
 * without scrolling — the learner is not being asked to hunt down a list.
 */
function TabletPopoverList({ targetLabel }: { targetLabel: string }) {
  const TARGET_INDEX = 3;
  const ROWS = 6;

  return (
    <div
      data-slot="popover-list"
      style={{
        borderRadius: 9,
        background: SAFARI.lightCard,
      }}
    >
      {Array.from({ length: ROWS }, (_, index) => (
        <PopoverRow
          key={index}
          label={index === TARGET_INDEX ? targetLabel : undefined}
          glyph={
            index === TARGET_INDEX ? (colour) => <AddToHomeScreenGlyph color={colour} /> : undefined
          }
          pointed={index === TARGET_INDEX}
          isLast={index === ROWS - 1}
        />
      ))}
    </div>
  );
}

/** One row of a popover list: named and pointed at, or an unlabelled stand-in. */
function PopoverRow({
  label,
  glyph,
  pointed = false,
  isLast = false,
  onDark = false,
}: {
  label?: string;
  glyph?: (color: string) => ReactNode;
  pointed?: boolean;
  isLast?: boolean;
  onDark?: boolean;
}) {
  const labelColour = pointed
    ? onDark
      ? POINT
      : "#7a4e25"
    : onDark
      ? SAFARI.labelOnDark
      : SAFARI.label;

  return (
    <div
      data-slot="popover-row"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "6px 8px",
        borderBottom: isLast
          ? undefined
          : `1px solid ${onDark ? SAFARI.separatorOnDark : SAFARI.separator}`,
        background: pointed ? "rgba(231,182,76,0.20)" : undefined,
      }}
    >
      {glyph === undefined ? (
        <Muted
          width={11}
          height={11}
          radius={3}
          onDark={onDark}
        />
      ) : (
        <span style={{ display: "grid", placeItems: "center", flexShrink: 0 }}>
          {glyph(labelColour)}
        </span>
      )}
      {label === undefined ? (
        <Muted
          width="58%"
          height={6}
          onDark={onDark}
        />
      ) : (
        <span style={{ fontSize: 7.5, fontWeight: 600, color: labelColour }}>{label}</span>
      )}
      {pointed ? (
        <Pointer
          radius={5}
          inset={-2}
        />
      ) : null}
    </div>
  );
}

/**
 * The iPad's confirmation: a light card centred over a dimmed page, with
 * **Add** at the top trailing corner and the web app switch already on.
 */
function TabletConfirm({
  addLabel,
  title,
  switchLabel,
}: {
  addLabel: string;
  title: string;
  switchLabel: string;
}) {
  return (
    <div
      className="guide-confirm-pop"
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%,-50%)",
        width: 208,
        zIndex: 23,
        borderRadius: 12,
        overflow: "hidden",
        background: SAFARI.lightSheet,
        boxShadow: "0 18px 40px rgba(0,0,0,0.5)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "7px 8px",
        }}
      >
        <Muted
          width={15}
          height={15}
          radius="50%"
          onDark={false}
        />
        <div style={{ fontSize: 8, fontWeight: 600, color: SAFARI.label }}>{title}</div>
        <div style={{ position: "relative" }}>
          <div
            style={{
              padding: "3px 9px",
              borderRadius: 9,
              background: SAFARI.blue,
              color: "#fff",
              fontSize: 7.5,
              fontWeight: 700,
            }}
          >
            {addLabel}
          </div>
          <Pointer radius={9} />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          padding: "8px",
          background: SAFARI.lightCard,
        }}
      >
        <AppIcon size={28} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 8.5, color: SAFARI.label }}>English Course</div>
          <div style={{ fontSize: 7, color: SAFARI.secondary }}>english-course.online/en</div>
        </div>
      </div>
      <div
        data-slot="web-app-switch"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "7px 8px",
          background: SAFARI.lightCard,
          borderTop: `1px solid ${SAFARI.separator}`,
        }}
      >
        <span style={{ fontSize: 7.5, color: SAFARI.label }}>{switchLabel}</span>
        <div
          style={{
            width: 22,
            height: 13,
            borderRadius: 7,
            background: SAFARI.green,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: 1.5,
              top: 1.5,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#fff",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/** The icon at rest on an iPad home screen, among the learner's other apps. */
function HomeScreenResult() {
  return (
    <div
      data-slot="home-screen"
      className="guide-dim-in"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 24,
        background: "linear-gradient(150deg,#2f5f7a,#63a08f 60%,#c9d6cf)",
        padding: "56px 20px 0",
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        gap: 16,
        alignContent: "start",
      }}
    >
      {Array.from({ length: 8 }, (_, index) =>
        index === 5 ? (
          <div
            key={index}
            style={{ display: "grid", placeItems: "center", gap: 3, position: "relative" }}
          >
            <AppIcon
              size={40}
              radius={10}
            />
            <div style={{ fontSize: 6.5, color: "#fff", fontWeight: 600 }}>English</div>
            <Pointer radius={12} />
          </div>
        ) : (
          <div
            key={index}
            style={{ display: "grid", placeItems: "center", gap: 3 }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "rgba(255,255,255,0.28)",
              }}
            />
            <div
              style={{ width: 22, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.4)" }}
            />
          </div>
        ),
      )}
    </div>
  );
}

/* ------------------------------------------------------------- Mac surfaces */

/**
 * The Mac's share popover: one flat list that opens complete.
 *
 * @remarks
 * No round-action row and no second state, because Safari on macOS has neither.
 * **Add to Dock** sits at its real position among the other rows rather than
 * first — putting it first would teach a place the learner will not find it.
 */
function DesktopPopover({ targetLabel }: { targetLabel: string }) {
  const TARGET_INDEX = 4;
  const ROWS = 7;

  return (
    <div
      data-slot="share-popover"
      className="guide-popover-pop"
      style={{
        position: "absolute",
        top: 46,
        right: 10,
        width: 150,
        zIndex: 22,
        borderRadius: 10,
        background: SAFARI.darkSheet,
        boxShadow: "0 14px 34px rgba(0,0,0,0.55)",
        overflow: "hidden",
        padding: 6,
      }}
    >
      <PopoverSiteHeader onDark />
      <div
        style={{
          height: 1,
          background: SAFARI.separatorOnDark,
          margin: "5px 2px",
        }}
      />
      {Array.from({ length: ROWS }, (_, index) => (
        <PopoverRow
          key={index}
          label={index === TARGET_INDEX ? targetLabel : undefined}
          glyph={index === TARGET_INDEX ? (colour) => <AddToDockGlyph color={colour} /> : undefined}
          pointed={index === TARGET_INDEX}
          isLast={index === ROWS - 1}
          onDark
        />
      ))}
    </div>
  );
}

/**
 * The Mac's confirmation: a sheet hung from the top of the window, confirming
 * from the **bottom** trailing corner, with no web app switch — Safari on macOS
 * offers none, so drawing one would invent a control.
 */
function DesktopConfirm({ addLabel, title }: { addLabel: string; title: string }) {
  return (
    <div
      className="guide-sheet-drop"
      style={{
        position: "absolute",
        left: "50%",
        top: 46,
        transform: "translateX(-50%)",
        width: 236,
        zIndex: 23,
        borderRadius: 10,
        background: SAFARI.darkSheet,
        boxShadow: "0 18px 40px rgba(0,0,0,0.55)",
        padding: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 8.5, fontWeight: 600, color: SAFARI.labelOnDark }}>{title}</div>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          padding: 7,
          borderRadius: 7,
          background: "rgba(255,255,255,0.06)",
        }}
      >
        <AppIcon size={28} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 8.5, color: SAFARI.labelOnDark }}>English Course</div>
          <div style={{ fontSize: 7, color: SAFARI.secondaryOnDark }}>english-course.online/en</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 7, justifyContent: "flex-end", alignItems: "center" }}>
        <Muted
          width={34}
          height={15}
          radius={5}
        />
        <div style={{ position: "relative" }}>
          <div
            style={{
              padding: "3px 10px",
              borderRadius: 5,
              background: SAFARI.blue,
              color: "#fff",
              fontSize: 7.5,
              fontWeight: 700,
            }}
          >
            {addLabel}
          </div>
          <Pointer radius={6} />
        </div>
      </div>
    </div>
  );
}

/** The icon at rest in the Dock, among the learner's other applications. */
function DockResult() {
  return (
    <div
      data-slot="dock"
      className="guide-dim-in"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 24,
        background: "linear-gradient(150deg,#1d3a4d,#3f6f7e 60%,#8fa9a6)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        paddingBottom: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 9,
          alignItems: "flex-end",
          padding: "7px 10px",
          borderRadius: 14,
          background: "rgba(255,255,255,0.22)",
          boxShadow: "0 6px 18px rgba(0,0,0,0.3)",
        }}
      >
        {Array.from({ length: 6 }, (_, index) =>
          index === 3 ? (
            <div
              key={index}
              style={{ position: "relative" }}
            >
              <AppIcon
                size={34}
                radius={9}
              />
              <Pointer radius={11} />
            </div>
          ) : (
            <div
              key={index}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "rgba(255,255,255,0.4)",
              }}
            />
          ),
        )}
      </div>
    </div>
  );
}

export type { SafariWindowScreenProps };

/** Kept for callers that want the node type without importing React types. */
export type SafariWindowScreenNode = ReactNode;

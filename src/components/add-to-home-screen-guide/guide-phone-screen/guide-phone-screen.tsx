"use client";

import { useTranslations } from "next-intl";
import type { CSSProperties, ReactNode } from "react";

import type { GuideFrame } from "../install-steps/install-steps";

/**
 * The depiction is a picture of iOS, not part of this app's design system, so
 * it is drawn with Apple's colours and fixed pixel sizes rather than the
 * project's theme tokens. Nothing here should follow the app's light/dark mode:
 * the learner's Safari looks like this either way.
 */
const IOS = {
  sheet: "#F2F2F7",
  card: "#FFFFFF",
  label: "#000000",
  secondary: "rgba(60,60,67,0.6)",
  separator: "rgba(60,60,67,0.22)",
  muted: "rgba(120,120,128,0.18)",
  mutedOnDark: "rgba(235,235,245,0.28)",
  blue: "#007AFF",
  green: "#34C759",
  bar: "rgba(44,44,46,0.94)",
  menu: "rgba(58,58,60,0.97)",
} as const;

/** The app's gold, used only to point at the control the step is about. */
const POINT = "#E7B64C";

const SCREEN_W = 274;
const SCREEN_H = 586;

/**
 * The depiction's full outer height, bezel included. Exported so a caller can
 * fit it to the room it has without hardcoding a copy that drifts.
 *
 * @category Components
 */
export const PHONE_HEIGHT = SCREEN_H + 12;
const SHEET_TOP = 44;

const SANS = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif";

type GuidePhoneScreenProps = {
  /** The frame to depict; its `surface` decides which iOS screen is drawn. */
  step: GuideFrame;
};

/**
 * A miniature iPhone showing the iOS surface one install step happens on, with
 * that step's target control picked out.
 *
 * @remarks
 * Reconstructed from a screen recording of the real device, so the positions
 * are the ones the learner will actually be hunting in: iOS 26 Safari's bottom
 * bar, the menu behind "···", the share sheet in both the state it opens in and
 * the state "View More" leaves it in, and the confirmation screen.
 *
 * The share sheet is two surfaces rather than one because the learner sees two.
 * It opens collapsed, with no list on it at all, and the guide that drew only
 * the expanded one was sending learners to scroll a list their phone was not
 * showing. The two share {@link ShareSheetTop}, so the second reads as the
 * first having grown.
 *
 * Controls the learner does not need are drawn as unlabelled grey shapes at
 * their true position and size. Dropping them would be tidier and would also
 * move the target to a height it does not occupy on a real phone, which is the
 * one thing this component exists to get right.
 *
 * The target's label is read from the same message key the step's instruction
 * uses, so the picture and the sentence can never name different controls — and
 * a learner whose phone is in Spanish sees «Compartir» here, not "Share".
 *
 * It is `aria-hidden`: it repeats what the instruction already says, and a
 * screen reader walking a mock of someone else's UI would only be noise.
 *
 * @param props - See {@link GuidePhoneScreenProps}
 * @returns A decorative miniature of the step's iOS screen
 * @category Components
 */
export function GuidePhoneScreen({ step }: GuidePhoneScreenProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: SCREEN_W + 12,
        height: SCREEN_H + 12,
        padding: 6,
        borderRadius: 42,
        background: "#0b0b0d",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.09), 0 18px 40px rgba(0,0,0,0.45)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "relative",
          width: SCREEN_W,
          height: SCREEN_H,
          borderRadius: 36,
          overflow: "hidden",
          background: "#08080b",
          fontFamily: SANS,
        }}
      >
        <PageBackdrop />
        <Surface step={step} />
        <StatusBar />
      </div>
    </div>
  );
}

/** Picks the iOS screen for the frame. */
function Surface({ step }: { step: GuideFrame }) {
  const t = useTranslations("Components.AddToHomeScreenGuide");

  // Before reading a target: the result frame has none, because the learner
  // taps nothing on it.
  if (step.surface === "home-screen") return <HomeScreenSurface />;

  const targetLabel = t(step.targetKey);

  if (step.surface === "safari-bar")
    return (
      <SafariBar
        moreLabel={targetLabel}
        pointed
      />
    );

  if (step.surface === "more-menu")
    return (
      <>
        <SafariBar moreLabel={t("iosMore")} />
        <MoreMenu shareLabel={targetLabel} />
      </>
    );

  if (step.surface === "share-sheet-collapsed")
    return (
      <>
        <SheetDim />
        <CollapsedShareSheet viewMoreLabel={targetLabel} />
      </>
    );

  if (step.surface === "share-sheet")
    return (
      <>
        <SheetDim />
        <ExpandedShareSheet targetLabel={targetLabel} />
      </>
    );

  return (
    <>
      <SheetDim />
      <ConfirmSheet
        addLabel={targetLabel}
        toggleLabel={t("iosOpenAsWebApp")}
      />
    </>
  );
}

/** iOS darkens the page behind a sheet as it rises; without it the sheet looks pasted on. */
function SheetDim() {
  return (
    <div
      className="guide-dim-in"
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 21,
      }}
    />
  );
}

/* ------------------------------------------------------------- small pieces */

/** An unlabelled stand-in for a control the learner does not need. */
function Muted({
  width,
  height,
  radius = 4,
  onDark = false,
}: {
  width: number | string;
  height: number;
  radius?: number;
  onDark?: boolean;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: onDark ? IOS.mutedOnDark : IOS.muted,
        flexShrink: 0,
      }}
    />
  );
}

/**
 * Marks the control this step is about: a ring around it, and a pulse landing on
 * it.
 *
 * @remarks
 * The outline alone says which control; the pulse says a finger goes *there*,
 * which is the part a still picture cannot carry. Both animations live in
 * `globals.css`, so the project's `prefers-reduced-motion` rule stops them.
 *
 * Every caller sits inside a positioned box, which is what the pulse centres on.
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
          width: 40,
          height: 40,
          marginLeft: -20,
          marginTop: -20,
          borderRadius: "50%",
          border: `2px solid ${POINT}`,
          pointerEvents: "none",
        }}
      />
    </>
  );
}

function StatusBar() {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 40, zIndex: 30 }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 8,
          transform: "translateX(-50%)",
          width: 78,
          height: 22,
          borderRadius: 999,
          background: "#000",
        }}
      />
    </div>
  );
}

/** A pared-back stand-in for the course page, so the bar has something to sit over. */
function PageBackdrop() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(178deg,#1a1205 0%,#08080b 42%)",
        padding: "54px 18px 0",
      }}
    >
      <div style={{ fontSize: 8, letterSpacing: 1.4, fontWeight: 700, color: POINT }}>
        AHORA EN EMISIÓN
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 22,
          lineHeight: 1.08,
          fontWeight: 800,
          letterSpacing: -0.6,
          color: "#f4f1ea",
        }}
      >
        Empieza donde
        <br />
        esté tu oído
      </div>
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 5 }}>
        <Muted
          width="100%"
          height={5}
          onDark
        />
        <Muted
          width="82%"
          height={5}
          onDark
        />
      </div>
      <div
        style={{
          marginTop: 20,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.09)",
          background: "linear-gradient(160deg,#241d10,#15130f)",
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 7,
        }}
      >
        <Muted
          width="55%"
          height={5}
          onDark
        />
        <div style={{ fontSize: 13, fontWeight: 700, color: "#f4f1ea" }}>Introduction</div>
        <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.14)" }}>
          <div style={{ width: "14%", height: "100%", borderRadius: 2, background: POINT }} />
        </div>
      </div>

      {/* A second card, so the page reads as scrollable content rather than
          stopping halfway down the screen. */}
      <div
        style={{
          marginTop: 14,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.07)",
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 7,
        }}
      >
        <Muted
          width="48%"
          height={5}
          onDark
        />
        <Muted
          width="86%"
          height={9}
          onDark
        />
        <Muted
          width="64%"
          height={5}
          onDark
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- iOS surfaces */

const CIRCLE: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: "50%",
  background: IOS.bar,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  position: "relative",
};

/** iOS 26's floating bottom bar. There is no share glyph on it — that is the point. */
function SafariBar({ moreLabel, pointed = false }: { moreLabel: string; pointed?: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 12,
        height: 38,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0 10px",
        zIndex: 20,
      }}
    >
      <div style={CIRCLE}>
        <div
          style={{
            width: 7,
            height: 7,
            borderTop: "1.6px solid #d5d5d8",
            borderLeft: "1.6px solid #d5d5d8",
            transform: "rotate(-45deg)",
            marginLeft: 2,
          }}
        />
      </div>

      <div
        style={{
          flex: 1,
          height: 38,
          borderRadius: 999,
          background: IOS.bar,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 12, color: "#eaeaec" }}>localhost</span>
      </div>

      <div
        style={{
          ...CIRCLE,
          background: pointed ? "rgba(231,182,76,0.22)" : IOS.bar,
        }}
      >
        <span
          style={{
            fontSize: 15,
            lineHeight: 1,
            fontWeight: 700,
            letterSpacing: 0.5,
            color: pointed ? POINT : "#d5d5d8",
            transform: "translateY(-3px)",
          }}
        >
          {moreLabel}
        </span>
        {pointed ? <Pointer radius="50%" /> : null}
      </div>
    </div>
  );
}

/** The panel behind "···". Share is its first row. */
function MoreMenu({ shareLabel }: { shareLabel: string }) {
  return (
    <div
      className="guide-menu-pop"
      style={{
        position: "absolute",
        right: 10,
        bottom: 56,
        width: 176,
        borderRadius: 16,
        background: IOS.menu,
        padding: "6px 0",
        zIndex: 25,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 10,
          height: 34,
          padding: "0 12px",
          background: "rgba(231,182,76,0.2)",
        }}
      >
        <ShareGlyph color={POINT} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: POINT }}>{shareLabel}</span>
        <Pointer
          radius={8}
          inset={2}
        />
      </div>

      {[0, 1, 2].map((row) => (
        <div
          key={row}
          style={{ display: "flex", alignItems: "center", gap: 10, height: 34, padding: "0 12px" }}
        >
          <Muted
            width={14}
            height={14}
            radius={3}
            onDark
          />
          <Muted
            width={row === 2 ? 74 : 96}
            height={7}
            onDark
          />
        </div>
      ))}
    </div>
  );
}

function ShareGlyph({ color }: { color: string }) {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line
        x1="12"
        x2="12"
        y1="2"
        y2="15"
      />
    </svg>
  );
}

function PlusSquareGlyph({ color }: { color: string }) {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.9}
      strokeLinecap="round"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
      />
      <path d="M8 12h8M12 8v8" />
    </svg>
  );
}

const SHEET_BASE: CSSProperties = {
  position: "absolute",
  top: SHEET_TOP,
  left: 0,
  right: 0,
  bottom: 0,
  background: IOS.sheet,
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  zIndex: 22,
};

function Hairline() {
  return <div style={{ height: 1, background: IOS.separator, margin: "12px 14px" }} />;
}

/**
 * The share sheet as it opens: a header, an app row, and the row of actions
 * ending in "View More". Nothing else — there is no list on it yet.
 *
 * @remarks
 * This is the state iOS 26 actually opens in, and the reason the flow has a tap
 * the guide used to skip. `Add to Home Screen` is not reachable from here.
 */
function CollapsedShareSheet({ viewMoreLabel }: { viewMoreLabel: string }) {
  return (
    <div
      className="guide-sheet-rise"
      // `top: auto` is what makes this a short sheet: its height is its rows,
      // so it sits at the bottom with the page still visible above it, the way
      // the real one does. A fixed top would be a number to keep in step with
      // whatever the rows come to.
      style={{ ...SHEET_BASE, top: "auto", paddingTop: 14, paddingBottom: 22 }}
    >
      <ShareSheetTop lastAction={<ViewMoreTarget label={viewMoreLabel} />} />
    </div>
  );
}

/**
 * The same sheet once "View More" has opened it out, with "Add to Home Screen"
 * down in the list where it really is.
 *
 * @remarks
 * It renders {@link ShareSheetTop} rather than redrawing it, so that moving
 * from the collapsed frame to this one reads as the one sheet growing. Two
 * hand-drawn copies of those rows would drift, and the learner would see two
 * unrelated screens.
 */
function ExpandedShareSheet({ targetLabel }: { targetLabel: string }) {
  return (
    <div
      className="guide-sheet-rise"
      style={{ ...SHEET_BASE, paddingTop: 14 }}
    >
      <ShareSheetTop lastAction={<SheetAlreadyOpenControl />} />

      <div
        data-sheet-list
        style={{
          margin: "14px 12px 0",
          borderRadius: 12,
          background: IOS.card,
          overflow: "hidden",
        }}
      >
        {[0, 1, 2].map((row) => (
          <div key={row}>
            {row > 0 ? (
              <div style={{ height: 1, background: IOS.separator, marginLeft: 38 }} />
            ) : null}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                height: 34,
                padding: "0 12px",
              }}
            >
              <Muted
                width={15}
                height={15}
                radius={3}
              />
              <Muted
                width={row === 1 ? 78 : 98}
                height={7}
              />
            </div>
          </div>
        ))}

        <div style={{ height: 1, background: IOS.separator, marginLeft: 38 }} />
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 12,
            height: 36,
            padding: "0 12px",
            background: "rgba(231,182,76,0.24)",
          }}
        >
          <PlusSquareGlyph color="#8a5e0f" />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: IOS.label }}>{targetLabel}</span>
          <Pointer
            radius={8}
            inset={1}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * The rows both states of the share sheet share: header, apps, actions.
 *
 * @remarks
 * `lastAction` is the one thing the two states differ in. It is passed in
 * rather than chosen from a flag because the difference is not a variation on
 * one control: collapsed, it is the target and carries its name; expanded, it
 * is a control the learner is done with, and iOS has relabelled it "View Less".
 */
function ShareSheetTop({ lastAction }: { lastAction: ReactNode }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 7,
            background: "linear-gradient(160deg,#241d10,#0d0d12)",
            flexShrink: 0,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Muted
            width={96}
            height={8}
          />
          <Muted
            width={58}
            height={7}
          />
        </div>
      </div>

      <Hairline />

      <Row>
        {[0, 1, 2].map((i) => (
          <Muted
            key={i}
            width={42}
            height={42}
            radius={10}
          />
        ))}
      </Row>

      <Hairline />

      <ShareSheetActions lastAction={lastAction} />
    </>
  );
}

/** The row of round actions. The first three are ones the learner never needs. */
function ShareSheetActions({ lastAction }: { lastAction: ReactNode }) {
  return (
    <div
      data-sheet-actions
      style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "0 14px" }}
    >
      {[0, 1, 2].map((i) => (
        <Muted
          key={i}
          width={36}
          height={36}
          radius={18}
        />
      ))}
      {lastAction}
    </div>
  );
}

/** The control that opens the sheet out, named and pointed at. */
function ViewMoreTarget({ label }: { label: string }) {
  return (
    <div style={{ width: 36, flexShrink: 0 }}>
      {/* The pointer centres on its positioned parent, so that parent is the
          circle alone — wrapping the label too would land the pulse between
          the two. */}
      <div
        style={{
          position: "relative",
          width: 36,
          height: 36,
          borderRadius: 18,
          background: "rgba(231,182,76,0.28)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SheetChevronGlyph
          color="#8a5e0f"
          pointing="up"
        />
        <Pointer radius="50%" />
      </div>
      <div
        style={{
          marginTop: 4,
          textAlign: "center",
          fontSize: 7,
          lineHeight: 1.2,
          fontWeight: 700,
          color: "#8a5e0f",
        }}
      >
        {label}
      </div>
    </div>
  );
}

/**
 * The same control once the sheet is open, in the same place, unnamed.
 *
 * @remarks
 * Unnamed on purpose. iOS relabels it "View Less" here, so carrying the "View
 * More" label across would put a word on the depiction that the learner's phone
 * does not show — the exact failure the guide exists to avoid. Naming it "View
 * Less" instead would translate a control the guide never asks anyone to tap.
 * The place and the chevron are what carry the continuity; the chevron turns
 * over, because on the real sheet it does.
 */
function SheetAlreadyOpenControl() {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        background: IOS.muted,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <SheetChevronGlyph
        color={IOS.secondary}
        pointing="down"
      />
    </div>
  );
}

function SheetChevronGlyph({ color, pointing }: { color: string; pointing: "up" | "down" }) {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: pointing === "down" ? "rotate(180deg)" : undefined }}
    >
      <path d="m5 15 7-7 7 7" />
    </svg>
  );
}

function Row({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "0 14px", justifyContent: "flex-start" }}>
      {children}
    </div>
  );
}

/** The confirmation screen. Its toggle is what makes the icon launch as an app. */
function ConfirmSheet({ addLabel, toggleLabel }: { addLabel: string; toggleLabel: string }) {
  return (
    <div
      className="guide-sheet-rise"
      style={{ ...SHEET_BASE, paddingTop: 12 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px 12px",
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: IOS.card,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width={12}
            height={12}
            viewBox="0 0 24 24"
            fill="none"
            stroke={IOS.label}
            strokeWidth={2.6}
            strokeLinecap="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </div>

        <Muted
          width={104}
          height={9}
        />

        <div style={{ position: "relative" }}>
          <div
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              background: IOS.blue,
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {addLabel}
          </div>
          <Pointer radius={999} />
        </div>
      </div>

      <div
        style={{
          background: IOS.card,
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 9,
            background: "#111014",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div style={{ width: 15, height: 15, borderRadius: "50%", background: POINT }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          <span style={{ fontSize: 12, color: IOS.label }}>English Course</span>
          <div style={{ height: 1, background: IOS.separator }} />
          <Muted
            width="72%"
            height={7}
          />
        </div>
      </div>

      <div style={{ height: 16 }} />

      <div
        style={{
          background: IOS.card,
          padding: "11px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 12, color: IOS.label }}>{toggleLabel}</span>
        <div
          style={{
            width: 38,
            height: 23,
            borderRadius: 999,
            background: IOS.green,
            padding: 2,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div style={{ width: 19, height: 19, borderRadius: "50%", background: "#fff" }} />
        </div>
      </div>

      <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 5 }}>
        <Muted
          width="94%"
          height={6}
        />
        <Muted
          width="62%"
          height={6}
        />
      </div>
    </div>
  );
}

/** The wallpaper the reference recording lands on, pared back to its colours. */
const HOME_APPS = ["#2fd06a", "#1c1c1e", "#f2b23e", "#3aa0ff", "#4a90d9", "#8e8e93"];

/**
 * Where the four taps end: the course sitting among the learner's other apps.
 *
 * @remarks
 * Nothing here is pointed at. There is no control to tap on this screen — it is
 * the result, not a step — and a pointer would invent one.
 *
 * The name under the icon is the brand, which `messages.test.ts` pins identical
 * in every locale, so it is written out rather than translated.
 */
function HomeScreenSurface() {
  return (
    <div
      className="guide-dim-in"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 24,
        background:
          "linear-gradient(155deg,#1e63c8 0%,#2f9fd0 32%,#63d3c2 56%,#cfeee6 78%,#eaf6f2 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 66,
          left: 18,
          right: 18,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          rowGap: 16,
          columnGap: 12,
        }}
      >
        {HOME_APPS.map((color) => (
          <div key={color}>
            <div
              data-home-app
              style={{
                width: 46,
                height: 46,
                borderRadius: 11,
                background: color,
                opacity: 0.92,
                margin: "0 auto",
              }}
            />
            <div
              style={{
                margin: "5px auto 0",
                width: 30,
                height: 5,
                borderRadius: 3,
                background: "rgba(255,255,255,0.45)",
              }}
            />
          </div>
        ))}

        <div>
          <div
            data-home-app
            style={{
              width: 46,
              height: 46,
              borderRadius: 11,
              background: "#111014",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
              boxShadow: "0 0 0 2px rgba(255,255,255,0.55), 0 4px 12px rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ width: 19, height: 19, borderRadius: "50%", background: POINT }} />
          </div>
          <div
            style={{
              marginTop: 5,
              textAlign: "center",
              fontSize: 7.5,
              color: "#fff",
              textShadow: "0 1px 2px rgba(0,0,0,0.5)",
              whiteSpace: "nowrap",
            }}
          >
            English Course
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          height: 62,
          borderRadius: 18,
          background: "rgba(255,255,255,0.26)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        {["#3aa0ff", "#3ddc60"].map((color) => (
          <div
            key={color}
            data-home-app
            style={{ width: 44, height: 44, borderRadius: 11, background: color }}
          />
        ))}
      </div>
    </div>
  );
}

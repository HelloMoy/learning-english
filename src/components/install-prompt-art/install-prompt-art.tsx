"use client";

/**
 * The picture is of the learner's own system, not of this app, so it is drawn
 * with its own colours and fixed sizes rather than the project's theme tokens —
 * the same reasoning the install guides' depictions use. It should not follow
 * this app's light/dark mode, because the learner's home screen does not.
 */
const SYSTEM = {
  homeWallpaper: "linear-gradient(150deg,#2f5f7a,#63a08f 65%,#c9d6cf)",
  deskWallpaper: "linear-gradient(145deg,#1b3245,#3d6470 60%,#93a9a4)",
  placeholder: "rgba(255,255,255,0.32)",
  switcherTray: "rgba(20,22,28,0.62)",
} as const;

/** The app's gold, used for its own icon and to pick it out from the rest. */
const GOLD = "#e7b64c";

/** Which resting place the prompt is promising. */
type InstallPromptSurface = "handheld" | "desktop";

type InstallPromptArtProps = {
  /** The platform whose resting place to draw. */
  surface: InstallPromptSurface;
};

/**
 * A picture of where the course will come to rest, drawn per platform.
 *
 * @remarks
 * The install guides on Safari all end on a frame showing the icon already in
 * place, because a guide that stops at the confirmation asks for effort and
 * never shows the payoff. The prompt used to make the same omission in one
 * screen, showing only its own icon at 48px. This is that missing frame.
 *
 * Each platform gets the resting place it actually has:
 *
 * - **handheld** — the icon on the home screen among the learner's other apps,
 *   the same frame the iOS and iPad guides end on, so all the surfaces now tell
 *   one story.
 * - **desktop** — the course in the application switcher. This argues from
 *   **presence** rather than from the absence of tabs, and the claim is exact: a
 *   browser tab never appears there. It is also the only desktop drawing that
 *   looks the same on macOS and on Windows.
 *
 * It is drawn rather than photographed, so it carries no operating system the
 * learner may not have: no vendor marks, no real chrome, nothing that claims to
 * be a specific system.
 *
 * It is `aria-hidden` and contributes no text. The prompt states what the
 * learner gains in words, and this repeats it in a picture; a screen reader
 * walking a drawing of someone else's home screen would only be noise.
 *
 * @example
 * ```tsx
 * <InstallPromptArt surface="desktop" />
 * ```
 *
 * @param props - See {@link InstallPromptArtProps}
 * @returns A decorative picture of the platform's resting place
 * @category Components
 */
export function InstallPromptArt({ surface }: InstallPromptArtProps) {
  return surface === "handheld" ? <HomeScreen /> : <AppSwitcher />;
}

/** The app's icon: black plate, cinema letterbox bars, gold disc. */
function AppIcon({
  size,
  radius = "24%",
  square = false,
}: {
  size: number | string;
  radius?: number | string;
  square?: boolean;
}) {
  return (
    <span
      data-slot="app-icon"
      style={{
        position: "relative",
        width: size,
        ...(square ? { aspectRatio: "1" } : { height: size }),
        borderRadius: radius,
        overflow: "hidden",
        background: "#08080b",
        display: "block",
        flexShrink: 0,
      }}
    >
      <span style={{ position: "absolute", inset: "0 0 87% 0", background: "#000" }} />
      <span style={{ position: "absolute", inset: "87% 0 0 0", background: "#000" }} />
      <span
        style={{ position: "absolute", inset: "26% 24%", borderRadius: "50%", background: GOLD }}
      />
    </span>
  );
}

/**
 * An app the learner already has, with no claim about which one.
 *
 * @remarks
 * `square` is for the home screen, whose cells are fluid: there a height of
 * `100%` resolves against a cell that has none, and the icons come out as wide
 * rectangles. The switcher sizes its own row in pixels and does not need it.
 */
function OtherApp({
  size,
  radius,
  square = false,
}: {
  size: number | string;
  radius: number | string;
  square?: boolean;
}) {
  return (
    <span
      style={{
        width: size,
        ...(square ? { aspectRatio: "1" } : { height: size }),
        borderRadius: radius,
        background: SYSTEM.placeholder,
        display: "block",
        flexShrink: 0,
      }}
    />
  );
}

/** Where a handheld puts it: on the home screen, beside everything else. */
function HomeScreen() {
  const NEW_APP_AT = 2;

  return (
    <div
      aria-hidden="true"
      data-slot="home-screen"
      style={{
        background: SYSTEM.homeWallpaper,
        borderRadius: 12,
        padding: "16px 14px",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "14px 12px",
      }}
    >
      {/* No caption bars under the icons. They stood in for each app's name, but
          at this size three pixels of line reads as an underline rather than as
          text, and four meaningless marks bought nothing: the grid already reads
          as a home screen, and the ring says which icon is the new one. */}
      {Array.from({ length: 4 }, (_, index) =>
        index === NEW_APP_AT ? (
          <span
            key={index}
            style={{
              width: "100%",
              aspectRatio: "1",
              borderRadius: "24%",
              boxShadow: `0 0 0 2px ${GOLD}, 0 0 16px -2px ${GOLD}`,
              display: "block",
            }}
          >
            <AppIcon
              size="100%"
              square
            />
          </span>
        ) : (
          <OtherApp
            key={index}
            size="100%"
            radius="24%"
            square
          />
        ),
      )}
    </div>
  );
}

/**
 * Where a desktop puts it: among the running applications.
 *
 * @remarks
 * A browser tab never appears here, which is what makes this the sharpest claim
 * available on a desktop — and the only one that looks the same on macOS and on
 * Windows.
 */
function AppSwitcher() {
  return (
    <div
      aria-hidden="true"
      data-slot="app-switcher"
      style={{
        background: SYSTEM.deskWallpaper,
        borderRadius: 12,
        padding: "26px 14px",
        display: "grid",
        placeItems: "center",
      }}
    >
      <span
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          padding: "11px 13px",
          borderRadius: 16,
          background: SYSTEM.switcherTray,
        }}
      >
        <OtherApp
          size={32}
          radius="24%"
        />
        <OtherApp
          size={32}
          radius="24%"
        />
        <span
          style={{
            padding: 3,
            borderRadius: "27%",
            boxShadow: `0 0 0 2px ${GOLD}`,
            display: "block",
          }}
        >
          <AppIcon size={32} />
        </span>
        <OtherApp
          size={32}
          radius="24%"
        />
        <OtherApp
          size={32}
          radius="24%"
        />
      </span>
    </div>
  );
}

import NiceModal from "@ebay/nice-modal-react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect } from "react";

import { InstallPromptModal, type InstallPromptSurface } from "./install-prompt-modal";

/**
 * Storybook runs in a desktop browser, so the handheld wording is unreachable
 * unless the pointer query is answered for it. The patch lives here and nowhere
 * near production, which reads the real query.
 */
function answerPointerQuery(surface: InstallPromptSurface) {
  const real = window.matchMedia.bind(window);

  window.matchMedia = ((query: string) =>
    query.includes("pointer: coarse")
      ? { ...real(query), matches: surface === "handheld", media: query }
      : real(query)) as typeof window.matchMedia;

  return () => {
    window.matchMedia = real;
  };
}

/**
 * The prompt is shown imperatively, so the story opens it on mount inside the
 * modal provider.
 */
function OpenedInstallPromptModal({ surface }: { surface: InstallPromptSurface }) {
  useEffect(() => {
    const restore = answerPointerQuery(surface);
    void NiceModal.show(InstallPromptModal, { onAccept: () => {} });

    return () => {
      void NiceModal.hide(InstallPromptModal);
      restore();
    };
  }, [surface]);

  return (
    <NiceModal.Provider>
      <div className="min-h-64" />
    </NiceModal.Provider>
  );
}

const meta = {
  title: "Components/InstallPromptModal",
  component: OpenedInstallPromptModal,
  args: { surface: "desktop" },
  argTypes: {
    surface: { control: { type: "inline-radio" }, options: ["handheld", "desktop"] },
  },
} satisfies Meta<typeof OpenedInstallPromptModal>;

export default meta;
type Story = StoryObj<typeof meta>;

/** On a desktop, where there is a dock rather than a home screen. */
export const OnADesktop: Story = {};

/**
 * On a phone, where the wording is the one Chrome's own menu uses and the copy
 * has the least room.
 */
export const OnAHandheld: Story = {
  args: { surface: "handheld" },
  parameters: { viewport: { defaultViewport: "mobile1" } },
};

/** The Spanish wording, which is the longest of the three. */
export const InSpanish: Story = {
  args: { surface: "handheld" },
  parameters: { locale: "es" },
};

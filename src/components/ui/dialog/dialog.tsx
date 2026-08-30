"use client";

import { cn } from "@/lib/utils/utils";

import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog as DialogPrimitive } from "radix-ui";
import * as React from "react";

/**
 * shadcn/ui `Dialog` root — the state machine behind a modal.
 *
 * Controls whether the dialog is open, either uncontrolled (via
 * `DialogTrigger`) or controlled through `open` / `onOpenChange`. Renders no
 * DOM of its own.
 *
 * @remarks
 * Built on the `radix-ui` unified package already used by `Button`, so the
 * whole tree ships without a per-primitive dependency. Radix supplies the
 * behaviour this project must not re-implement: focus trap and restore, scroll
 * lock, `aria-hidden` on background content, and dismissal on `Escape` or an
 * outside click.
 *
 * Note that Radix enforces modality by hiding the rest of the document from
 * assistive technology, **not** by setting `aria-modal` — that attribute is
 * absent by design, and asserting on it would be asserting on the weaker of the
 * two techniques.
 *
 * Modals in this project are opened imperatively through
 * `@ebay/nice-modal-react` rather than by conditionally rendering a `Dialog`
 * as a child — see `AGENTS.md` §Modals and
 * `src/components/modals/lesson-video-resume-modal/`.
 *
 * @example Controlled by NiceModal
 * ```tsx
 * const modal = useModal();
 *
 * <Dialog open={modal.visible} onOpenChange={modal.hide}>
 *   <DialogContent>…</DialogContent>
 * </Dialog>
 * ```
 */
function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return (
    <DialogPrimitive.Root
      data-slot="dialog"
      {...props}
    />
  );
}

/**
 * The element that opens the dialog. Pass `asChild` to project the trigger
 * behaviour onto your own button instead of rendering a nested one.
 */
function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return (
    <DialogPrimitive.Trigger
      data-slot="dialog-trigger"
      {...props}
    />
  );
}

/**
 * Portal that lifts the dialog out of the DOM position where it was declared
 * and mounts it at the document root.
 *
 * @remarks
 * `DialogContent` already wraps itself in one, so callers rarely need this
 * directly. It matters for tests: portalled content is **not** inside the
 * container returned by RTL's `render`, so assertions must go through `screen`
 * or `document`.
 */
function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return (
    <DialogPrimitive.Portal
      data-slot="dialog-portal"
      {...props}
    />
  );
}

/**
 * Closes the dialog when activated. Use `asChild` to turn any element — most
 * often a `Button` — into a close affordance.
 */
function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return (
    <DialogPrimitive.Close
      data-slot="dialog-close"
      {...props}
    />
  );
}

/**
 * The dimmed backdrop behind an open dialog.
 *
 * @remarks
 * Rendered at `bg-black/80` rather than shadcn's stock `bg-black/50`: the
 * dialog most often opens over a video frame, and a lighter scrim leaves the
 * card competing with the imagery behind it.
 */
function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/80 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Props accepted by {@link DialogContent}.
 *
 * Extends Radix's content props with one addition:
 *   - `showCloseButton` — render the built-in "✕" affordance in the corner
 */
export type DialogContentProps = React.ComponentProps<typeof DialogPrimitive.Content> & {
  /**
   * Render the built-in close button in the top-right corner. Set `false`
   * when the dialog supplies its own explicit dismissal action and a second
   * one would be redundant.
   * @default true
   */
  showCloseButton?: boolean;
};

/**
 * The dialog card itself — portalled, centered, and layered over a
 * {@link DialogOverlay}.
 *
 * @remarks
 * Styled on the project's tokens rather than shadcn's stock neutrals:
 * `bg-card` is the Immersion Cinema panel surface shared with the outline
 * sidebar, and `rounded-xl` matches those panels' radius.
 *
 * It is also capped at `max-h-[calc(100svh-2rem)]` and scrolls internally.
 * shadcn's stock content sets no max height, which is fine until the card is
 * taller than the viewport: because it is `position: fixed`, the page cannot
 * scroll to reveal the overflow, so the footer — and with it the primary
 * action — becomes literally unreachable. `svh` rather than `vh` so a mobile
 * browser's collapsing URL bar cannot reintroduce the same trap.
 *
 * **Accessibility:** every `DialogContent` must contain a {@link DialogTitle},
 * which supplies its accessible name — Radix warns at runtime when one is
 * missing. If the design has no visible heading, render the title visually
 * hidden rather than dropping it. Pair it with a {@link DialogDescription} so
 * screen readers get the dialog's purpose, not just its name.
 *
 * @example
 * ```tsx
 * <DialogContent className="sm:max-w-md">
 *   <DialogHeader>
 *     <DialogTitle>Resume playback</DialogTitle>
 *     <DialogDescription>Pick up where you left off.</DialogDescription>
 *   </DialogHeader>
 *   <DialogFooter>
 *     <Button>Resume</Button>
 *   </DialogFooter>
 * </DialogContent>
 * ```
 */
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogContentProps) {
  const t = useTranslations("Components.Dialog");

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed top-[50%] left-[50%] z-50 grid max-h-[calc(100svh-2rem)] w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 overflow-y-auto rounded-xl border border-border bg-card p-6 text-card-foreground shadow-2xl duration-200 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-lg",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-4 right-4 rounded-md p-1 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">{t("closeLabel")}</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

/**
 * Stacks a {@link DialogTitle} and {@link DialogDescription} at the top of the
 * card. Centered on narrow screens, left-aligned from `sm` up.
 */
function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

/**
 * Action row at the bottom of the card. Buttons stack in reverse order on
 * narrow screens so the primary action sits closest to the thumb, and align
 * to the trailing edge from `sm` up.
 */
function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

/**
 * The dialog's heading. Supplies the accessible name of the surrounding
 * {@link DialogContent} — required, even when visually hidden.
 */
function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold text-foreground", className)}
      {...props}
    />
  );
}

/**
 * Supporting copy under the title. Wired to the dialog's `aria-describedby`,
 * so this is what a screen reader reads after the name.
 */
function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};

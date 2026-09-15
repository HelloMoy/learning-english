"use client";

import { cn } from "@/lib/utils/utils";

import { Tooltip as TooltipPrimitive } from "radix-ui";
import * as React from "react";

/**
 * shadcn/ui `TooltipProvider` — shares the open delay across the tooltips
 * inside it.
 *
 * @remarks
 * {@link Tooltip} already wraps itself in one, as current shadcn does, so a
 * caller never has to mount a provider at the app root.
 *
 * @param delayDuration - Milliseconds before a hovered trigger opens its tooltip
 */
function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

/**
 * shadcn/ui `Tooltip` root — a short, supplementary label that appears while
 * its trigger is hovered or focused.
 *
 * @remarks
 * Built on the `radix-ui` unified package already used by `Button`, `Dialog`
 * and `DropdownMenu`. Radix supplies the behaviour: open on hover and on
 * keyboard focus, close on `Escape`, `role="tooltip"` content referenced from
 * the trigger through `aria-describedby` while open.
 *
 * A tooltip never carries information a learner needs to act. Radix does not
 * open tooltips on touch, so anything essential must also be on screen.
 *
 * @example
 * ```tsx
 * <Tooltip>
 *   <TooltipTrigger>4 of 48 videos</TooltipTrigger>
 *   <TooltipContent>8% of the course watched</TooltipContent>
 * </Tooltip>
 * ```
 */
function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root
        data-slot="tooltip"
        {...props}
      />
    </TooltipProvider>
  );
}

/**
 * The element that opens the tooltip. Renders a `button`, so it is reachable
 * by keyboard; pass `asChild` to project the behaviour onto your own element.
 */
function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      {...props}
    />
  );
}

/**
 * The tooltip bubble — portalled, positioned against the trigger, with an
 * arrow, on the Immersion Cinema panel surface shared with the dropdown menu:
 * popover fill, a hairline border and a deep shadow, so it reads as part of
 * the dark interface rather than a light chip laid on top of it.
 *
 * @param sideOffset - Gap in pixels between the trigger and the bubble
 */
function TooltipContent({
  className,
  sideOffset = 8,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-fit rounded-xl border border-border bg-popover px-3 py-2 text-xs font-semibold text-balance text-popover-foreground shadow-[0_18px_40px_-16px_rgba(0,0,0,0.85)] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=instant-open]:animate-in data-[state=instant-open]:fade-in-0",
          className,
        )}
        {...props}
      >
        {children}
        {/* The stroke draws the border's two slanted edges; its base sits on the
            bubble's own border line, in the same colour. */}
        <TooltipPrimitive.Arrow className="h-1.5 w-3 fill-popover stroke-border" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };

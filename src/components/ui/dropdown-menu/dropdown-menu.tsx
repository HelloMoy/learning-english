"use client";

import { cn } from "@/lib/utils/utils";

import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import * as React from "react";

/**
 * shadcn/ui `DropdownMenu` root — the state machine behind a menu.
 *
 * Controls whether the menu is open, either uncontrolled (via
 * {@link DropdownMenuTrigger}) or controlled through `open` / `onOpenChange`.
 * Renders no DOM of its own.
 *
 * @remarks
 * Built on the `radix-ui` unified package already used by `Button` and
 * `Dialog`, so the whole tree ships without a per-primitive dependency. Radix
 * supplies the behaviour this project must not re-implement: roving focus
 * across items, type-ahead, dismissal on `Escape` or an outside click, and
 * focus restored to the trigger on close.
 *
 * This primitive is deliberately scoped to **single-choice menus** — the shape
 * {@link "@/components/locale-switcher/locale-switcher"} needs. Sub-menus,
 * checkbox items, group labels, separators, and shortcut slots are not ported;
 * shipping the full shadcn registry surface for one consumer would be
 * speculative generality. Add a part when a caller actually needs it.
 *
 * @example
 * ```tsx
 * <DropdownMenu>
 *   <DropdownMenuTrigger aria-label="Language: English">EN</DropdownMenuTrigger>
 *   <DropdownMenuContent>
 *     <DropdownMenuRadioGroup value={locale} onValueChange={setLocale}>
 *       <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
 *     </DropdownMenuRadioGroup>
 *   </DropdownMenuContent>
 * </DropdownMenu>
 * ```
 */
function DropdownMenu({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return (
    <DropdownMenuPrimitive.Root
      data-slot="dropdown-menu"
      {...props}
    />
  );
}

/**
 * The element that opens the menu. Pass `asChild` to project the trigger
 * behaviour onto your own button instead of rendering a nested one.
 *
 * @remarks
 * Radix wires `aria-haspopup` and `aria-expanded` here. When the trigger's
 * visible text is an abbreviation, give it an explicit `aria-label` naming the
 * full concept — otherwise a screen reader announces the abbreviation.
 */
function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  );
}

/**
 * Portal that lifts the menu out of the DOM position where it was declared and
 * mounts it at the document root.
 *
 * @remarks
 * {@link DropdownMenuContent} already wraps itself in one, so callers rarely
 * need this directly. It matters twice: a menu opened from inside a clipped or
 * transformed ancestor would otherwise be cut off by it, and in tests portalled
 * content is **not** inside the container returned by RTL's `render`, so
 * assertions must go through `screen` or `document`.
 */
function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal
      data-slot="dropdown-menu-portal"
      {...props}
    />
  );
}

/**
 * The menu surface itself — portalled, positioned against the trigger, and
 * styled on the Immersion Cinema panel tokens shared with the dialog and the
 * outline sidebar.
 *
 * @param sideOffset - Gap in pixels between the trigger and the menu
 */
function DropdownMenuContent({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPortal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-2xl data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      />
    </DropdownMenuPortal>
  );
}

/**
 * Groups {@link DropdownMenuRadioItem}s into one single-choice set. Exactly one
 * item is checked at a time, reflecting `value`.
 */
function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}

/**
 * One option in a {@link DropdownMenuRadioGroup}, exposed as `menuitemradio`
 * with its checked state in `aria-checked`.
 *
 * @remarks
 * Stock shadcn reserves a fixed left inset and absolutely positions the check
 * mark into it. This keeps the indicator in flow instead, so an item without a
 * {@link DropdownMenuItemIndicator} does not leave a dead gutter.
 */
function DropdownMenuRadioItem({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none select-none focus:bg-foreground/10 focus:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[state=checked]:text-gold",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Renders its children only while the surrounding item is checked. Place it
 * inside a {@link DropdownMenuRadioItem} to mark the current choice.
 *
 * @remarks
 * The mark is decorative: `aria-checked` on the item is what assistive
 * technology reads, so the indicator is hidden from the accessibility tree to
 * avoid announcing the state twice.
 */
function DropdownMenuItemIndicator({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.ItemIndicator>) {
  return (
    <DropdownMenuPrimitive.ItemIndicator
      data-slot="dropdown-menu-item-indicator"
      aria-hidden="true"
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItemIndicator,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
};

import { cn } from "@/lib/utils/utils";

import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

/**
 * Class-name generator for the `Button` primitive.
 *
 * Built with `class-variance-authority` so each combination of `variant`
 * and `size` produces a fully-typed Tailwind class string. Exported so
 * callers (e.g. `<Link asChild>` wrappers, custom triggers) can reuse the
 * exact same styling without re-declaring it.
 *
 * Variants:
 *   - `default`     — solid filled button, primary brand color
 *   - `outline`     — bordered, transparent background
 *   - `secondary`   — softer secondary background
 *   - `ghost`      — no background until hover/focus
 *   - `destructive` — red-tinted, reserved for irreversible actions
 *   - `link`        — renders as a plain text link
 *
 * Sizes:
 *   - `xs` / `sm` / `default` / `lg` — content-bearing sizes (icon or label)
 *   - `icon` / `icon-xs` / `icon-sm` / `icon-lg` — square icon-only buttons
 */
export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/**
 * Props accepted by the {@link Button} component.
 *
 * Extends the native `<button>` props with two additions:
 *   - `variant`  — see {@link buttonVariants} for the full list
 *   - `size`     — see {@link buttonVariants} for the full list
 *   - `asChild`  — when `true`, renders a Radix `Slot` so the button's
 *                  styles are forwarded to the single child element
 *                  (e.g. wrapping `<Link>` so an anchor looks like a button).
 */
export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /**
     * Render as a Radix `Slot`, merging the button's className/attributes
     * into the immediate child. Useful when the child must be a different
     * element (e.g. `<Link>` for client-side navigation, `<a>` for external).
     * @default false
     */
    asChild?: boolean;
  };

/**
 * shadcn/ui `Button` primitive.
 *
 * Renders an accessible `<button>` by default, or a Radix `Slot` when
 * `asChild` is `true` (to compose with other clickable elements like
 * `<Link>` from `next/link` or `@/i18n/navigation`).
 *
 * The element exposes `data-slot`, `data-variant`, and `data-size`
 * attributes so parent components can style descendants (e.g. a
 * `<ButtonGroup>` adjusting the radius of its children).
 *
 * @example Default usage
 * ```tsx
 * <Button>Save</Button>
 * ```
 *
 * @example Destructive action
 * ```tsx
 * <Button variant="destructive" onClick={onDelete}>Delete</Button>
 * ```
 *
 * @example Composing with Link (client-side navigation)
 * ```tsx
 * import { Link } from "@/i18n/navigation";
 *
 * <Button asChild>
 *   <Link href="/dashboard">Go to dashboard</Link>
 * </Button>
 * ```
 */
export function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

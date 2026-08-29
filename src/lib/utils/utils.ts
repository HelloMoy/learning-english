import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Joins a list of class names, dropping falsy values.
 *
 * @remarks
 * Wraps `clsx` and then resolves Tailwind conflicts with `tailwind-merge`.
 * Use this instead of `clsx` everywhere in the app — the merge step is what
 * makes a caller's `px-4` win over a component's default `px-2` instead of
 * both landing in the class list and letting stylesheet order decide.
 *
 * @example
 * ```ts
 * cn("px-2", isActive && "bg-blue-500", undefined); // "px-2 bg-blue-500"
 * cn("px-2", "px-4"); // "px-4" — the later utility wins
 * ```
 *
 * @param inputs - Class names, arrays, objects, or falsy values to merge
 * @returns A single space-separated class string with falsy values dropped
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

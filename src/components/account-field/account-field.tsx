"use client";

import { cn } from "@/lib/utils/utils";

import { useId } from "react";

/**
 * Props for {@link AccountField}.
 */
export type AccountFieldProps = {
  /** The form field name, also used for `autoComplete` defaults by the caller. */
  name: string;
  /** The visible label. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  /** A standing explanation under the field, such as the password rule. */
  hint?: string;
  /** The current problem with the value, already translated. */
  error?: string;
};

/**
 * One labelled input of an account form.
 *
 * @remarks
 * The label is always visible. The hint and the error are both linked to the
 * input through `aria-describedby`; the error also marks the input
 * `aria-invalid` and is rendered as an alert, so it is announced when it
 * appears.
 *
 * @example
 * ```tsx
 * <AccountField name="email" type="email" label={t("fields.email")}
 *   value={email} onChange={setEmail} error={errors.email && t(`validation.${errors.email}`)} />
 * ```
 */
export function AccountField({
  name,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  hint,
  error,
}: AccountFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5 text-left">
      <label
        htmlFor={id}
        className="text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          error && "border-destructive focus-visible:ring-destructive/20",
        )}
      />
      {hint ? (
        <p
          id={hintId}
          className="text-xs text-muted-foreground"
        >
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

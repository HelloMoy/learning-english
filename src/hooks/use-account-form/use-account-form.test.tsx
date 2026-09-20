import { signUpSchema } from "@/lib/account-form-schemas/account-form-schemas";
import { MESSAGES } from "@/test-setup/render-in-locale";

import { act, renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, test } from "vitest";

import { useAccountForm } from "./use-account-form";

const inSpanish = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider
    locale="es"
    messages={MESSAGES.es}
  >
    {children}
  </NextIntlClientProvider>
);

const renderForm = () =>
  renderHook(() => useAccountForm(signUpSchema, { name: "", email: "", password: "" }), {
    wrapper: inSpanish,
  });

describe("useAccountForm", () => {
  test("WHEN a field changes THEN its value is kept", () => {
    const { result } = renderForm();

    act(() => result.current.field("email").onChange("ana@example.com"));

    expect(result.current.values.email).toBe("ana@example.com");
    expect(result.current.field("email").value).toBe("ana@example.com");
  });

  test("WHEN validated with bad values THEN it fails and each field carries its translated error", () => {
    const { result } = renderForm();

    let isValid = true;
    act(() => {
      isValid = result.current.validate();
    });

    expect(isValid).toBe(false);
    expect(result.current.field("name").error).toBe("Escribe tu nombre.");
    expect(result.current.field("password").error).toBe("Usa entre 8 y 128 caracteres.");
  });

  test("WHEN validated with good values THEN it passes and no field carries an error", () => {
    const { result } = renderForm();
    act(() => {
      result.current.field("name").onChange("Ana");
      result.current.field("email").onChange("ana@example.com");
      result.current.field("password").onChange("long-enough-1");
    });

    let isValid = false;
    act(() => {
      isValid = result.current.validate();
    });

    expect(isValid).toBe(true);
    expect(result.current.field("name").error).toBeUndefined();
  });
});
